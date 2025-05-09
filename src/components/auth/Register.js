import React, {useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {Link, useNavigate} from 'react-router-dom';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const {signup, loginWithGoogle, error: authError} = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        // Form validation
        if (!email || !password || !displayName) {
            setLocalError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setLocalError('Password should be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            setLocalError('');
            await signup(email, password, displayName);
            navigate('/dashboard');
        } catch (err) {
            setLocalError(err.message || 'Failed to create an account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        try {
            setLoading(true);
            setLocalError('');
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setLocalError(err.message || 'Failed to sign up with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-container">
                <h2>Create an Account</h2>
                {(localError || authError) && (
                    <div className="error-message">
                        {localError || authError}
                    </div>
                )}
                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label htmlFor="displayName">Full Name</label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>
                    <button
                        className="auth-button primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                </form>
                <div className="divider">
                    <span>OR</span>
                </div>
                <button
                    className="auth-button google-button"
                    onClick={handleGoogleRegister}
                    disabled={loading}
                >
                    <span className="google-icon">G</span>
                    {loading ? 'Processing...' : 'Sign up with Google'}
                </button>
                <div className="auth-links">
                    <p>
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}