import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import {AuthProvider} from './context/AuthContext';
import {ItemsProvider} from './context/ItemsContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './components/auth/AuthStyles.css';
import Dashboard from './components/Dashboard';
import './components/Dashboard.css';
import ReportItemForm from './components/items/ReportItemForm';
import ProfileScreen from './components/profile/ProfileScreen';
import MyItemsScreen from './components/items/MyItemsScreen';
import EditItemForm from './components/items/EditItemForm';

function App() {
  return (
      <Router>
          <AuthProvider>
              <ItemsProvider>
                  <div className="App">
                      <Routes>
                          <Route path="/login" element={<Login/>}/>
                          <Route path="/register" element={<Register/>}/>
                          <Route path="/forgot-password" element={<ForgotPassword/>}/>

                          {/* Protected Routes */}
                          <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
                          <Route path="/report-item" element={<ProtectedRoute><ReportItemForm/></ProtectedRoute>}/>
                          <Route path="/profile" element={<ProtectedRoute><ProfileScreen/></ProtectedRoute>}/>
                          <Route path="/my-items" element={<ProtectedRoute><MyItemsScreen/></ProtectedRoute>}/>
                          <Route path="/edit-item/:id" element={<ProtectedRoute><EditItemForm/></ProtectedRoute>}/>

                          <Route path="/" element={<Navigate to="/dashboard"/>}/>
                      </Routes>
                  </div>
              </ItemsProvider>
          </AuthProvider>
      </Router>
  );
}

export default App;