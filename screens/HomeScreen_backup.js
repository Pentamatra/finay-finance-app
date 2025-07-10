import React, { useContext, useState, useEffect, useRef } from 'react';
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
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
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
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kullanıcı profil bilgisini çek
      const token = user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Kullanıcı profilini çek
      const { data } = await axios.get('http://10.0.2.2:5000/api/users/profile', config);
      
      if (data) {
        setBalance(data.balance);
      }
      
      // Burada işlem geçmişi çekilebilir (backend'de hazır olunca)
      // İşlem geçmişi için şimdilik boş array kullanıyoruz
      setTransactions([]);
      
      // İstatistikleri hesapla (gerçek veriler gelince güncellenecek)
      setStats({
        income: 0,
        expense: 0,
        savings: 0
      });
      
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Yenileme işlemi
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };
  
  // İlk yükleme
  useEffect(() => {
    fetchUserData();
  }, []);

  // Kategori ikonları
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'shopping': return { name: 'cart-outline', color: '#3498db', background: '#e1f0fa' };
      case 'income': return { name: 'cash-outline', color: '#2ecc71', background: '#e8f8f0' };
      case 'bill': return { name: 'document-text-outline', color: '#e74c3c', background: '#fadbd8' };
      case 'housing': return { name: 'home-outline', color: '#9b59b6', background: '#f4ecf7' };
      case 'food': return { name: 'fast-food-outline', color: '#f39c12', background: '#fef5e7' };
      case 'entertainment': return { name: 'cafe-outline', color: '#1abc9c', background: '#e8f8f5' };
      case 'transport': return { name: 'car-outline', color: '#34495e', background: '#ebedef' };
      case 'health': return { name: 'fitness-outline', color: '#e84393', background: '#fcf0f7' };
      default: return { name: 'ellipsis-horizontal-outline', color: '#95a5a6', background: '#f4f6f6' };
    }
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ₺`;
  };
  
  // İşlem renkleri
  const getAmountColor = (amount) => {
    return amount >= 0 ? '#2ecc71' : '#e74c3c';
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
          
          {/* Bakiye Kartı - Now with animation */}
          <Animated.View style={[styles.balanceCardContainer, {
            transform: [{ scale: balanceScale }]
          }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceTitle}>Toplam Bakiye</Text>
                <View style={styles.balanceBadge}>
                  <Feather name="trending-up" size={12} color="#fff" />
                  <Text style={styles.balanceBadgeText}>%2.3</Text>
                </View>
              </View>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
              <View style={styles.balanceCardFooter}>
                <View style={styles.balanceActionButton}>
                  <Feather name="activity" size={14} color="#fff" />
                  <Text style={styles.balanceActionText}>Aktivite</Text>
                </View>
                <View style={styles.balanceActionButton}>
                  <Feather name="bar-chart-2" size={14} color="#fff" />
                  <Text style={styles.balanceActionText}>Rapor</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
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

        {/* Finansal Genel Bakış - Modern cards with shadow effect */}
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
        
        {/* Finansal İşlemler */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNew}>Finansal İşlemler</Text>
          <View style={styles.actionsContainerNew}>
            <TouchableOpacity 
              style={styles.actionCardNew} 
              onPress={() => navigation.navigate('Portfolio')}
            >
              <LinearGradient
                colors={['#4e67f3', '#6057e7']}
                style={styles.actionIconGradient}
              >
                <Ionicons name="trending-up" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Portföy</Text>
              <Text style={styles.actionDescription}>Yatırımlarınızı takip edin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardNew}
              onPress={() => navigation.navigate('Reports')}
            >
              <LinearGradient
                colors={['#f5a623', '#f7b84b']}
                style={styles.actionIconGradient}
              >
                <MaterialCommunityIcons name="file-chart" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Raporlar</Text>
              <Text style={styles.actionDescription}>Finansal analizler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardNew}
              onPress={() => navigation.navigate('Alerts')}
            >
              <LinearGradient
                colors={['#2ecc71', '#69db9a']}
                style={styles.actionIconGradient}
              >
                <Ionicons name="notifications" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Alarmlar</Text>
              <Text style={styles.actionDescription}>Fiyat alarmları</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardNew}
              onPress={() => navigation.navigate('Stocks')}
            >
              <LinearGradient
                colors={['#e74c3c', '#f1948a']}
                style={styles.actionIconGradient}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Piyasalar</Text>
              <Text style={styles.actionDescription}>Piyasa verileri</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Özet Kartları - Modern card design with gradients */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNew}>Finansal Özet</Text>
          <View style={styles.summaryCardsContainer}>
            <View style={styles.summaryCardRow}>
              <TouchableOpacity style={styles.summaryCardNew}>
                <LinearGradient
                  colors={['rgba(46, 213, 115, 0.15)', 'rgba(46, 213, 115, 0.05)']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryCardIconContainer}>
                    <LinearGradient
                      colors={['#2ED573', '#7BED9F']}
                      style={styles.summaryCardIcon}
                    >
                      <Feather name="arrow-down" size={16} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.summaryCardTitleNew}>Gelirler</Text>
                  <Text style={[styles.summaryCardAmountNew, {color: '#2ED573'}]}>
                    {formatCurrency(stats.income).replace('+', '')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.summaryCardNew}>
                <LinearGradient
                  colors={['rgba(255, 71, 87, 0.15)', 'rgba(255, 71, 87, 0.05)']}
                  style={styles.summaryCardGradient}
                >
                  <View style={styles.summaryCardIconContainer}>
                    <LinearGradient
                      colors={['#FF4757', '#FF7B86']}
                      style={styles.summaryCardIcon}
                    >
                      <Feather name="arrow-up" size={16} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={styles.summaryCardTitleNew}>Giderler</Text>
                  <Text style={[styles.summaryCardAmountNew, {color: '#FF4757'}]}>
                    {formatCurrency(-stats.expense).replace('+', '')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={[styles.summaryCardNew, styles.savingsCard]}>
              <LinearGradient
                colors={['rgba(78, 122, 249, 0.15)', 'rgba(78, 122, 249, 0.05)']}
                style={styles.summaryCardGradient}
              >
                <View style={styles.savingsSummaryContent}>
                  <View style={styles.savingsIconContainer}>
                    <LinearGradient
                      colors={['#4E7AF9', '#8C69FF']}
                      style={styles.summaryCardIcon}
                    >
                      <Feather name="trending-up" size={16} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.savingsTextContainer}>
                    <Text style={styles.summaryCardTitleNew}>Aylık Tasarruf</Text>
                    <Text style={[styles.summaryCardAmountNew, {color: '#4E7AF9'}]}>
                      {formatCurrency(stats.savings).replace('+', '')}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Yatırım Araçları - Modern and minimal */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNew}>Piyasa Erişim Servisleri</Text>
          <View style={styles.servicesContainer}>
            <TouchableOpacity 
              style={styles.serviceItemNew} 
              onPress={() => navigation.navigate('Stocks')}
            >
              <View style={[styles.serviceIconNew, { backgroundColor: 'rgba(78, 122, 249, 0.1)' }]}>
                <Feather name="bar-chart-2" size={20} color="#4E7AF9" />
              </View>
              <Text style={styles.serviceTextNew}>Hisse Senetleri</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceItemNew} 
              onPress={() => navigation.navigate('Crypto')}
            >
              <View style={[styles.serviceIconNew, { backgroundColor: 'rgba(46, 213, 115, 0.1)' }]}>
                <Feather name="dollar-sign" size={20} color="#2ED573" />
              </View>
              <Text style={styles.serviceTextNew}>Kripto</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceItemNew} 
              onPress={() => navigation.navigate('Funds')}
            >
              <View style={[styles.serviceIconNew, { backgroundColor: 'rgba(253, 203, 110, 0.1)' }]}>
                <Feather name="pie-chart" size={20} color="#FDCB6E" />
              </View>
              <Text style={styles.serviceTextNew}>Yatırım Fonları</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceItemNew} 
              onPress={() => navigation.navigate('Forex')}
            >
              <View style={[styles.serviceIconNew, { backgroundColor: 'rgba(255, 71, 87, 0.1)' }]}>
                <Feather name="globe" size={20} color="#FF4757" />
              </View>
              <Text style={styles.serviceTextNew}>Döviz</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Piyasa Analizleri */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitleNew}>Piyasa Analizleri</Text>
          <View style={styles.actionsContainerNew}>
            <TouchableOpacity 
              style={styles.actionCardNew} 
              onPress={() => navigation.navigate('Stocks')}
            >
              <LinearGradient
                colors={['#FF5E3A', '#FF9E80']}
                style={styles.actionIconGradient}
              >
                <FontAwesome5 name="chart-line" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Hisse Senetleri</Text>
              <Text style={styles.actionDescription}>Borsa takibi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardNew}
              onPress={() => navigation.navigate('Crypto')}
            >
              <LinearGradient
                colors={['#4E7AF9', '#6E8EFB']}
                style={styles.actionIconGradient}
              >
                <FontAwesome5 name="bitcoin" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Kripto</Text>
              <Text style={styles.actionDescription}>Kripto paralar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardNew}
              onPress={() => navigation.navigate('Funds')}
            >
              <LinearGradient
                colors={['#2ED573', '#7BED9F']}
                style={styles.actionIconGradient}
              >
                <Ionicons name="pie-chart" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Fonlar</Text>
              <Text style={styles.actionDescription}>Yatırım fonları</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCardNew}
              onPress={() => navigation.navigate('Forex')}
            >
              <LinearGradient
                colors={['#FDCB6E', '#FFE082']}
                style={styles.actionIconGradient}
              >
                <FontAwesome5 name="exchange-alt" size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionTextNew}>Döviz</Text>
              <Text style={styles.actionDescription}>Döviz kurları</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Son İşlemler - Modern card design */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNew}>Son İşlemler</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.viewAllText}>Tümünü Gör</Text>
              <Feather name="chevron-right" size={16} color="#4E7AF9" />
            </TouchableOpacity>
          </View>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyTransactionsNew}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={['rgba(78, 122, 249, 0.1)', 'rgba(78, 122, 249, 0.05)']}
                  style={styles.emptyIconBackground}
                >
                  <Feather name="inbox" size={40} color="#4E7AF9" />
                </LinearGradient>
              </View>
              <Text style={styles.emptyTextTitle}>Henüz işlem yok</Text>
              <Text style={styles.emptyTextDescription}>Yeni bir işlem ekleyerek başlayın</Text>
              <TouchableOpacity 
                style={styles.addButtonNew}
                onPress={() => navigation.navigate('AddTransaction')}
              >
                <LinearGradient
                  colors={['#4E7AF9', '#8C69FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}
                >
                  <Feather name="plus" size={16} color="#fff" style={{marginRight: 5}} />
                  <Text style={styles.addButtonTextNew}>İşlem Ekle</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            transactions.map((transaction) => {
              const icon = getCategoryIcon(transaction.category);
              return (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionItemNew}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}
                >
                  <View style={styles.transactionLeftContent}>
                    <View style={styles.categoryIconContainer}>
                      <LinearGradient
                        colors={['rgba(78, 122, 249, 0.2)', 'rgba(78, 122, 249, 0.05)']}
                        style={styles.categoryIconNew}
                      >
                        <Feather name={transaction.amount >= 0 ? "arrow-down" : "arrow-up"} 
                               size={16} 
                               color={transaction.amount >= 0 ? "#2ED573" : "#FF4757"} />
                      </LinearGradient>
                    </View>
                    <View>
                      <Text style={styles.transactionTitleNew}>{transaction.title}</Text>
                      <Text style={styles.transactionDateNew}>{transaction.date}</Text>
                    </View>
                  </View>
                  <Text 
                    style={[styles.transactionAmountNew, { 
                      color: transaction.amount >= 0 ? "#2ED573" : "#FF4757" 
                    }]}
                  >
                    {formatCurrency(transaction.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        
        {/* Alt boşluk */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    borderRadius: 16,
    overflow: 'hidden',
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
      // Quick Actions new styles
      quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
      quickActionCard: {
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
    borderRadius: 16,
    overflow: 'hidden',
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
  // Quick Actions new styles
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  // Summary Cards new styles
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
  savingsCard: {
    width: '100%',
  },
  summaryCardGradient: {
    padding: 16,
    borderRadius: 16,
    height: 120,
  },
  savingsSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCardIconContainer: {
    marginBottom: 12,
  },
  savingsIconContainer: {
    marginRight: 12,
  },
  summaryCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsTextContainer: {
    flex: 1,
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
  // Services new styles
  servicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  serviceItemNew: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  serviceIconNew: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTextNew: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  // Empty transactions new styles
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
  transactionDateNew: {
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  transactionAmountNew: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 100
  }
});

export default HomeScreen;
