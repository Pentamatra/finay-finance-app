import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Platform'a göre API URL'ini ayarla
  // Yeni port numarası (5001) ile güncellenmiş URL'ler
  let API_URL = 'http://10.0.2.2:5001/api'; // <-- Android Studio emülatörü için
  // Eğer gerçek cihazdan test ediyorsan, bilgisayarının IP adresini kullanmalısın.
  // Ör: let API_URL = 'http://172.20.10.4:5001/api';

  useEffect(() => {
    // Check if user is logged in
    const loadStoredUser = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kayıt sırasında bir hata oluştu');
      }
      
      const userData = await response.json();
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      setError(error.message || 'Kayıt sırasında bir hata oluştu');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Login attempt with:', { email, API_URL });
      
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      const responseData = await response.json();
      console.log('Login response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Giriş sırasında bir hata oluştu');
      }
      
      const userData = responseData;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      // Daha fazla detaylı log
      console.error('Login error:', error.message);
      setError(error.message || 'Giriş sırasında bir hata oluştu. Sunucuya ulaşılamıyor olabilir.');
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
