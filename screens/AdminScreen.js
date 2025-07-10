import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AdminScreen = ({ navigation }) => {
  // ThemeContext'ten tema bilgilerini al
  const { isDarkMode, colors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalBalance: 0,
    newUsersThisWeek: 0,
    transactionsThisMonth: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('users');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    sortBy: 'name', // 'name', 'balance', 'lastLogin'
    order: 'asc', // 'asc', 'desc'
    minBalance: '',
    maxBalance: '',
    isActive: null // true, false, null (all)
  });
  
  // Dummy data for chart
  const [chartData, setChartData] = useState({
    labels: ['Paz', 'Pts', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 50],
        color: () => isDarkMode ? colors.primary : '#1a4a9e',
      }
    ]
  });
  
  const scrollY = new Animated.Value(0);

  // Yeni daha kapsamlı fetchData fonksiyonu
  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('Admin veri çekme işlemi başlatılıyor...');
      
      // AsyncStorage'dan user bilgisi ve token'ı al
      const userDataString = await AsyncStorage.getItem('user');
      if (!userDataString) {
        Alert.alert('Oturum Hatası', 'Lütfen tekrar giriş yapın');
        setIsLoading(false);
        return;
      }
      
      const userData = JSON.parse(userDataString);
      const token = userData.token;
      
      console.log('Token alındı, API isteği yapılıyor...');
      
      // Platform'a göre API URL'ini ayarla
      let API_URL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:5001/api' // Android emülatör
        : 'http://localhost:5001/api'; // iOS simulator
      
      // Authorization header'ı ekle
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // API isteğini yap
      console.log('API isteği yapılıyor:', `${API_URL}/admin/users`);
      const response = await axios.get(`${API_URL}/admin/users`, config);
      console.log('API yanıtı alındı:', response.status);
      
      const usersData = response.data.users || [];
      console.log(`${usersData.length} kullanıcı yüklendi`);
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Haftalık yeni kullanıcı sayısı için basit bir hesaplama
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersCount = usersData.filter(user => 
        user.createdAt && new Date(user.createdAt) > oneWeekAgo
      ).length;
      
      // İstatistik verileri güncelleme - sadece gerçek veriler kullan
      setStats({
        totalUsers: response.data.totalUsers || usersData.length,
        activeUsers: response.data.activeUsers || 0,
        totalBalance: response.data.totalBalance || 0,
        newUsersThisWeek: newUsersCount,
        transactionsThisMonth: response.data.transactionsThisMonth || 0
      });
      
      // Haftalık kullanıcı aktivitesi için API'den gelen gerçek verileri kullan
      if (response.data.chartData) {
        setChartData({
          labels: response.data.chartData.labels || [],
          datasets: [{
            data: response.data.chartData.values || [],
            color: () => isDarkMode ? colors.primary : '#1a4a9e',
          }]
        });
      }
      
      console.log('Admin ekranı verileri başarıyla yüklendi');
    } catch (error) {
      console.error('Admin veri çekme hatası:', error);
      let errorMsg = 'Veriler yüklenirken bir hata oluştu';
      
      // Özel hata mesajları
      if (error.response) {
        if (error.response.status === 403) {
          errorMsg = 'Bu işlemi yapmak için yetkiniz yok';
        } else if (error.response.status === 401) {
          errorMsg = 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın';
          // Oturumu sonlandır ve giriş ekranına yönlendir
          setTimeout(() => {
            AsyncStorage.removeItem('user');
            navigation.navigate('Login');
          }, 1500);
        } else {
          errorMsg = error.response.data?.message || 'Bir hata oluştu';
        }
      } else if (error.request) {
        errorMsg = 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edin';
      }
      
      Alert.alert('Hata', errorMsg);
      console.error('FetchData error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Arama fonksiyonu
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      applyFilters(users, filterOptions); // Boş aramada sadece filtreleri uygula
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(text.toLowerCase()) || 
        user.email.toLowerCase().includes(text.toLowerCase())
      );
      applyFilters(filtered, filterOptions);
    }
  };
  
  // Filtreleme fonksiyonu
  const applyFilters = (usersToFilter, options) => {
    let result = [...usersToFilter];
    
    // Minimum bakiye filtresi
    if (options.minBalance !== '') {
      result = result.filter(user => user.balance >= parseFloat(options.minBalance));
    }
    
    // Maksimum bakiye filtresi
    if (options.maxBalance !== '') {
      result = result.filter(user => user.balance <= parseFloat(options.maxBalance));
    }
    
    // Aktif kullanıcı filtresi
    if (options.isActive !== null) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      if (options.isActive) {
        result = result.filter(user => new Date(user.lastLogin) > oneWeekAgo);
      } else {
        result = result.filter(user => new Date(user.lastLogin) <= oneWeekAgo);
      }
    }
    
    // Sıralama
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (options.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'lastLogin':
          aValue = new Date(a.lastLogin);
          bValue = new Date(b.lastLogin);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (options.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredUsers(result);
  };
  
  // Filtre değişiklikleri
  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filterOptions, ...newFilters };
    setFilterOptions(updatedFilters);
    applyFilters(users, updatedFilters);
  };
  
  // Kullanıcı silme fonksiyonu
  const handleDeleteUser = async (userId) => {
    try {
      // Silme işlemi için onay iste
      Alert.alert(
        'Kullanıcıyı Sil',
        'Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sil',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                
                // AsyncStorage'dan token al
                const userDataString = await AsyncStorage.getItem('user');
                if (!userDataString) {
                  Alert.alert('Oturum Hatası', 'Lütfen tekrar giriş yapın');
                  setIsLoading(false);
                  return;
                }
                
                const userData = JSON.parse(userDataString);
                const token = userData.token;
                
                // Platform'a göre API URL'ini ayarla
                let API_URL = Platform.OS === 'android' 
                  ? 'http://10.0.2.2:5001/api'
                  : 'http://localhost:5001/api';
                
                // API isteği yap
                console.log(`Kullanıcı silme isteği gönderiliyor: ${userId}`);
                const response = await axios.delete(
                  `${API_URL}/admin/users/${userId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                
                console.log('Kullanıcı silme yanıtı:', response.data);
                
                // Başarılı silme işlemi sonrası kullanıcı listesini güncelle
                const updatedUsers = users.filter(user => user._id !== userId);
                setUsers(updatedUsers);
                setFilteredUsers(updatedUsers);
                
                // İstatistikleri güncelle
                setStats(prev => ({
                  ...prev,
                  totalUsers: prev.totalUsers - 1
                }));
                
                Alert.alert('Başarılı', 'Kullanıcı başarıyla silindi');
              } catch (error) {
                console.error('Kullanıcı silme hatası:', error);
                let errorMsg = 'Kullanıcı silinirken bir hata oluştu';
                
                if (error.response) {
                  if (error.response.status === 403) {
                    errorMsg = 'Bu işlemi yapmak için yetkiniz yok';
                  } else if (error.response.status === 400) {
                    errorMsg = error.response.data?.message || 'Geçersiz istek';
                  } else {
                    errorMsg = error.response.data?.message || 'Bir hata oluştu';
                  }
                }
                
                Alert.alert('Hata', errorMsg);
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Silme işlemi hatası:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Kullanıcı detay modalını gösterme
  const showUserDetails = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  // Kullanıcı silme işlemi artık yukarıda tanımlanmıştır
  
  // Kullanıcı bakiyesini güncelleme
  const handleUpdateBalance = async (userId, newBalance) => {
    try {
      const user = users.find(u => u._id === userId);
      if (!user) return;
      
      const updatedUser = { ...user, balance: parseFloat(newBalance) };
      
      await axios.put(`http://10.0.2.2:5000/api/admin/users/${userId}`, {
        name: updatedUser.name,
        email: updatedUser.email,
        balance: updatedUser.balance
      });
      
      fetchData();
      Alert.alert('Başarılı', 'Kullanıcı bakiyesi güncellendi');
    } catch (error) {
      console.error('Bakiye güncelleme hatası:', error);
      Alert.alert('Hata', 'Bakiye güncellenirken bir hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: isDarkMode ? colors.background : '#f8f9fa'}]}>
        <ActivityIndicator size="large" color={isDarkMode ? colors.primary : "#1a4a9e"} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: isDarkMode ? colors.background : '#f8f9fa'}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? colors.card : "#1a4a9e"} />
      
      {/* Gradient Başlık */}
      <LinearGradient
        colors={isDarkMode ? [colors.primary, `${colors.primary}dd`] : ['#1a4a9e', '#2a6dd9']}
        style={styles.headerContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Finans Yönetimi</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      {/* Ana İçerik */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Arama ve Filtreleme Barı */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, {backgroundColor: isDarkMode ? colors.card : '#fff', borderColor: isDarkMode ? colors.border : '#eee'}]}>
            <Ionicons name="search" size={20} color={isDarkMode ? colors.text : '#777'} />
            <TextInput
              style={[styles.searchInput, {color: isDarkMode ? colors.text : '#333'}]}
              placeholder="Kullanıcı Ara..."
              placeholderTextColor={isDarkMode ? `${colors.text}80` : '#777'}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={isDarkMode ? colors.text : '#777'} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color={isDarkMode ? colors.primary : "#1a4a9e"} />
          </TouchableOpacity>
        </View>
        
        {/* İstatistik Kartları */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={[styles.statCard, styles.statCardLarge, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
              <View style={[styles.statIcon, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#f0f7ff'}]}>
                <Ionicons name="people" size={24} color={isDarkMode ? colors.primary : '#1a4a9e'} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, {color: isDarkMode ? colors.text : '#777'}]}>Toplam Kullanıcı</Text>
                <Text style={[styles.statNumber, {color: isDarkMode ? colors.text : '#333'}]}>{stats.totalUsers}</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.statCardLarge, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
              <View style={[styles.statIcon, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#f0f7ff'}]}>
                <Ionicons name="cash-outline" size={24} color={isDarkMode ? colors.primary : '#1a4a9e'} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, {color: isDarkMode ? colors.text : '#777'}]}>Toplam Bakiye</Text>
                <Text style={[styles.statNumber, {color: isDarkMode ? colors.text : '#333'}]}>{stats.totalBalance.toLocaleString('tr-TR')} ₺</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statRow}>
            <View style={[styles.statCard, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
              <View style={[styles.statIcon, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#f0f7ff'}]}>
                <MaterialCommunityIcons name="account-clock" size={24} color={isDarkMode ? colors.primary : '#1a4a9e'} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, {color: isDarkMode ? colors.text : '#777'}]}>Aktif Kullanıcılar</Text>
                <Text style={[styles.statNumber, {color: isDarkMode ? colors.text : '#333'}]}>{stats.activeUsers}</Text>
              </View>
            </View>
            <View style={[styles.statCard, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
              <View style={[styles.statIcon, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#f0f7ff'}]}>
                <Ionicons name="person-add" size={24} color={isDarkMode ? colors.primary : '#1a4a9e'} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, {color: isDarkMode ? colors.text : '#777'}]}>Yeni Kullanıcılar</Text>
                <Text style={[styles.statNumber, {color: isDarkMode ? colors.text : '#333'}]}>{stats.newUsersThisWeek}</Text>
              </View>
            </View>
            <View style={[styles.statCard, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
              <View style={[styles.statIcon, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#f0f7ff'}]}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color={isDarkMode ? colors.primary : '#1a4a9e'} />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statLabel, {color: isDarkMode ? colors.text : '#777'}]}>İşlemler</Text>
                <Text style={[styles.statNumber, {color: isDarkMode ? colors.text : '#333'}]}>{stats.transactionsThisMonth}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Aktivite Grafiği */}
        <View style={[styles.chartContainer, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
          <Text style={[styles.chartTitle, {color: isDarkMode ? colors.text : '#333'}]}>Haftalık Kullanıcı Aktivitesi</Text>
          <LineChart
            data={chartData}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: isDarkMode ? colors.card : '#fff',
              backgroundGradientFrom: isDarkMode ? colors.card : '#fff',
              backgroundGradientTo: isDarkMode ? colors.card : '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => isDarkMode ? `rgba(${parseInt(colors.primary.slice(1, 3), 16)}, ${parseInt(colors.primary.slice(3, 5), 16)}, ${parseInt(colors.primary.slice(5, 7), 16)}, ${opacity})` : `rgba(26, 74, 158, ${opacity})`,
              labelColor: (opacity = 1) => isDarkMode ? `rgba(${parseInt(colors.text.slice(1, 3), 16)}, ${parseInt(colors.text.slice(3, 5), 16)}, ${parseInt(colors.text.slice(5, 7), 16)}, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: isDarkMode ? colors.primary : '#1a4a9e'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        </View>
        
        {/* Sekmeler */}
        <View style={[styles.tabContainer, {backgroundColor: isDarkMode ? colors.card : '#fff', borderColor: isDarkMode ? colors.border : '#eee'}]}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'users' && [styles.activeTab, {borderColor: isDarkMode ? colors.primary : '#1a4a9e'}]]}
            onPress={() => setSelectedTab('users')}
          >
            <Text style={[styles.tabText, {color: isDarkMode ? colors.text : '#777'}, selectedTab === 'users' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Kullanıcılar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'transactions' && [styles.activeTab, {borderColor: isDarkMode ? colors.primary : '#1a4a9e'}]]}
            onPress={() => setSelectedTab('transactions')}
          >
            <Text style={[styles.tabText, {color: isDarkMode ? colors.text : '#777'}, selectedTab === 'transactions' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>İşlemler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'reports' && [styles.activeTab, {borderColor: isDarkMode ? colors.primary : '#1a4a9e'}]]}
            onPress={() => setSelectedTab('reports')}
          >
            <Text style={[styles.tabText, {color: isDarkMode ? colors.text : '#777'}, selectedTab === 'reports' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Raporlar</Text>
          </TouchableOpacity>
        </View>
        
        {/* Kullanıcı Listesi */}
        {selectedTab === 'users' && (
          <View style={[styles.section, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? colors.text : '#333'}]}>Kullanıcı Listesi</Text>
            <Text style={[styles.sectionSubtitle, {color: isDarkMode ? `${colors.text}99` : '#666'}]}>{filteredUsers.length} kullanıcı bulundu</Text>
            
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={50} color={isDarkMode ? `${colors.text}50` : '#ccc'} />
                <Text style={[styles.emptyStateText, {color: isDarkMode ? `${colors.text}80` : '#999'}]}>Sonuç bulunamadı</Text>
              </View>
            ) : (
              filteredUsers.map((user) => (
                <TouchableOpacity 
                  key={user._id} 
                  style={[styles.userCard, {backgroundColor: isDarkMode ? `${colors.card}80` : '#fff', borderLeftColor: isDarkMode ? colors.primary : '#1a4a9e'}]}
                  onPress={() => showUserDetails(user)}
                >
                  <View style={styles.userInfo}>
                    <View style={[styles.userAvatar, {backgroundColor: isDarkMode ? `${colors.primary}30` : '#e6f0ff'}]}>
                      <Text style={[styles.userAvatarText, {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>{user.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, {color: isDarkMode ? colors.text : '#333'}]}>{user.name}</Text>
                      <Text style={[styles.userEmail, {color: isDarkMode ? `${colors.text}99` : '#666'}]}>{user.email}</Text>
                      <Text style={[styles.userBalance, {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Bakiye: {user.balance.toLocaleString('tr-TR')} ₺</Text>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton, {backgroundColor: isDarkMode ? colors.primary : '#1a4a9e'}]}
                      onPress={() => showUserDetails(user)}
                    >
                      <Ionicons name="create-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton, {backgroundColor: isDarkMode ? colors.notification : '#e53935'}]}
                      onPress={() => handleDeleteUser(user._id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
        
        {/* İşlemler Tabı */}
        {selectedTab === 'transactions' && (
          <View style={[styles.section, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? colors.text : '#333'}]}>İşlem Geçmişi</Text>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="swap-horizontal" size={50} color={isDarkMode ? `${colors.text}50` : '#ccc'} />
              <Text style={[styles.emptyStateText, {color: isDarkMode ? `${colors.text}80` : '#999'}]}>Bu bölüm yakında aktif olacak</Text>
            </View>
          </View>
        )}
        
        {/* Raporlar Tabı */}
        {selectedTab === 'reports' && (
          <View style={[styles.section, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <Text style={[styles.sectionTitle, {color: isDarkMode ? colors.text : '#333'}]}>Finansal Raporlar</Text>
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={50} color={isDarkMode ? `${colors.text}50` : '#ccc'} />
              <Text style={[styles.emptyStateText, {color: isDarkMode ? `${colors.text}80` : '#999'}]}>Bu bölüm yakında aktif olacak</Text>
            </View>
          </View>
        )}
        
        {/* Sayfa Sonu Boşluk */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Kullanıcı Detay Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, {backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'}]}>
          <View style={[styles.modalContainer, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <View style={[styles.modalHeader, {borderBottomColor: isDarkMode ? colors.border : '#eee'}]}>
              <Text style={[styles.modalTitle, {color: isDarkMode ? colors.text : '#333'}]}>{selectedUser?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? colors.text : '#333'} />
              </TouchableOpacity>
            </View>
            
            {selectedUser && (
              <View style={styles.modalContent}>
                <View style={styles.userDetailItem}>
                  <Text style={[styles.userDetailLabel, {color: isDarkMode ? `${colors.text}99` : '#666'}]}>E-posta:</Text>
                  <Text style={[styles.userDetailValue, {color: isDarkMode ? colors.text : '#333'}]}>{selectedUser.email}</Text>
                </View>
                
                <View style={styles.userDetailItem}>
                  <Text style={[styles.userDetailLabel, {color: isDarkMode ? `${colors.text}99` : '#666'}]}>Bakiye:</Text>
                  <Text style={[styles.userDetailValue, {color: isDarkMode ? colors.text : '#333'}]}>{selectedUser.balance.toLocaleString('tr-TR')} ₺</Text>
                </View>
                
                <View style={styles.userDetailItem}>
                  <Text style={[styles.userDetailLabel, {color: isDarkMode ? `${colors.text}99` : '#666'}]}>Son Giriş:</Text>
                  <Text style={[styles.userDetailValue, {color: isDarkMode ? colors.text : '#333'}]}>
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('tr-TR') : 'Bilgi yok'}
                  </Text>
                </View>
                
                <View style={styles.userDetailItem}>
                  <Text style={[styles.userDetailLabel, {color: isDarkMode ? `${colors.text}99` : '#666'}]}>Kayıt Tarihi:</Text>
                  <Text style={[styles.userDetailValue, {color: isDarkMode ? colors.text : '#333'}]}>
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('tr-TR') : 'Bilgi yok'}
                  </Text>
                </View>
                
                <View style={styles.userDetailActions}>
                  <TouchableOpacity 
                    style={[styles.userDetailButton, {backgroundColor: isDarkMode ? colors.notification : '#e53935'}]}
                    onPress={() => {
                      setModalVisible(false);
                      handleDeleteUser(selectedUser._id);
                    }}
                  >
                    <Text style={styles.userDetailButtonText}>Kullanıcıyı Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Filtre Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[styles.modalOverlay, {backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'}]}>
          <View style={[styles.modalContainer, styles.filterModalContainer, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <View style={[styles.modalHeader, {borderBottomColor: isDarkMode ? colors.border : '#eee'}]}>
              <Text style={[styles.modalTitle, {color: isDarkMode ? colors.text : '#333'}]}>Filtreleme Seçenekleri</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? colors.text : '#333'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={[styles.filterLabel, {color: isDarkMode ? colors.text : '#333'}]}>Sıralama:</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity 
                  style={[styles.filterOption, {borderColor: isDarkMode ? colors.border : '#eee'}, filterOptions.sortBy === 'name' && [styles.filterOptionActive, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#e6f0ff'}]]}
                  onPress={() => handleFilterChange({sortBy: 'name'})}
                >
                  <Text style={[styles.filterOptionText, {color: isDarkMode ? colors.text : '#666'}, filterOptions.sortBy === 'name' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>İsim</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterOption, {borderColor: isDarkMode ? colors.border : '#eee'}, filterOptions.sortBy === 'balance' && [styles.filterOptionActive, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#e6f0ff'}]]}
                  onPress={() => handleFilterChange({sortBy: 'balance'})}
                >
                  <Text style={[styles.filterOptionText, {color: isDarkMode ? colors.text : '#666'}, filterOptions.sortBy === 'balance' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Bakiye</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterOption, {borderColor: isDarkMode ? colors.border : '#eee'}, filterOptions.sortBy === 'lastLogin' && [styles.filterOptionActive, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#e6f0ff'}]]}
                  onPress={() => handleFilterChange({sortBy: 'lastLogin'})}
                >
                  <Text style={[styles.filterOptionText, {color: isDarkMode ? colors.text : '#666'}, filterOptions.sortBy === 'lastLogin' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Son Giriş</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.filterLabel, {color: isDarkMode ? colors.text : '#333'}]}>Sıralama Yönü:</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity 
                  style={[styles.filterOption, {borderColor: isDarkMode ? colors.border : '#eee'}, filterOptions.order === 'asc' && [styles.filterOptionActive, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#e6f0ff'}]]}
                  onPress={() => handleFilterChange({order: 'asc'})}
                >
                  <Text style={[styles.filterOptionText, {color: isDarkMode ? colors.text : '#666'}, filterOptions.order === 'asc' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Artan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterOption, {borderColor: isDarkMode ? colors.border : '#eee'}, filterOptions.order === 'desc' && [styles.filterOptionActive, {backgroundColor: isDarkMode ? `${colors.primary}20` : '#e6f0ff'}]]}
                  onPress={() => handleFilterChange({order: 'desc'})}
                >
                  <Text style={[styles.filterOptionText, {color: isDarkMode ? colors.text : '#666'}, filterOptions.order === 'desc' && {color: isDarkMode ? colors.primary : '#1a4a9e'}]}>Azalan</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterActions}>
                <TouchableOpacity 
                  style={[styles.filterActionButton, {backgroundColor: isDarkMode ? `${colors.card}80` : '#f5f5f5', borderColor: isDarkMode ? colors.border : '#eee'}]}
                  onPress={() => {
                    handleFilterChange({
                      sortBy: 'name',
                      order: 'asc'
                    });
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={[styles.filterActionButtonText, {color: isDarkMode ? colors.text : '#666'}]}>Sıfırla</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterActionButton, styles.filterApplyButton, {backgroundColor: isDarkMode ? colors.primary : '#1a4a9e'}]}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={[styles.filterActionButtonText, styles.filterApplyButtonText, {color: '#fff'}]}>Uygula</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  headerContainer: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardLarge: {
    flex: 1,
    marginHorizontal: 5,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    borderRadius: 8,
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userBalance: {
    fontSize: 14,
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#1a4a9e',
  },
  deleteButton: {
    backgroundColor: '#e53935',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterModalContainer: {
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  userDetailItem: {
    marginBottom: 15,
  },
  userDetailLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  userDetailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  userDetailActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userDetailButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#e53935',
  },
  userDetailButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    marginTop: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  filterOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  filterOptionActive: {
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  filterActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    borderWidth: 1,
  },
  filterApplyButton: {
    backgroundColor: '#1a4a9e',
  },
  filterActionButtonText: {
    fontWeight: '500',
  },
  filterApplyButtonText: {
    color: '#fff',
  },
  bottomPadding: {
    height: 30,
  },
});

export default AdminScreen;
