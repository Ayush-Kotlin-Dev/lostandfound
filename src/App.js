import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import {AuthProvider} from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './components/auth/AuthStyles.css';
import Dashboard from './components/Dashboard';
import './components/Dashboard.css';

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