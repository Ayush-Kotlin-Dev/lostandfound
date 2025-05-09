import React, {createContext, useContext, useEffect, useState} from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import {auth, db} from '../firebase/config';
import {doc, setDoc, getDoc, updateDoc, serverTimestamp, increment} from 'firebase/firestore';

// Create the auth context first
const AuthContext = createContext();

// Then define the hook to use this context
export const useAuth = () => {
    return useContext(AuthContext);
};

// And finally define the provider component
export const AuthProvider = ({children}) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);

    // Set persistence to LOCAL (persists even when browser is closed)
    useEffect(() => {
        setPersistence(auth, browserLocalPersistence)
            .catch(err => {
                console.error("Error setting persistence:", err);
            });
    }, []);

    // Clear error message after 5 seconds
    useEffect(() => {
        if (error) {
            const timeout = setTimeout(() => {
                setError('');
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [error]);

    // Store user data in Firestore
    const createUserDocument = async (user, additionalData = {}) => {
        if (!user) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            const snapshot = await getDoc(userRef);

            if (!snapshot.exists()) {
                const {email, displayName, photoURL} = user;

                await setDoc(userRef, {
                    displayName,
                    email,
                    photoURL,
                    createdAt: serverTimestamp(),
                    // Initialize contribution stats
                    contributions: {
                        itemsFound: 0,
                        itemsReturned: 0,
                        totalPoints: 0,
                        lastContributionDate: null
                    },
                    ...additionalData
                });
            }

            return userRef;
        } catch (err) {
            console.error("Error creating user document:", err);
        }
    };

    // Fetch user data from Firestore
    const fetchUserData = async (user) => {
        if (!user) {
            setUserData(null);
            return;
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            const snapshot = await getDoc(userRef);

            if (snapshot.exists()) {
                setUserData({id: user.uid, ...snapshot.data()});
            } else {
                // If user document doesn't exist yet, create it
                await createUserDocument(user);
                // Then fetch the data again
                const newSnapshot = await getDoc(userRef);
                if (newSnapshot.exists()) {
                    setUserData({id: user.uid, ...newSnapshot.data()});
                }
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
        }
    };

    // Update user contributions
    const updateUserContributions = async (userId, contributionType) => {
        if (!userId) return;

        try {
            const userRef = doc(db, 'users', userId);

            // Different point values for different contribution types
            let pointsToAdd = 0;

            switch (contributionType) {
                case 'itemFound':
                    pointsToAdd = 10;
                    await updateDoc(userRef, {
                        'contributions.itemsFound': increment(1),
                        'contributions.totalPoints': increment(pointsToAdd),
                        'contributions.lastContributionDate': serverTimestamp()
                    });
                    break;
                case 'itemReturned':
                    pointsToAdd = 15;
                    await updateDoc(userRef, {
                        'contributions.itemsReturned': increment(1),
                        'contributions.totalPoints': increment(pointsToAdd),
                        'contributions.lastContributionDate': serverTimestamp()
                    });
                    break;
                default:
                    break;
            }

            // Refresh user data if it's the current user
            if (currentUser && userId === currentUser.uid) {
                await fetchUserData(currentUser);
            }

            return pointsToAdd;
        } catch (err) {
            console.error("Error updating user contributions:", err);
            return 0;
        }
    };

    // Get user reputation level
    const getUserReputationLevel = (points) => {
        if (!points && userData?.contributions?.totalPoints) {
            points = userData.contributions.totalPoints;
        }

        if (!points) return {level: 'Newcomer', color: '#777'};

        if (points < 50) return {level: 'Newcomer', color: '#777'};
        if (points < 100) return {level: 'Helper', color: '#4CAF50'};
        if (points < 200) return {level: 'Contributor', color: '#2196F3'};
        if (points < 400) return {level: 'Benefactor', color: '#9C27B0'};

        return {level: 'Community Champion', color: '#FF9800'};
    };

    // Register user with email and password
    const signup = async (email, password, displayName) => {
        try {
            setError('');
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update the user's profile with displayName
            await updateProfile(result.user, {displayName});
            // Store user data in Firestore
            await createUserDocument(result.user);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Login with email and password
    const login = async (email, password) => {
        try {
            setError('');
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Login with Google
    const loginWithGoogle = async () => {
        try {
            setError('');
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            // Store user data in Firestore
            await createUserDocument(result.user);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Logout
    const logout = async () => {
        try {
            setError('');
            setUserData(null);
            await signOut(auth);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Reset password
    const resetPassword = async (email) => {
        try {
            setError('');
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Keep track of user's auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            await fetchUserData(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        error,
        updateUserContributions,
        getUserReputationLevel
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};