import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [captain, setCaptain] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ridepass_token') || null);
  const [role, setRole] = useState(localStorage.getItem('ridepass_role') || null); // 'user' | 'captain' | 'admin'
  const [loading, setLoading] = useState(true);

  // Initialize or restore session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ridepass_token');
      const storedRole = localStorage.getItem('ridepass_role');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        if (storedRole === 'captain') {
          const res = await authAPI.captainProfile();
          setCaptain(res.data.captain);
          setRole('captain');
        } else {
          const res = await authAPI.userProfile();
          setUser(res.data);
          setRole(res.data.role === 'admin' ? 'admin' : 'user');
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const loginUser = async (email, password) => {
    const res = await authAPI.userLogin({ email, password });
    const { token: authToken, user: userData } = res.data;
    localStorage.setItem('ridepass_token', authToken);
    const userRole = userData.role === 'admin' ? 'admin' : 'user';
    localStorage.setItem('ridepass_role', userRole);
    setToken(authToken);
    setUser(userData);
    setRole(userRole);
    return userData;
  };

  const registerUser = async (firstname, lastname, email, password) => {
    const res = await authAPI.userRegister({
      fullname: { firstname, lastname },
      email,
      password
    });
    const { token: authToken, user: userData } = res.data;
    localStorage.setItem('ridepass_token', authToken);
    localStorage.setItem('ridepass_role', 'user');
    setToken(authToken);
    setUser(userData);
    setRole('user');
    return userData;
  };

  const loginCaptain = async (email, password) => {
    const res = await authAPI.captainLogin({ email, password });
    const { token: authToken, captain: captainData } = res.data;
    localStorage.setItem('ridepass_token', authToken);
    localStorage.setItem('ridepass_role', 'captain');
    setToken(authToken);
    setCaptain(captainData);
    setRole('captain');
    return captainData;
  };

  const registerCaptain = async (formData) => {
    const res = await authAPI.captainRegister(formData);
    const { token: authToken, captain: captainData } = res.data;
    localStorage.setItem('ridepass_token', authToken);
    localStorage.setItem('ridepass_role', 'captain');
    setToken(authToken);
    setCaptain(captainData);
    setRole('captain');
    return captainData;
  };

  const logout = async () => {
    try {
      if (role === 'captain') {
        await authAPI.captainLogout();
      } else if (token) {
        await authAPI.userLogout();
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('ridepass_token');
      localStorage.removeItem('ridepass_role');
      setToken(null);
      setUser(null);
      setCaptain(null);
      setRole(null);
    }
  };

  const updateProfile = async (firstname, lastname) => {
    const res = await authAPI.updateProfile({ fullname: { firstname, lastname } });
    setUser(res.data.user);
    return res.data.user;
  };

  // Default display name fallback: Devashish Srivastava
  const displayName = user?.fullname
    ? `${user.fullname.firstname} ${user.fullname.lastname || ''}`.trim()
    : (captain?.fullname ? `${captain.fullname.firstname} ${captain.fullname.lastname || ''}`.trim() : 'Devashish Srivastava');

  return (
    <AuthContext.Provider
      value={{
        user,
        captain,
        token,
        role,
        loading,
        displayName,
        loginUser,
        registerUser,
        loginCaptain,
        registerCaptain,
        logout,
        updateProfile,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
