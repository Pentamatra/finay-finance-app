import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Animated,
  PanResponder,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const NotificationsScreen = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'important'
  const [notificationsList, setNotificationsList] = useState([]);
  const [openItemId, setOpenItemId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // API URL
  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
  
  // Örnek bildirim verisi (API çalışmazsa kullanılacak)
  const dummyNotificationsData = [
    {
      _id: '1',
      title: 'Fiyat Alarmı',
      message: 'BTC 68,000 USD sınırını geçti!',
      type: 'success',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 dakika önce
      isRead: false,
      isImportant: true,
      category: 'price'
    },
    {
      _id: '2',
      title: 'Bütçe Uyarısı',
      message: 'Bu ayki bütçenizin %80\'ni kullanmışsınız.',
      type: 'warning',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 dakika önce
      isRead: false,
      isImportant: true,
      category: 'budget'
    },
    {
      _id: '3',
      title: 'Yatırım Bildirimi',
      message: 'Yatırımlarınızın bu ayki getirisi %5.2',
      type: 'success',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
      isRead: true,
      isImportant: false,
      category: 'investment'
    },
    {
      _id: '4',
      title: 'Ödeme Hatırlatma',
      message: 'Elektrik faturanız 3 gün içinde ödenecek.',
      type: 'info',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
      isRead: true,
      isImportant: false,
      category: 'payment'
    },
    {
      _id: '5',
      title: 'Güvenlik Uyarısı',
      message: 'Hesabınıza yeni bir cihazdan giriş yapıldı.',
      type: 'error',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
      isRead: true,
      isImportant: true,
      category: 'security'
    }
  ];
  
  // Bildirimleri API'den çekme fonksiyonu
  const fetchNotifications = useCallback(async () => {
    if (!user || !user.token) {
      setError('Oturum açılmamış. Lütfen giriş yapın.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bildirimler başarıyla alındı:', response.data);
      setNotificationsList(response.data);
    } catch (error) {
      console.error('Bildirimler alınırken hata:', error);
      setError('Bildirimler alınamadı. Lütfen tekrar deneyin.');
      
      // API çalışmazsa örnek verileri kullan
      setNotificationsList(dummyNotificationsData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, API_URL]);
  
  // Yenileme işlemi için fonksiyon
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Ekran odaklandığında bildirimleri yenile
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );
  
  // İlk yükleme ve animasyon
  useEffect(() => {
    fetchNotifications();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [fetchNotifications]);
  
  // Bildirimi okundu/okunmadı olarak işaretle
  const toggleReadStatus = useCallback(async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Bildirimleri güncelle
      setNotificationsList(prevList => 
        prevList.map(item => 
          item._id === notificationId ? { ...item, isRead: !item.isRead } : item
        )
      );
    } catch (error) {
      console.error('Bildirim durumu güncellenirken hata:', error);
      Alert.alert('Hata', 'Bildirim durumu güncellenemedi.');
    }
  }, [user, API_URL]);
  
  // Bildirimi önemli/önemsiz olarak işaretle
  const toggleImportantStatus = useCallback(async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/api/notifications/${notificationId}/important`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Bildirimleri güncelle
      setNotificationsList(prevList => 
        prevList.map(item => 
          item._id === notificationId ? { ...item, isImportant: !item.isImportant } : item
        )
      );
    } catch (error) {
      console.error('Bildirim önemi güncellenirken hata:', error);
      Alert.alert('Hata', 'Bildirim önemi güncellenemedi.');
    }
  }, [user, API_URL]);
  
  // Bildirimi sil
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await axios.delete(
        `${API_URL}/api/notifications/${notificationId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Bildirimi listeden kaldır
      setNotificationsList(prevList => 
        prevList.filter(item => item._id !== notificationId)
      );
      
      // Açık bildirimi sıfırla
      if (openItemId === notificationId) {
        setOpenItemId(null);
      }
    } catch (error) {
      console.error('Bildirim silinirken hata:', error);
      Alert.alert('Hata', 'Bildirim silinemedi.');
    }
  }, [user, API_URL, openItemId]);
  
  // Bildirim silme onay işlevi
  const handleDeleteNotification = (id) => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => deleteNotification(id)
        },
      ]
    );
  };
  
  // Kategori ikonlarını al
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'price': return { name: 'trending-up', color: '#4E7AF9', bg: 'rgba(78, 122, 249, 0.1)' };
      case 'budget': return { name: 'pie-chart', color: '#FDCB6E', bg: 'rgba(253, 203, 110, 0.1)' };
      case 'security': return { name: 'shield', color: '#FF4757', bg: 'rgba(255, 71, 87, 0.1)' };
      case 'payment': return { name: 'calendar', color: '#2ED573', bg: 'rgba(46, 213, 115, 0.1)' };
      case 'investment': return { name: 'bar-chart', color: '#1A9E4A', bg: 'rgba(26, 158, 74, 0.1)' };
      case 'transaction': return { name: 'repeat', color: '#00BCD4', bg: 'rgba(0, 188, 212, 0.1)' };
      default: return { name: 'notifications', color: '#4E7AF9', bg: 'rgba(78, 122, 249, 0.1)' };
    }
  };
  
  // Tab butonlarını render et
  const renderTabButton = (title, id) => {
    const isActive = activeTab === id;
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(id)}
      >
        <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Zaman formatını düzenle
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };
  
  // Filtrelenmiş bildirimleri al
  const filteredNotifications = notificationsList.filter(item => {
    if (activeTab === 'unread') return !item.isRead;
    if (activeTab === 'important') return item.isImportant;
    return true; // 'all' tab
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={() => {}}>
            <Feather name="search" size={20} color="#4E7AF9" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              Alert.alert(
                'Tüm Bildirimleri Okundu İşaretle',
                'Tüm bildirimleri okundu olarak işaretlemek istediğinizden emin misiniz?',
                [
                  { text: 'İptal', style: 'cancel' },
                  { 
                    text: 'Onayla', 
                    onPress: async () => {
                      try {
                        await axios.patch(
                          `${API_URL}/api/notifications/mark-all-read`,
                          {},
                          {
                            headers: {
                              'Authorization': `Bearer ${user.token}`,
                              'Content-Type': 'application/json'
                            }
                          }
                        );
                        
                        // Tüm bildirimleri okundu olarak işaretle
                        setNotificationsList(prevList => 
                          prevList.map(item => ({ ...item, isRead: true }))
                        );
                      } catch (error) {
                        console.error('Bildirimler güncellenirken hata:', error);
                        Alert.alert('Hata', 'Bildirimler güncellenemedi.');
                      }
                    }
                  },
                ]
              );
            }}
          >
            <Feather name="check-square" size={20} color="#4E7AF9" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton('Tümü', 'all')}
        {renderTabButton('Okunmamış', 'unread')}
        {renderTabButton('Önemli', 'important')}
      </View>
      
      {/* Loading Indicator */}
      {loading && (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#4E7AF9" />
        </View>
      )}
      
      {/* Error Message */}
      {error && !loading && (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Text style={{color: '#FF4757', fontSize: 16, textAlign: 'center', marginBottom: 20}}>{error}</Text>
          <TouchableOpacity 
            style={{
              backgroundColor: '#4E7AF9', 
              paddingVertical: 10, 
              paddingHorizontal: 20, 
              borderRadius: 8
            }}
            onPress={fetchNotifications}
          >
            <Text style={{color: '#fff', fontWeight: '600'}}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Notification List */}
      {!loading && !error && filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4E7AF9']}
              tintColor="#4E7AF9"
            />
          }
          renderItem={({ item, index }) => {
            const categoryIcon = getCategoryIcon(item.category);
            
            // We can't use hooks inside renderItem, so we'll use a different approach
            // Create refs outside the render function and access them by index
            if (!item.animValues) {
              // Add animation values to the item object if they don't exist
              item.animValues = {
                opacity: new Animated.Value(1),
                scale: new Animated.Value(1),
                translateX: new Animated.Value(0)
              };
            }
            
            // PanResponder
            if (!item.panResponder) {
              item.panResponder = PanResponder.create({
                onStartShouldSetPanResponder: () => true,
              onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0) {
                  // Sola kaydırma (silme)
                  item.animValues.translateX.setValue(Math.max(gestureState.dx, -100));
                } else if (gestureState.dx > 0) {
                  // Sağa kaydırma (okundu/okunmadı)
                  item.animValues.translateX.setValue(Math.min(gestureState.dx, 100));
                }
              },
              onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -100) {
                  // Sola tam kaydırma - Sil
                  Animated.timing(item.animValues.translateX, {
                    toValue: -screenWidth,
                    duration: 250,
                    useNativeDriver: true
                  }).start(() => {
                    handleDeleteNotification(item._id);
                  });
                  
                  Animated.parallel([
                    Animated.timing(item.animValues.opacity, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true
                    }),
                    Animated.timing(item.animValues.scale, {
                      toValue: 0.8,
                      duration: 300,
                      useNativeDriver: true
                    })
                  ]).start();
                } else if (gestureState.dx > 100) {
                  // Sağa tam kaydırma - Okundu/Okunmadı
                  toggleReadStatus(item._id);
                  Animated.spring(item.animValues.translateX, {
                    toValue: 0,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true
                  }).start();
                } else {
                  // Yetersiz kaydırma - Geri dön
                  Animated.spring(item.animValues.translateX, {
                    toValue: 0,
                    friction: 5,
                    tension: 40,
                    useNativeDriver: true
                  }).start();
                }
              }
              });
            }
            
            return (
              <Animated.View
                style={{
                  marginBottom: 12,
                  opacity: item.animValues.opacity,
                  transform: [{ translateX: item.animValues.translateX }, { scale: item.animValues.scale }]
                }}
                {...item.panResponder.panHandlers}
              >
                <TouchableOpacity 
                  style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                  onPress={() => toggleReadStatus(item._id)}
                >
                  <View 
                    style={[
                      styles.notificationIconContainer, 
                      { backgroundColor: categoryIcon.bg }
                    ]}
                  >
                    <Feather name={categoryIcon.name} size={20} color={categoryIcon.color} />
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <TouchableOpacity onPress={() => toggleImportantStatus(item._id)}>
                        <Feather 
                          name={item.isImportant ? "star" : "star"} 
                          size={16} 
                          color={item.isImportant ? "#FDCB6E" : "#ddd"} 
                          style={{padding: 4}}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                  
                  {!item.isRead && (
                    <View style={styles.unreadIndicator} />
                  )}
                </TouchableOpacity>
                
                <View style={styles.actionHints}>
                  <View style={styles.leftActionHint}>
                    <Feather name="check-square" size={14} color="#fff" />
                    <Text style={styles.actionHintText}>Okundu</Text>
                  </View>
                  <View style={styles.rightActionHint}>
                    <Feather name="trash-2" size={14} color="#fff" />
                    <Text style={styles.actionHintText}>Sil</Text>
                  </View>
                </View>
              </Animated.View>
            );
          }}
        />
      ) : (
        // Boş Durum (Animasyonlu)
        !loading && !error && (
          <Animated.View 
            style={[
              styles.emptyContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={['rgba(78, 122, 249, 0.1)', 'rgba(78, 122, 249, 0.05)']}
                style={styles.emptyIconBackground}
              >
                <Feather name="bell-off" size={32} color="#4E7AF9" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTextTitle}>Bildirim Yok</Text>
            <Text style={styles.emptyTextDescription}>
              Henüz hiç bildiriminiz yok. Yeni bir işlem eklediğinizde veya önemli bir güncelleme olduğunda burada görünecek.
            </Text>
          </Animated.View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  actionHints: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    zIndex: -1,
    top: 0,
    bottom: 0,
  },
  leftActionHint: {
    backgroundColor: '#2ED573',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  rightActionHint: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  actionHintText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  unreadIndicator: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4E7AF9',
    right: 8,
    top: 8,
  },
  addDummyButton: {
    marginTop: 24,
    overflow: 'hidden',
    borderRadius: 12,
  },
  addDummyButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addDummyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 122, 249, 0.1)',
    marginLeft: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  activeTabButton: {
    backgroundColor: '#4E7AF9',
  },
  tabButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 100, // Alt tabbar için boşluk
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  unreadCard: {
    backgroundColor: 'rgba(78, 122, 249, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#4E7AF9',
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationMessage: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
  },
  importantBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FDCB6E',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyTextDescription: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
