import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('watchtower_token'));
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('watchtower_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('watchtower_token', access_token);
    setToken(access_token);
    setUser(userData);
    setIsDemo(false);
    
    return userData;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, { email, password, name });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('watchtower_token', access_token);
    setToken(access_token);
    setUser(userData);
    setIsDemo(false);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('watchtower_token');
    setToken(null);
    setUser(null);
    setIsDemo(false);
  };

  const enterDemoMode = () => {
    setIsDemo(true);
    setUser(null);
    setToken(null);
    localStorage.removeItem('watchtower_token');
  };

  const getAuthHeaders = () => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  const value = {
    user,
    token,
    loading,
    isDemo,
    login,
    register,
    logout,
    enterDemoMode,
    getAuthHeaders,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
