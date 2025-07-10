import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeColors, setThemeColors] = useState({
    primary: '#4E7AF9',
    secondary: '#8C69FF',
    success: '#1CD3A2',
    warning: '#FFC107',
    danger: '#FF4757',
    info: '#17A2B8'
  });

  // Tema renkleri
  const themes = {
    default: {
      primary: '#4E7AF9',
      secondary: '#8C69FF',
      success: '#1CD3A2',
      warning: '#FFC107',
      danger: '#FF4757',
      info: '#17A2B8'
    },
    green: {
      primary: '#2ED573',
      secondary: '#7bed9f',
      success: '#1CD3A2',
      warning: '#FFC107',
      danger: '#FF4757',
      info: '#17A2B8'
    },
    orange: {
      primary: '#FF9F43',
      secondary: '#FDCB6E',
      success: '#1CD3A2',
      warning: '#FFC107',
      danger: '#FF4757',
      info: '#17A2B8'
    },
    purple: {
      primary: '#9C27B0',
      secondary: '#BA68C8',
      success: '#1CD3A2',
      warning: '#FFC107',
      danger: '#FF4757',
      info: '#17A2B8'
    }
  };

  // Light ve dark tema renkleri
  const lightColors = {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#333333',
    secondaryText: '#666666',
    border: '#E0E0E0',
    notification: '#FF4757',
    tabBar: '#FFFFFF',
    statusBar: 'dark-content'
  };

  const darkColors = {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    secondaryText: '#AAAAAA',
    border: '#333333',
    notification: '#FF4757',
    tabBar: '#1E1E1E',
    statusBar: 'light-content'
  };

  // Kullanıcı tercihlerini yükleme
  useEffect(() => {
    const loadThemePreferences = async () => {
      try {
        if (user && user.preferences) {
          // Kullanıcı oturum açtıysa ve tercihleri varsa onları kullan
          setIsDarkMode(user.preferences.darkMode || false);
          
          // Tema renklerini ayarla
          if (user.preferences.theme && themes[user.preferences.theme]) {
            setThemeColors(themes[user.preferences.theme]);
          }
        } else {
          // Kullanıcı oturum açmadıysa, cihaz temasını veya yerel depolamayı kullan
          const savedDarkMode = await AsyncStorage.getItem('darkMode');
          if (savedDarkMode !== null) {
            setIsDarkMode(JSON.parse(savedDarkMode));
          } else {
            // Cihaz temasını kullan
            setIsDarkMode(deviceTheme === 'dark');
          }
          
          // Yerel depolamadan tema renklerini yükle
          const savedTheme = await AsyncStorage.getItem('theme');
          if (savedTheme && themes[savedTheme]) {
            setThemeColors(themes[savedTheme]);
          }
        }
      } catch (error) {
        console.error('Tema tercihleri yüklenirken hata:', error);
      }
    };

    loadThemePreferences();
  }, [user, deviceTheme]);

  // Dark mode değiştirme fonksiyonu
  const toggleDarkMode = async (value) => {
    setIsDarkMode(value);
    await AsyncStorage.setItem('darkMode', JSON.stringify(value));
  };

  // Tema değiştirme fonksiyonu
  const changeTheme = async (themeName) => {
    if (themes[themeName]) {
      setThemeColors(themes[themeName]);
      await AsyncStorage.setItem('theme', themeName);
    }
  };

  // Mevcut temaya göre renkleri belirle
  const colors = {
    ...themeColors,
    ...(isDarkMode ? darkColors : lightColors)
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        isDarkMode, 
        toggleDarkMode, 
        colors, 
        changeTheme,
        themes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Kolay kullanım için hook
export const useTheme = () => useContext(ThemeContext);
