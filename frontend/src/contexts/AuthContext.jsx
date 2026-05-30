import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khi ứng dụng khởi động, kiểm tra localStorage xem có user không
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // Hàm đăng nhập
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data);
    return data;
  };

  // Hàm đăng ký
  const register = async (userData) => {
    const data = await authService.register(userData);
    return data;
  };

  // Hàm đăng xuất
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateCurrentUser = (updates) => {
    setUser(current => {
      const nextUser = { ...(current || {}), ...(updates || {}) };
      if (nextUser?.token) {
        localStorage.setItem('user', JSON.stringify(nextUser));
      }
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext dễ dàng
export const useAuth = () => useContext(AuthContext);
