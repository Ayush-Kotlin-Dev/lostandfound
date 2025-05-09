import React, {useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {Link, useNavigate} from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const {login, loginWithGoogle, error: authError} = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setLocalError('Please enter both email and password');
            return;
        }

        try {
            setLoading(true);
            setLocalError('');
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setLocalError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setLocalError('');
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setLocalError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-container">
                <h2>Login to Lost and Found</h2>
                {(localError || authError) && (
                    <div className="error-message">
                        {localError || authError}
                    </div>
                )}
                <form onSubmit={handleLogin}>
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
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button
                        className="auth-button primary-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="divider">
                    <span>OR</span>
                </div>
                <button
                    className="auth-button google-button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <span className="google-icon">G</span>
                    {loading ? 'Processing...' : 'Sign in with Google'}
                </button>
                <div className="auth-links">
                    <Link to="/forgot-password">Forgot Password?</Link>
                    <p>
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}