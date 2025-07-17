// client-portal/src/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('clientToken'));
  const [isLoading, setIsLoading] = useState(true); // To indicate if initial auth check is done

  // Ensure logout function has a stable reference
  const logout = useCallback(() => { // Wrapped logout in useCallback
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    setUser(null);
    setToken(null);
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    const storedToken = localStorage.getItem('clientToken');
    const storedUser = localStorage.getItem('clientUser');

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        // Clear invalid stored data
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem('clientToken', userToken);
    localStorage.setItem('clientUser', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  };

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'x-auth-token': token, // Add the token to every request
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      // If unauthorized or forbidden, log out the user
      logout(); // logout is now stable due to its own useCallback
      window.location.href = '/login'; // Redirect to login page
    }

    return response;
  }, [token, logout]); // logout is now a stable dependency


  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, isLoading, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};