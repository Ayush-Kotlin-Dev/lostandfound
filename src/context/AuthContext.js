import React, {createContext, useContext, useEffect, useState} from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import {auth} from '../firebase/config';

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

    // Clear error message after 5 seconds
    useEffect(() => {
        if (error) {
            const timeout = setTimeout(() => {
                setError('');
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [error]);

    // Register user with email and password
    const signup = async (email, password, displayName) => {
        try {
            setError('');
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update the user's profile with displayName
            await updateProfile(result.user, {displayName});
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
            return await signInWithPopup(auth, provider);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Logout
    const logout = async () => {
        try {
            setError('');
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
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
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