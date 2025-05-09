import React from 'react';
import {useAuth} from '../context/AuthContext';

export default function Dashboard() {
    const {currentUser, userData, logout} = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Lost and Found Dashboard</h1>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>

            <div className="user-welcome">
                <h2>Welcome, {currentUser?.displayName || 'User'}!</h2>
                <p>You are now logged in to the Lost and Found application.</p>
            </div>

            {userData && (
                <div className="user-data">
                    <h3>Your Profile</h3>
                    <div className="profile-info">
                        <p><strong>Name:</strong> {userData.displayName}</p>
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Account Created:</strong> {userData.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                </div>
            )}

            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h3>Lost Items</h3>
                    <p>You haven't reported any lost items yet.</p>
                    <button className="action-button">Report a Lost Item</button>
                </div>

                <div className="dashboard-section">
                    <h3>Found Items</h3>
                    <p>You haven't reported any found items yet.</p>
                    <button className="action-button">Report a Found Item</button>
                </div>
            </div>
        </div>
    );
}