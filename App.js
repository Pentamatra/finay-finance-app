import React, { useState, useContext, createContext, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import AdminScreen from './screens/AdminScreen';
import PortfolioScreen from './screens/PortfolioScreen';
import ReportsScreen from './screens/ReportsScreen';
import AlertsScreen from './screens/AlertsScreen';
import StocksScreen from './screens/StocksScreen';
import CryptoScreen from './screens/CryptoScreen';
import FundsScreen from './screens/FundsScreen';
import ForexScreen from './screens/ForexScreen';
import StatsScreen from './screens/StatsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import EditTransactionScreen from './screens/EditTransactionScreen';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { View, Text, Animated, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// İçe aktarılan tam sayfa bileşenleri (önceden basit bileşenler olarak tanımlanmıştı)

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Modern tab bar bileşeni
function CustomTabBar({ state, descriptors, navigation }) {
  const scaleValues = state.routes.map(() => new Animated.Value(1));
  
  const handlePress = (route, index) => {
    const tabPress = () => navigation.navigate(route.name);
    
    Animated.sequence([
      Animated.spring(scaleValues[index], {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValues[index], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start(tabPress);
  };

  return (
    <View style={styles.tabBarContainer}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
        style={styles.tabBarBackground}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          let iconName;
          let gradientColors;
          
          // İkon ve renk belirle
          if (route.name === 'Home') {
            iconName = isFocused ? 'home' : 'home-outline';
            gradientColors = ['#4E7AF9', '#8C69FF'];
          } else if (route.name === 'Stats') {
            iconName = isFocused ? 'analytics' : 'analytics-outline';
            gradientColors = ['#2ED573', '#7bed9f'];
          } else if (route.name === 'Notifications') {
            iconName = isFocused ? 'notifications' : 'notifications-outline';
            gradientColors = ['#FF4757', '#ff6b81'];
          } else if (route.name === 'Settings') {
            iconName = isFocused ? 'settings' : 'settings-outline';
            gradientColors = ['#FDCB6E', '#ffeaa7'];
          } else if (route.name === 'Admin') {
            iconName = isFocused ? 'shield' : 'shield-outline';
            gradientColors = ['#1e3799', '#4a69bd'];
          }

          return (
            <Animated.View 
              key={route.key}
              style={[
                styles.tabItem, 
                { transform: [{ scale: scaleValues[index] }] }
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handlePress(route, index)}
                style={styles.tabButton}
              >
                {isFocused ? (
                  <LinearGradient
                    colors={gradientColors}
                    style={styles.iconBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={iconName} size={20} color="#fff" />
                  </LinearGradient>
                ) : (
                  <Ionicons name={iconName} size={22} color="#9e9e9e" />
                )}
                <Text 
                  style={[
                    styles.tabLabel,
                    isFocused ? { color: gradientColors[0], fontWeight: '600' } : { color: '#9e9e9e' }
                  ]}
                >
                  {route.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </LinearGradient>
    </View>
  );
}

// Ana sayfa stack navigator'ı - HomeScreen ve bağlantılı ekranlar
const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Stocks" component={StocksScreen} />
      <Stack.Screen name="Crypto" component={CryptoScreen} />
      <Stack.Screen name="Funds" component={FundsScreen} />
      <Stack.Screen name="Forex" component={ForexScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="EditTransaction" component={EditTransactionScreen} />
    </Stack.Navigator>
  );
};

// Auth Stack Navigator - Login ve Register ekranları için
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Ana navigasyon yapısı
const Navigation = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode, colors } = useContext(ThemeContext);

  if (!user) {
    return <AuthStack />;
  }

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      {user.isAdmin && <Tab.Screen name="Admin" component={AdminScreen} />}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a4a9e',
    marginBottom: 20,
  },
  screenInfo: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // iOS için ek padding
  },
  tabBarBackground: {
    flexDirection: 'row',
    width: '92%',
    borderRadius: 30,
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  iconBackground: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 25,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a4a9e',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a4a9e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

const AppContent = () => {
  const { isDarkMode, colors } = useContext(ThemeContext);
  
  // Tema renklerine göre navigasyon teması oluştur
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Navigation />
    </NavigationContainer>
  );
}
