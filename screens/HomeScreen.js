import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import TransactionChart from '../components/TransactionChart';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, colors } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    savings: 0
  });
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([
    { month: 1, amount: 3500 },
    { month: 2, amount: 4200 },
    { month: 3, amount: 3800 },
    { month: 4, amount: 5100 },
    { month: 5, amount: 4800 },
    { month: 6, amount: 6200 },
  ]);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });
  const headerElevation = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 5],
    extrapolate: 'clamp'
  });
  const balanceScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });
  
  // Veri çekme işlemi
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kullanıcı oturum açtı mı kontrol et
      if (!user || !user.token) {
        throw new Error('Oturum açılmamış. Lütfen giriş yapın.');
      }
      
      console.log('Token bilgisi:', user.token);
      const token = user.token;
      
      // API host - Emülatör için 10.0.2.2, gerçek cihaz için localhost
      const apiHost = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      
      // Paralel olarak profil ve işlem verilerini çek
      const [profileResponse, transactionsResponse, statsResponse] = await Promise.all([
        // Kullanıcı profilini çek
        fetch(`${apiHost}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        
        // Son işlemleri çek (en son 10 işlem)
        fetch(`${apiHost}/api/transactions?limit=10&sortBy=date_desc`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        
        // İstatistikleri çek
        fetch(`${apiHost}/api/transactions/stats/summary?period=month`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      // Profil yanıtını kontrol et
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.message || 'Profil bilgileri alınamadı');
      }
      
      // İşlem yanıtını kontrol et
      if (!transactionsResponse.ok) {
        const errorData = await transactionsResponse.json();
        throw new Error(errorData.message || 'İşlem verileri alınamadı');
      }
      
      // İstatistik yanıtını kontrol et
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        throw new Error(errorData.message || 'İstatistik verileri alınamadı');
      }
      
      // Yanıtları işle
      const profileData = await profileResponse.json();
      const transactionsData = await transactionsResponse.json();
      const statsData = await statsResponse.json();
      
      console.log('Profil yanıtı:', profileData);
      console.log('İşlem yanıtı:', transactionsData);
      console.log('İstatistik yanıtı:', statsData);
      
      // Profil verilerini ayarla
      if (profileData) {
        setBalance(profileData.balance || 0);
      }
      
      // İşlem verilerini ayarla
      if (transactionsData && transactionsData.data) {
        setTransactions(transactionsData.data);
      }
      
      // İstatistik verilerini ayarla
      if (statsData && statsData.data) {
        setStats({
          income: statsData.data.income || 0,
          expense: statsData.data.expense || 0,
          savings: statsData.data.savings || 0
        });
        
        // Grafik verilerini güncelle
        if (statsData.data.chartData && statsData.data.chartData.labels) {
          const chartLabels = statsData.data.chartData.labels;
          const chartValues = statsData.data.chartData.datasets.expense || [];
          
          // Grafik verilerini formatlayıp ayarla
          const formattedChartData = chartLabels.map((label, index) => ({
            month: index + 1,
            label,
            amount: chartValues[index] || 0
          }));
          
          setChartData(formattedChartData);
        }
      }
      
    } catch (err) {
      console.error('Veri çekme hatası:', err.message || err);
      setError('Veriler yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);
  
  // Yenileme işlemi
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);
  
  // İlk yükleme
  useEffect(() => {
    if (user && user.token) {
      fetchUserData();
    } else {
      setLoading(false);
      setError('Oturum açılmamış. Lütfen giriş yapın.');
    }
  }, [user, fetchUserData]);

  // Kategori ikonları
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Yiyecek': return { name: 'restaurant-outline', color: '#1a9e4a', background: '#e8f8f0' };
      case 'Faturalar': return { name: 'flash-outline', color: '#e74c3c', background: '#fadbd8' };
      case 'Konaklama': return { name: 'home-outline', color: '#1a4a9e', background: '#e1f0fa' };
      case 'Ulaşım': return { name: 'car-outline', color: '#f1c40f', background: '#fdebd0' };
      case 'Eğlence': return { name: 'game-controller-outline', color: '#FF4757', background: '#ffecee' };
      case 'Alışveriş': return { name: 'cart-outline', color: '#FF7043', background: '#ffede7' };
      case 'Sağlık': return { name: 'medkit-outline', color: '#2196F3', background: '#e3f2fd' };
      case 'Eğitim': return { name: 'school-outline', color: '#9C27B0', background: '#f3e5f5' };
      case 'Yatırım': return { name: 'trending-up-outline', color: '#00BCD4', background: '#e0f7fa' };
      case 'Maaş': return { name: 'cash-outline', color: '#8BC34A', background: '#f1f8e9' };
      case 'Diğer': return { name: 'ellipsis-horizontal-outline', color: '#607D8B', background: '#eceff1' };
      default: return { name: 'ellipsis-horizontal-outline', color: '#7f8c8d', background: '#f0f0f0' };
    }
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // İşlem renkleri
  const getAmountColor = (amount) => {
    return amount > 0 ? '#2ecc71' : '#e74c3c';
  };

  // İşlem silme onayı
  const confirmDeleteTransaction = (transactionId) => {
    Alert.alert(
      'İşlemi Sil',
      'Bu işlemi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteTransaction(transactionId) }
      ]
    );
  };

  // İşlem silme işlemi
  const deleteTransaction = async (transactionId) => {
    try {
      setLoading(true);
      const apiHost = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      
      const response = await fetch(`${apiHost}/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'İşlem silinirken bir hata oluştu');
      }

      // İşlem başarıyla silindi, verileri yenile
      setTransactions(transactions.filter(t => t._id !== transactionId));
      fetchUserData(); // İstatistikleri ve bakiye bilgisini yenile
      
      // Bildirim göster
      Alert.alert('Başarılı', 'İşlem başarıyla silindi');
    } catch (error) {
      setError(error.message);
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Çıkış işlemi
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  // Yükleniyor ekranı
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E7AF9" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4E7AF9" />
      
      {/* Header - Using Animated View with scroll-based opacity */}
      <Animated.View style={[styles.headerOuterContainer, {
        opacity: headerOpacity,
        elevation: headerElevation
      }]}>
        <LinearGradient
          colors={['#4E7AF9', '#8C69FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerContainer}
        >
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'K'}</Text>
                </LinearGradient>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.greeting}>Merhaba,</Text>
                <Text style={styles.userName}>{user?.name || 'Kullanıcı'}</Text>
              </View>
            </View>
            
            <View style={styles.headerActions}>
              {user?.isAdmin && (
                <TouchableOpacity
                  style={[styles.headerButton, styles.headerButtonWithBg]}
                  onPress={() => navigation.navigate('Admin')}
                >
                  <Ionicons name="shield-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.headerButton, styles.headerButtonWithBg]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bakiye Kartı */}
          <Animated.View style={[
            styles.balanceCard,
            { transform: [{ scale: balanceScale }] }
          ]}>
            <LinearGradient
              colors={['#4E7AF9', '#8C69FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCardGradient}
            >
              <View style={styles.balanceInfoContainer}>
                <Text style={styles.balanceLabel}>Toplam Bakiyeniz</Text>
                <Text style={styles.balanceAmount}>₺{balance.toLocaleString('tr-TR')}</Text>
                <Text style={styles.balanceDate}>Güncel</Text>
              </View>
              
              <View style={styles.balanceCardDeco}></View>
            </LinearGradient>
          </Animated.View>
            
            {/* Yeni İşlem Ekle Butonu */}
            <TouchableOpacity 
              style={styles.addTransactionButton}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <LinearGradient
                colors={['#1a9e4a', '#2ecc71']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addTransactionGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addTransactionText}>Yeni İşlem</Text>
              </LinearGradient>
            </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
      
      {/* Ana İçerik - Animated Scroll */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4E7AF9', '#8C69FF']}
            tintColor="#4E7AF9"
          />
        }
      >
        {/* Hata Mesajı */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF4757" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Finansal Genel Bakış */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNew}>Finansal Genel Bakış</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Stats')}
            >
              <LinearGradient
                colors={['#4E7AF9', '#8C69FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconGradient}
              >
                <Feather name="trending-up" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Piyasa Analizi</Text>
              <Text style={styles.actionDescription}>Güncel veriler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Portfolio')}
            >
              <LinearGradient
                colors={['#2ED573', '#7BED9F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconGradient}
              >
                <Feather name="briefcase" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Portföy</Text>
              <Text style={styles.actionDescription}>Varlık yönetimi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Reports')}
            >
              <LinearGradient
                colors={['#FDCB6E', '#FDE69E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconGradient}
              >
                <Feather name="file-text" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Raporlar</Text>
              <Text style={styles.actionDescription}>Detaylı analiz</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Alerts')}
            >
              <LinearGradient
                colors={['#FF4757', '#FF7B86']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionIconGradient}
              >
                <Feather name="bell" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Uyarılar</Text>
              <Text style={styles.actionDescription}>Fiyat takibi</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Finansal Özet */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNew}>Finansal Özet</Text>
          <View style={styles.summaryCardsContainer}>
            <View style={styles.summaryCardRow}>
              {/* Gelir Kartı */}
              <View style={styles.summaryCardNew}>
                <LinearGradient
                  colors={['#ffffff', '#f9f9f9']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryCardIconContainer}>
                    <LinearGradient
                      colors={['#e8f8f0', '#d1f2e6']}
                      style={styles.summaryCardIcon}
                    >
                      <Ionicons name="arrow-up-outline" size={20} color="#2ecc71" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.summaryCardTitleNew}>Gelir</Text>
                  <Text style={[styles.summaryCardAmountNew, {color: '#2ecc71'}]}>₺{stats.income.toLocaleString('tr-TR')}</Text>
                </LinearGradient>
              </View>
              
              {/* Gider Kartı */}
              <View style={styles.summaryCardNew}>
                <LinearGradient
                  colors={['#ffffff', '#f9f9f9']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryCardIconContainer}>
                    <LinearGradient
                      colors={['#fadbd8', '#f5c1bc']}
                      style={styles.summaryCardIcon}
                    >
                      <Ionicons name="arrow-down-outline" size={20} color="#e74c3c" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.summaryCardTitleNew}>Gider</Text>
                  <Text style={[styles.summaryCardAmountNew, {color: '#e74c3c'}]}>₺{stats.expense.toLocaleString('tr-TR')}</Text>
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.summaryCardRow}>
              {/* Tasarruf Kartı */}
              <View style={styles.summaryCardNew}>
                <LinearGradient
                  colors={['#ffffff', '#f9f9f9']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryCardIconContainer}>
                    <LinearGradient
                      colors={['#e1f0fa', '#c9e4f5']}
                      style={styles.summaryCardIcon}
                    >
                      <Ionicons name="wallet-outline" size={20} color="#3498db" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.summaryCardTitleNew}>Tasarruf</Text>
                  <Text style={[styles.summaryCardAmountNew, {color: '#3498db'}]}>₺{stats.savings.toLocaleString('tr-TR')}</Text>
                </LinearGradient>
              </View>
              
              {/* Portföy Kartı */}
              <View style={styles.summaryCardNew}>
                <LinearGradient
                  colors={['#ffffff', '#f9f9f9']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryCardIconContainer}>
                    <LinearGradient
                      colors={['#e8f8f0', '#d1f2e6']}
                      style={styles.summaryCardIcon}
                    >
                      <Ionicons name="trending-up-outline" size={20} color="#2ecc71" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.summaryCardTitleNew}>Portföy</Text>
                  <Text style={[styles.summaryCardAmountNew, {color: '#9b59b6'}]}>₺{(balance - stats.savings).toLocaleString('tr-TR')}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </View>
        
        {/* Son İşlemler */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNew}>Son İşlemler</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.viewAllText}>Tümünü Gör</Text>
              <Ionicons name="chevron-forward" size={16} color="#4E7AF9" />
            </TouchableOpacity>
          </View>
          
          {transactions.length === 0 ? (
            // İşlem yok ise
            <View style={styles.emptyTransactionsNew}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={['#e1f0fa', '#c9e4f5']}
                  style={styles.emptyIconBackground}
                >
                  <Ionicons name="document-text-outline" size={32} color="#3498db" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTextTitle}>Henüz işlem yok</Text>
              <Text style={styles.emptyTextDescription}>Gelir ve gider takibi yapmak için ilk işleminizi ekleyin.</Text>
              
              <TouchableOpacity 
                style={styles.addButtonNew}
                onPress={() => navigation.navigate('AddTransaction')}
              >
                <LinearGradient
                  colors={['#4E7AF9', '#8C69FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#fff" style={{marginRight: 8}} />
                  <Text style={styles.addButtonTextNew}>İşlem Ekle</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            // İşlemler varsa
            <View>
              {transactions.slice(0, 5).map((transaction) => {
                // Tarih formatını düzenle
                const transactionDate = new Date(transaction.date);
                const formattedDate = `${transactionDate.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][transactionDate.getMonth()]} ${transactionDate.getFullYear()}`;
                
                // Kategori ikonunu al
                const categoryIcon = getCategoryIcon(transaction.category);
                
                return (
                  <TouchableOpacity 
                    key={transaction._id} 
                    style={styles.transactionItemNew}
                    onPress={() => {
                      // İşlem detay/düzenleme menüsünü göster
                      Alert.alert(
                        'İşlem Detayı',
                        `${transaction.category} - ₺${transaction.amount.toLocaleString('tr-TR')}`,
                        [
                          {
                            text: 'İptal',
                            style: 'cancel',
                          },
                          {
                            text: 'Düzenle',
                            onPress: () => navigation.navigate('EditTransaction', { transaction }),
                            style: 'default',
                          },
                          {
                            text: 'Sil',
                            onPress: () => confirmDeleteTransaction(transaction._id),
                            style: 'destructive',
                          },
                        ]
                      );
                    }}
                  >
                    <View style={styles.transactionLeftContent}>
                      <View style={styles.categoryIconContainer}>
                        <LinearGradient
                          colors={[categoryIcon.background, categoryIcon.background]}
                          style={styles.categoryIconNew}
                        >
                          <Ionicons name={categoryIcon.name} size={22} color={categoryIcon.color} />
                        </LinearGradient>
                      </View>
                      <View>
                        <Text style={styles.transactionTitleNew}>{transaction.category}</Text>
                        {transaction.description ? (
                          <Text style={styles.transactionDescriptionNew}>{transaction.description}</Text>
                        ) : null}
                        <Text style={styles.transactionDateNew}>{formattedDate}</Text>
                      </View>
                    </View>
                    <View style={styles.transactionRightContent}>
                      <Text 
                        style={[styles.transactionAmountNew, 
                          {color: transaction.type === 'income' ? '#2ecc71' : '#e74c3c'}
                        ]}
                      >
                        {transaction.type === 'income' ? '+' : '-'}₺{transaction.amount.toLocaleString('tr-TR')}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#bbb" style={styles.transactionArrow} />
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {/* Daha Fazla Göster Butonu */}
              {transactions.length > 5 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => navigation.navigate('Transactions')}
                >
                  <Text style={styles.showMoreText}>Daha Fazla Göster</Text>
                  <Ionicons name="chevron-down" size={16} color="#4E7AF9" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  addTransactionButton: {
    position: 'absolute',
    right: 24,
    top: 160,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10,
  },
  addTransactionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
  },
  addTransactionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    color: '#777',
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerOuterContainer: {
    zIndex: 10,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonWithBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    padding: 10,
  },
  balanceCardContainer: {
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: -50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  balanceCard: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  balanceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginVertical: 5,
  },
  balanceCardFooter: {
    flexDirection: 'row',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
  },
  balanceActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  balanceActionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginLeft: 5,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
    zIndex: 1,
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF4757',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  sectionContainer: {
    marginTop: 15,
    padding: 20,
  },
  sectionTitleNew: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    letterSpacing: 0.25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#4E7AF9',
    fontWeight: '600',
    marginRight: 5,
  },
  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTextNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#888',
  },
  // Summary Cards
  summaryCardsContainer: {
    marginTop: 5,
  },
  summaryCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCardNew: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryCardGradient: {
    padding: 16,
    borderRadius: 16,
    height: 120,
  },
  summaryCardIconContainer: {
    marginBottom: 12,
  },
  summaryCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCardTitleNew: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  summaryCardAmountNew: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // Empty transactions
  emptyTransactionsNew: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIconBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyTextDescription: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButtonNew: {
    overflow: 'hidden',
    borderRadius: 25,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonTextNew: {
    color: '#fff',
    fontWeight: '600',
  },
  // Transaction items new styles
  transactionItemNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 15,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  transactionLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionArrow: {
    marginLeft: 6,
  },
  categoryIconContainer: {
    marginRight: 12,
  },
  categoryIconNew: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionTitleNew: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  transactionDescriptionNew: {
    color: '#555',
    fontSize: 14,
    marginTop: 2,
  },
  transactionDateNew: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  transactionAmountNew: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  showMoreText: {
    color: '#4E7AF9',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  bottomSpacer: {
    height: 100
  }
});

export default HomeScreen;
