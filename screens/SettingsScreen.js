import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Dimensions, ScrollView, SafeAreaView, ActivityIndicator, Alert, Animated, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

const screenWidth = Dimensions.get('window').width;

// Tema seçenekleri tanımı kaldırıldı - bileşen içine taşındı

// Tema seçenekleri tanımı bileşen içinde yapıldı

const SettingsScreen = () => {
  // AuthContext'ten kullanıcı bilgilerini al
  const { user } = useContext(AuthContext);
  
  // ThemeContext'ten tema bilgilerini al
  const { isDarkMode, toggleDarkMode, colors, changeTheme, themes } = useContext(ThemeContext);
  
  // API URL (Geliştirme ortamına göre ayarlanmalı)
  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';
  
  // State tanımlamaları
  const [userProfile, setUserProfile] = useState(null);
  const [activeTheme, setActiveTheme] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // Profil düzenleme state'leri
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  
  // MongoDB'den kullanıcı verilerini çekmek için gerçek API çağrısı
  const fetchUserProfile = useCallback(async (authToken) => {
    try {
      // Kullanıcı profil verisini çek
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // API yanıtını JSON olarak işle
      const data = await response.json();
      
      // Başarısız yanıt için hata fırlat
      if (!response.ok) {
        throw new Error(data.message || 'Kullanıcı bilgileri alınamadı.');
      }
      
      // API'den gelen veriyi döndür
      return data;
      
    } catch (error) {
      console.error('Kullanıcı verileri alınırken hata oluştu:', error.message);
      throw new Error(error.message || 'Kullanıcı bilgileri alınamadı.');
    }
  }, [API_URL]);
  
  // loadUserProfile fonksiyonunu useCallback ile tanımla
  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Kullanıcı giriş yaptı mı kontrol et
      if (!user || !user.token) {
        throw new Error('Oturum açılmamış. Lütfen giriş yapın.');
      }
      
      // Veritabanından kullanıcı verilerini yükle
      const userData = await fetchUserProfile(user.token);
      setUserProfile(userData);
      // Dark mode tercihini kullanıcı profilinden al
      if (userData.preferences && userData.preferences.darkMode !== undefined) {
        toggleDarkMode(userData.preferences.darkMode);
      }
    } catch (err) {
      console.error('Kullanıcı verileri yüklenirken hata:', err.message || err);
      setError('Kullanıcı bilgileri yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  }, [user, fetchUserProfile]);
  
  // Component mount olduğunda verileri yükle
  useEffect(() => {
    if (user && user.token) {
      loadUserProfile();
    } else {
      setLoading(false);
      setError('Oturum açılmamış. Lütfen giriş yapın.');
    }

  }, [user, loadUserProfile]); // user ve loadUserProfile değiştiğinde çalışacak
  
  // Kullanıcı adının baş harflerini alma
  const getInitials = () => {
    if (!userProfile) return '';
    return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`;
  };

  // Tam adı alma
  const getFullName = () => {
    if (!userProfile) return '';
    return `${userProfile.firstName} ${userProfile.lastName}`;
  };
  
  // Animasyon için fonksiyon
  const animateScale = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  // Tema seçenekleri
  const themeOptions = [
    {
      id: 'default',
      name: 'Varsayılan',
      colors: ['#4E7AF9', '#8C69FF'],
      icon: 'color-palette-outline'
    },
    {
      id: 'green',
      name: 'Yeşil',
      colors: ['#10B981', '#059669'],
      icon: 'leaf-outline'
    },
    {
      id: 'orange',
      name: 'Turuncu',
      colors: ['#F59E0B', '#D97706'],
      icon: 'sunny-outline'
    },
    {
      id: 'purple',
      name: 'Mor',
      colors: ['#8B5CF6', '#7C3AED'],
      icon: 'flower-outline'
    },
    {
      id: 'red',
      name: 'Kırmızı',
      colors: ['#EF4444', '#DC2626'],
      icon: 'flame-outline'
    }
  ];
  
  // Tema değiştirme fonksiyonu
  const handleThemeChange = async (themeId) => {
    try {
      // Animasyon başlat
      animateScale();
      
      // Tema seçici panelini kapat
      setShowThemeSelector(false);
      
      // Seçilen temayı ayarla
      setActiveTheme(themeId);
      
      // ThemeContext'ten tema değiştirme fonksiyonunu çağır
      changeTheme(themeId);
      
      // Kullanıcı profilini güncelle
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: {
            ...userProfile.preferences,
            theme: themeId
          }
        });
        
        // MongoDB'ye kaydetme işlemi
        if (user && user.token) {
          console.log('Tema tercihi kaydediliyor:', themeId);
          const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              theme: themeId
            })
          });
          
          let responseData;
          try {
            const responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON ayrıştırma hatası:', parseError);
              console.log('API yanıtı:', responseText);
              throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
            }
          } catch (textError) {
            console.error('Yanıt metni alınamadı:', textError);
            throw new Error('API yanıtı alınamadı');
          }
          
          if (!response.ok) {
            throw new Error(responseData?.message || 'Tema tercihleri kaydedilemedi');
          }
          
          console.log('Tema tercihi başarıyla kaydedildi:', responseData);
          
          // Başarı mesajı göster
          Alert.alert(
            'Başarılı',
            'Tema tercihiniz kaydedildi',
            [{ text: 'Tamam', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Tema değiştirme hatası:', error);
      Alert.alert(
        'Hata',
        'Tema ayarı kaydedilemedi. Lütfen tekrar deneyin.',
        [{ text: 'Tamam', style: 'default' }]
      );
    }
  };

  // Dil değiştirme fonksiyonu
  const handleLanguageChange = async (langId, langName) => {
    try {
      // Animasyon başlat
      animateScale();
      
      // Kullanıcı profilini güncelle
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: {
            ...userProfile.preferences,
            language: langName
          }
        });
        
        // MongoDB'ye kaydetme işlemi
        if (user && user.token) {
          console.log('Dil tercihi kaydediliyor:', langName);
          const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              language: langName
            })
          });
          
          let responseData;
          try {
            const responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON ayrıştırma hatası:', parseError);
              console.log('API yanıtı:', responseText);
              throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
            }
          } catch (textError) {
            console.error('Yanıt metni alınamadı:', textError);
            throw new Error('API yanıtı alınamadı');
          }
          
          if (!response.ok) {
            throw new Error(responseData?.message || 'Dil tercihi kaydedilemedi');
          }
          
          console.log('Dil tercihi başarıyla kaydedildi:', responseData);
          Alert.alert(
            'Başarılı',
            'Dil tercihiniz kaydedildi',
            [{ text: 'Tamam', style: 'default' }]
          );
        }
      }
    } catch (err) {
      console.error('Dil tercihi güncellenirken hata:', err.message || err);
      Alert.alert(
        'Hata',
        'Dil tercihi güncellenirken bir sorun oluştu: ' + (err.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    }
  };
  
  // Para birimi değiştirme fonksiyonu
  const handleCurrencyChange = async (currencyId) => {
    try {
      // Animasyon başlat
      animateScale();
      
      // Kullanıcı profilini güncelle
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: {
            ...userProfile.preferences,
            currency: currencyId
          }
        });
        
        // MongoDB'ye kaydetme işlemi
        if (user && user.token) {
          console.log('Para birimi tercihi kaydediliyor:', currencyId);
          const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              currency: currencyId
            })
          });
          
          let responseData;
          try {
            const responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON ayrıştırma hatası:', parseError);
              console.log('API yanıtı:', responseText);
              throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
            }
          } catch (textError) {
            console.error('Yanıt metni alınamadı:', textError);
            throw new Error('API yanıtı alınamadı');
          }
          
          if (!response.ok) {
            throw new Error(responseData?.message || 'Para birimi tercihi kaydedilemedi');
          }
          
          console.log('Para birimi tercihi başarıyla kaydedildi:', responseData);
          Alert.alert(
            'Başarılı',
            'Para birimi tercihiniz kaydedildi',
            [{ text: 'Tamam', style: 'default' }]
          );
        }
      }
    } catch (err) {
      console.error('Para birimi tercihi güncellenirken hata:', err.message || err);
      Alert.alert(
        'Hata',
        'Para birimi tercihi güncellenirken bir sorun oluştu: ' + (err.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    }
  };
  
  // Güvenlik ayarı değiştirme fonksiyonu
  const handleSecurityChange = async (securityId, securityName) => {
    try {
      // Animasyon başlat
      animateScale();
      
      // Kullanıcı profilini güncelle
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: {
            ...userProfile.preferences,
            security: securityName
          }
        });
        
        // MongoDB'ye kaydetme işlemi
        if (user && user.token) {
          console.log('Güvenlik tercihi kaydediliyor:', securityName);
          const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              security: securityName
            })
          });
          
          let responseData;
          try {
            const responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON ayrıştırma hatası:', parseError);
              console.log('API yanıtı:', responseText);
              throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
            }
          } catch (textError) {
            console.error('Yanıt metni alınamadı:', textError);
            throw new Error('API yanıtı alınamadı');
          }
          
          if (!response.ok) {
            throw new Error(responseData?.message || 'Güvenlik tercihi kaydedilemedi');
          }
          
          console.log('Güvenlik tercihi başarıyla kaydedildi:', responseData);
          Alert.alert(
            'Başarılı',
            'Güvenlik tercihiniz kaydedildi',
            [{ text: 'Tamam', style: 'default' }]
          );
        }
      }
    } catch (err) {
      console.error('Güvenlik tercihi güncellenirken hata:', err.message || err);
      Alert.alert(
        'Hata',
        'Güvenlik tercihi güncellenirken bir sorun oluştu: ' + (err.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    }
  };
  
  // Bildirim ayarı değiştirme fonksiyonu
  const handleNotificationsChange = async (value) => {
    try {
      // Animasyon başlat
      animateScale();
      
      // Kullanıcı profilini güncelle
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: {
            ...userProfile.preferences,
            notifications: value
          }
        });
        
        // MongoDB'ye kaydetme işlemi
        if (user && user.token) {
          console.log('Bildirim tercihi kaydediliyor:', value);
          const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              notifications: value
            })
          });
          
          let responseData;
          try {
            const responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON ayrıştırma hatası:', parseError);
              console.log('API yanıtı:', responseText);
              throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
            }
          } catch (textError) {
            console.error('Yanıt metni alınamadı:', textError);
            throw new Error('API yanıtı alınamadı');
          }
          
          if (!response.ok) {
            throw new Error(responseData?.message || 'Bildirim tercihi kaydedilemedi');
          }
          
          console.log('Bildirim tercihi başarıyla kaydedildi:', responseData);
          Alert.alert(
            'Başarılı',
            `Bildirimler ${value ? 'açıldı' : 'kapatıldı'}`,
            [{ text: 'Tamam', style: 'default' }]
          );
        }
      }
    } catch (err) {
      console.error('Bildirim tercihi güncellenirken hata:', err.message || err);
      Alert.alert(
        'Hata',
        'Bildirim tercihi güncellenirken bir sorun oluştu: ' + (err.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    }
  };
  
  // Premium'a geçiş fonksiyonu
  const handlePremiumUpgrade = () => {
    // Burada gerçek bir satın alma işlemi entegrasyonu yapılabilir
    Alert.alert(
      'Premium Abonelik',
      'Premium abonelik işlemi şu anda geliştirme aşamasındadır.',
      [{ text: 'Tamam', style: 'default' }]
    );
  };
  
  // Dark mode değişikliğinde profil bilgilerini hem state'de hem de MongoDB'de güncelle
  const handleDarkModeChange = async (value) => {
    try {
      // Animasyon başlat
      animateScale();
      
      // ThemeContext'ten dark mode değiştirme fonksiyonunu çağır
      toggleDarkMode(value);
      
      // Kullanıcı profilini güncelle
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          preferences: {
            ...userProfile.preferences,
            darkMode: value
          }
        });
        
        // MongoDB'ye kaydetme işlemi
        if (user && user.token) {
          console.log('Karanlık mod tercihi kaydediliyor:', value);
          const response = await fetch(`${API_URL}/users/preferences`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              darkMode: value
            })
          });
          
          let responseData;
          try {
            const responseText = await response.text();
            try {
              responseData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON ayrıştırma hatası:', parseError);
              console.log('API yanıtı:', responseText);
              throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
            }
          } catch (textError) {
            console.error('Yanıt metni alınamadı:', textError);
            throw new Error('API yanıtı alınamadı');
          }
          
          if (!response.ok) {
            throw new Error(responseData?.message || 'Tercihler kaydedilemedi');
          }
          
          console.log('Karanlık mod tercihi başarıyla kaydedildi:', responseData);
          Alert.alert(
            'Başarılı',
            'Karanlık mod tercihiniz kaydedildi',
            [{ text: 'Tamam', style: 'default' }]
          );
        }
      }
    } catch (err) {
      console.error('Tercihler güncellenirken hata:', err.message || err);
      Alert.alert(
        'Hata',
        'Tercihler güncellenirken bir sorun oluştu: ' + (err.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    }
  };

  // Yükleme durumu kontrolü
  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4E7AF9" />
        <Text style={styles.loadingText}>Kullanıcı bilgileri yükleniyor...</Text>
      </SafeAreaView>
    );
  }
  
  // Hata durumu kontrolü
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.errorContainer]}>
        <Ionicons name="alert-circle-outline" size={50} color="#FF4757" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchUserProfile()
              .then(userData => {
                setUserProfile(userData);
                if (userData.preferences && userData.preferences.darkMode !== undefined) {
                  setDarkMode(userData.preferences.darkMode);
                }
              })
              .catch(err => setError(err.message || 'Veriler alınamadı. Lütfen daha sonra tekrar deneyiniz.'))
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Kullanıcı profili yüklenmediyse boş bir ekran göster
  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loadingContainer]}>
        <Text>Kullanıcı bilgileri bulunamadı.</Text>
      </SafeAreaView>
    );
  }
  
  // Ayarlar listesini oluşturma fonksiyonu
  const getSettingsFromProfile = (profile) => {
    if (!profile || !profile.preferences) return [];
    
    return [
      {
        id: 'language',
        icon: 'language-outline',
        title: 'Dil',
        value: profile.preferences.language || 'Türkçe',
        onPress: () => Alert.alert(
          'Dil Seçimi',
          'Kullanmak istediğiniz dili seçin',
          [
            { text: 'Türkçe', onPress: () => handleLanguageChange('tr', 'Türkçe') },
            { text: 'English', onPress: () => handleLanguageChange('en', 'English') },
            { text: 'İptal', style: 'cancel' }
          ]
        )
      },
      {
        id: 'currency',
        icon: 'cash-outline',
        title: 'Para Birimi',
        value: profile.preferences.currency || 'TRY',
        onPress: () => Alert.alert(
          'Para Birimi Seçimi',
          'Kullanmak istediğiniz para birimini seçin',
          [
            { text: 'Türk Lirası (₺)', onPress: () => handleCurrencyChange('TRY') },
            { text: 'Dolar ($)', onPress: () => handleCurrencyChange('USD') },
            { text: 'Euro (€)', onPress: () => handleCurrencyChange('EUR') },
            { text: 'İptal', style: 'cancel' }
          ]
        )
      },
      {
        id: 'security',
        icon: 'shield-checkmark-outline',
        title: 'Güvenlik',
        value: profile.preferences.security || 'Standart',
        onPress: () => Alert.alert(
          'Güvenlik Seviyesi',
          'Hesabınız için güvenlik seviyesini seçin',
          [
            { text: 'Standart', onPress: () => handleSecurityChange('standard', 'Standart') },
            { text: 'Yüksek', onPress: () => handleSecurityChange('high', 'Yüksek') },
            { text: 'İptal', style: 'cancel' }
          ]
        )
      },
      {
        id: 'notifications',
        icon: 'notifications-outline',
        title: 'Bildirimler',
        value: profile.preferences.notifications ? 'Açık' : 'Kapalı',
        onPress: () => handleNotificationsChange(!profile.preferences.notifications)
      },
      {
        id: 'premium',
        icon: 'star-outline',
        title: 'Premium',
        value: profile.premium ? 'Aktif' : 'Yükselt',
        onPress: handlePremiumUpgrade
      }
    ];
  };
  
  // Profil bilgilerini güncelleme fonksiyonu
  const handleUpdateProfile = async () => {
    try {
      setProfileSaving(true);
      
      // Boş alan kontrolü
      if (!editedProfile.firstName.trim() || !editedProfile.lastName.trim()) {
        Alert.alert('Hata', 'Ad ve soyad alanları boş olamaz');
        setProfileSaving(false);
        return;
      }
      
      // Email format kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedProfile.email)) {
        Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz');
        setProfileSaving(false);
        return;
      }
      
      // MongoDB'ye kaydetme işlemi
      if (user && user.token) {
        console.log('Profil bilgileri güncelleniyor...');
        const response = await fetch(`${API_URL}/users/profile`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: editedProfile.firstName,
            lastName: editedProfile.lastName,
            email: editedProfile.email
          })
        });
        
        let responseData;
        try {
          const responseText = await response.text();
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('JSON ayrıştırma hatası:', parseError);
            console.log('API yanıtı:', responseText);
            throw new Error('API yanıtı ayrıştırılamadı: ' + parseError.message);
          }
        } catch (textError) {
          console.error('Yanıt metni alınamadı:', textError);
          throw new Error('API yanıtı alınamadı');
        }
        
        if (!response.ok) {
          throw new Error(responseData?.message || 'Profil güncellenemedi');
        }
        
        console.log('Profil başarıyla güncellendi:', responseData);
        
        // Kullanıcı profilini güncelle
        setUserProfile({
          ...userProfile,
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName,
          email: editedProfile.email
        });
        
        // Modal'ı kapat
        setShowProfileModal(false);
        
        // Başarı mesajı göster
        Alert.alert(
          'Başarılı',
          'Profil bilgileriniz güncellendi',
          [{ text: 'Tamam', style: 'default' }]
        );
      }
    } catch (err) {
      console.error('Profil güncellenirken hata:', err.message || err);
      Alert.alert(
        'Hata',
        'Profil güncellenirken bir sorun oluştu: ' + (err.message || 'Bilinmeyen hata'),
        [{ text: 'Tamam' }]
      );
    } finally {
      setProfileSaving(false);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDarkMode ? colors.background : '#f8f9fa'}]}>
      {/* Profil Düzenleme Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: isDarkMode ? colors.text : '#333'}]}>Profil Bilgilerini Düzenle</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? colors.text : '#333'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: isDarkMode ? colors.text : '#333'}]}>Ad</Text>
              <TextInput
                style={[styles.input, {backgroundColor: isDarkMode ? colors.cardDark : '#f8f9fa', color: isDarkMode ? colors.text : '#333'}]}
                value={editedProfile.firstName}
                onChangeText={(text) => setEditedProfile({...editedProfile, firstName: text})}
                placeholder="Adınız"
                placeholderTextColor={isDarkMode ? `${colors.text}50` : '#aaa'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: isDarkMode ? colors.text : '#333'}]}>Soyad</Text>
              <TextInput
                style={[styles.input, {backgroundColor: isDarkMode ? colors.cardDark : '#f8f9fa', color: isDarkMode ? colors.text : '#333'}]}
                value={editedProfile.lastName}
                onChangeText={(text) => setEditedProfile({...editedProfile, lastName: text})}
                placeholder="Soyadınız"
                placeholderTextColor={isDarkMode ? `${colors.text}50` : '#aaa'}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: isDarkMode ? colors.text : '#333'}]}>E-posta</Text>
              <TextInput
                style={[styles.input, {backgroundColor: isDarkMode ? colors.cardDark : '#f8f9fa', color: isDarkMode ? colors.text : '#333'}]}
                value={editedProfile.email}
                onChangeText={(text) => setEditedProfile({...editedProfile, email: text})}
                placeholder="E-posta adresiniz"
                placeholderTextColor={isDarkMode ? `${colors.text}50` : '#aaa'}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, {opacity: profileSaving ? 0.7 : 1}]}
              onPress={handleUpdateProfile}
              disabled={profileSaving}
            >
              {profileSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <LinearGradient
        colors={isDarkMode ? [colors.primary, `${colors.primary}dd`] : ['#4E7AF9', '#8C69FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Ayarlar</Text>
        
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <LinearGradient
              colors={isDarkMode ? [colors.accent, colors.primary] : ['#E44D26', '#F16529']}
              style={styles.profileGradient}
            >
              <Text style={styles.profileInitial}>{getInitials()}</Text>
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{getFullName()}</Text>
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setEditedProfile({
                firstName: userProfile.firstName || '',
                lastName: userProfile.lastName || '',
                email: userProfile.email || ''
              });
              setShowProfileModal(true);
            }}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <View style={[styles.cardHeader, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <Text style={[styles.cardTitle, {color: isDarkMode ? colors.text : '#333'}]}>Görünüm Ayarları</Text>
          </View>
          
          {/* Dark Mode */}
          <View style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.darkModeContainer, {backgroundColor: isDarkMode ? colors.cardDark : '#f8f9fa'}]}
              onPress={() => handleDarkModeChange(!isDarkMode)}
            >
              <View style={styles.darkModeContent}>
                <View style={styles.darkModeIcon}>
                  <Ionicons 
                    name={isDarkMode ? "moon" : "moon-outline"} 
                    size={24} 
                    color={isDarkMode ? colors.primary : "#666"} 
                  />
                </View>
                <Text style={[styles.darkModeText, {color: isDarkMode ? colors.text : '#333'}]}>Karanlık Mod</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleDarkModeChange}
                trackColor={{ false: '#e9e9e9', true: `${colors.primary}50` }}
                thumbColor={isDarkMode ? colors.primary : '#f4f3f4'}
                style={styles.switch}
              />
            </TouchableOpacity>
          </View>
          
          {/* Tema Seçimi */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.themeSelector, {backgroundColor: isDarkMode ? colors.cardDark : '#f8f9fa'}]}
              onPress={() => setShowThemeSelector(!showThemeSelector)}
            >
              <View style={styles.darkModeContent}>
                <View style={styles.darkModeIcon}>
                  <Ionicons name="color-palette-outline" size={24} color={isDarkMode ? colors.text : "#666"} />
                </View>
                <View>
                  <Text style={[styles.darkModeText, {color: isDarkMode ? colors.text : '#333'}]}>Tema Seçimi</Text>
                  <Text style={[styles.themeNameText, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>
                    {themeOptions.find(t => t.id === activeTheme)?.name || 'Varsayılan'}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={showThemeSelector ? "chevron-up" : "chevron-down"}
                size={20} 
                color={isDarkMode ? colors.text : "#666"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Tema Seçenekleri */}
          {showThemeSelector && (
            <View style={[styles.themeOptionsContainer, {backgroundColor: isDarkMode ? colors.cardDark : '#fff'}]}>
              {themeOptions.map((theme) => (
                <Animated.View key={theme.id} style={[{transform: [{scale: scaleAnim}]}]}>
                  <TouchableOpacity
                    style={[styles.themeOption, 
                      {backgroundColor: isDarkMode ? colors.cardLight : '#f8f9fa'},
                      activeTheme === theme.id && [styles.activeThemeOption, {backgroundColor: isDarkMode ? colors.border : '#f0f0f0'}]
                    ]}
                    onPress={() => handleThemeChange(theme.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      style={styles.themeColorPreview}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {activeTheme === theme.id && (
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      )}
                    </LinearGradient>
                    <Text style={[styles.themeOptionText, {color: isDarkMode ? colors.text : '#333'}]}>{theme.name}</Text>
                    <Ionicons name={theme.icon} size={20} color={isDarkMode ? colors.text : "#666"} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
        
        <View style={[styles.card, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <Text style={[styles.cardTitle, {color: isDarkMode ? colors.text : '#333'}]}>Uygulama Ayarları</Text>
          
          {userProfile && getSettingsFromProfile(userProfile).map((setting) => (
            <TouchableOpacity
              key={setting.id}
              style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}
              onPress={setting.onPress ? setting.onPress : () => {}}
            >
              <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
                <Ionicons name={setting.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>{setting.title}</Text>
                <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>{setting.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.card, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <Text style={[styles.cardTitle, {color: isDarkMode ? colors.text : '#333'}]}>Hesap & Güvenlik</Text>
          
          <TouchableOpacity style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
              <Ionicons name="person-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>Profil Bilgileri</Text>
              <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Kişisel bilgilerinizi değiştirin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
              <Ionicons name="key-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>Şifre Değiştir</Text>
              <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Güvenliğiniz için düzenli değiştirin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
              <Ionicons name="finger-print-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>Biyometrik Giriş</Text>
              <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Hızlı giriş için yüz tanıma/parmak izi</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, styles.logoutButton, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 71, 87, 0.1)'}]}>
              <Ionicons name="log-out-outline" size={22} color="#FF4757" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.logoutText, {color: '#FF4757'}]}>Çıkış Yap</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.card, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <Text style={[styles.cardTitle, {color: isDarkMode ? colors.text : '#333'}]}>Yardım & Destek</Text>
          
          <TouchableOpacity style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>Sıkça Sorulan Sorular</Text>
              <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Genel sorulara yanıtlar</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
              <Ionicons name="mail-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>Destek Talebi Oluştur</Text>
              <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Sorunlarınız için bize ulaşın</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.settingItem, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
            <View style={[styles.settingIconContainer, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, {color: isDarkMode ? colors.text : '#333'}]}>Uygulama Hakkında</Text>
              <Text style={[styles.settingValue, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Versiyon 1.2.3</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.border : "#C8C8C8"} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4E7AF9',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  container: { 
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    elevation: 5,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  profileGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileInitial: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 5,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginLeft: 10,
  },
  darkModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 12,
  },
  darkModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkModeIcon: {
    marginRight: 8,
  },
  darkModeText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  themeNameText: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 12,
    width: '100%',
  },
  themeOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: '#f8f9fa',
  },
  activeThemeOption: {
    backgroundColor: '#f0f0f0',
  },
  themeColorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  themeOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 122, 249, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingValue: {
    color: '#888',
    fontSize: 13,
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    color: '#FF4757',
  },
  bottomSpacer: {
    height: 50,
  },
  // Profil düzenleme modal stilleri
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4E7AF9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
