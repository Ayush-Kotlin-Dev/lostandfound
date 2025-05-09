import React, {useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {Link} from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [localError, setLocalError] = useState('');
    const {resetPassword, error: authError} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setLocalError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            setLocalError('');
            setMessage('');
            await resetPassword(email);
            setMessage('Check your inbox for further instructions');
        } catch (err) {
            setLocalError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-container">
                <h2>Reset Password</h2>
                {message && (
                    <div className="success-message">
                        {message}
                    </div>
                )}
                {(localError || authError) && (
                    <div className="error-message">
                        {localError || authError}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
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
                    <button
                        className="auth-button primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>
                </form>
                <div className="auth-links">
                    <p>
                        <Link to="/login">Back to Login</Link>
                    </p>
                    <p>
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}