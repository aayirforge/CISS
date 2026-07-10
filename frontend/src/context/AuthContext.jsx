import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set default authorization header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        // Only fetch profile on page refresh (token in localStorage but no user in memory)
        // Skip this after login() since we already have the user data
        try {
          const res = await axios.get('/api/auth/profile');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to load profile, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData } = res.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return userData;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Authentication failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateProfileState,
    hasRole,
    isAdmin: () => hasRole(['Admin', 'Super Admin']),
    isHR: () => hasRole(['Admin', 'Super Admin', 'HR Manager']),
    isAccountant: () => hasRole(['Accountant', 'Senior Accountant']),
    isEmployee: () => hasRole('Employee')
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
