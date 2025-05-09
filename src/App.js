import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import {AuthProvider} from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './components/auth/AuthStyles.css';

// Placeholder for dashboard component
const Dashboard = () => (
    <div style={{padding: 20}}>
      <h1>Lost and Found Dashboard</h1>
      <p>Welcome to the Lost and Found app. This is a protected route that requires authentication.</p>
    </div>
);

function App() {
  return (
      <Router>
          <AuthProvider>
              <div className="App">
                  <Routes>
                      <Route path="/login" element={<Login/>}/>
                      <Route path="/register" element={<Register/>}/>
                      <Route path="/forgot-password" element={<ForgotPassword/>}/>
                      <Route
                          path="/dashboard"
                          element={
                              <ProtectedRoute>
                                  <Dashboard/>
                              </ProtectedRoute>
                          }
                      />
                      <Route path="/" element={<Navigate to="/login"/>}/>
                  </Routes>
              </div>
          </AuthProvider>
      </Router>
  );
}

export default App;