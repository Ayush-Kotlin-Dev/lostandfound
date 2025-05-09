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
import {doc, setDoc, getDoc, serverTimestamp} from 'firebase/firestore';

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
        error
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};