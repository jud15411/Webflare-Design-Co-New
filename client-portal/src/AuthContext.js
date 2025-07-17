// client-portal/src/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Added useCallback here

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('clientToken'));
  const [isLoading, setIsLoading] = useState(true); // To indicate if initial auth check is done

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

  const logout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUser');
    setUser(null);
    setToken(null);
  };

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'x-auth-token': token, // Add the token to every request
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
      // If unauthorized or forbidden, log out the user
      logout();
      window.location.href = '/login'; // Redirect to login page
    }

    return response;
  }, [token, logout]); // Added logout to dependency array as it's a stable function from useCallback and will be defined once

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, isLoading, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};