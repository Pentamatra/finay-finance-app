import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

const StatsScreen = () => {
  const navigation = useNavigation();
  // Context'lerden bilgileri al
  const { user } = useContext(AuthContext);
  const { isDarkMode, colors } = useContext(ThemeContext);
  
  // State tanımlamaları
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('start');
  
  // Tarih aralığı için state'ler
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Ayın başlangıcı
    return date;
  });
  
  const [endDate, setEndDate] = useState(() => new Date());
  
  // İstatistik verilerini tutan state
  const [statData, setStatData] = useState({
    income: 0,
    expense: 0,
    savings: 0,
    categories: []
  });

  // İstatistik verilerini API'den çeken fonksiyon
  const fetchStatData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !user.token) {
        throw new Error('Oturum açılmamış. Lütfen giriş yapın.');
      }

      // Tarih aralığı parametreleri oluştur
      const startDateParam = startDate.toISOString().split('T')[0];
      const endDateParam = endDate.toISOString().split('T')[0];
      console.log('Tarih aralığı:', { startDateParam, endDateParam });

      // API base URL - platform'a göre değişir
      const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      
      try {
        // İstatistik verilerini çek
        const response = await fetch(
          `${baseUrl}/api/transactions/stats/summary?startDate=${startDateParam}&endDate=${endDateParam}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`API hatası: ${response.status}`);
        }
        
        // API yanıtını metin olarak al
        const responseText = await response.text();
        
        // HTML yanıtı kontrolü
        if (responseText.trim().startsWith('<')) {
          console.error('HTML yanıtı alındı');
          throw new Error('API HTML yanıtı döndü, JSON bekleniyor');
        }
        
        // HTML yanıtı kontrolü daha detaylı
        if (responseText.trim().startsWith('<')) {
          console.error('HTML yanıtı alındı:', responseText.substring(0, 100));
          throw new Error('API sunucusuna erişilemiyor. Sunucunun çalıştığından emin olun.');
        }
        
        // JSON'a dönüştür
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('API yanıtı:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.error('JSON parse hatası:', e.message, 'Yanıt:', responseText.substring(0, 100));
          throw new Error(`JSON Parse hatası: ${e.message}. API yanıtı geçerli bir JSON değil.`);
        }
        
        // Veriyi işle ve state'i güncelle
        setStatData({
          income: data.totalIncome || 0,
          expense: data.totalExpense || 0,
          savings: (data.totalIncome || 0) - (data.totalExpense || 0),
          categories: data.categories || []
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Veri çekme hatası:', error);
        setError(`Veri çekme hatası: ${error.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Genel hata:', error);
      setError(`Hata: ${error.message}`);
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  // Tarih değişikliği işleme fonksiyonu
  const handleDateChange = (event, selectedDate) => {
    if (!selectedDate) {
      setDatePickerVisible(false);
      return;
    }
    
    if (dateType === 'start') {
      // Başlangıç tarihi, bitiş tarihinden sonra olamaz
      if (selectedDate > endDate) {
        alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
        return;
      }
      setStartDate(selectedDate);
    } else {
      // Bitiş tarihi, başlangıç tarihinden önce olamaz
      if (selectedDate < startDate) {
        alert('Bitiş tarihi başlangıç tarihinden önce olamaz.');
        return;
      }
      setEndDate(selectedDate);
    }
    
    setDatePickerVisible(false);
    fetchStatData(); // Yeni tarih aralığı için verileri çek
  };

  // Tarih seçici gösterme fonksiyonu
  const showDatePicker = (type) => {
    setDateType(type);
    setDatePickerVisible(true);
  };

  // Hızlı tarih aralığı seçimi fonksiyonu
  const setQuickDateRange = (range) => {
    const today = new Date();
    let newStartDate = new Date();
    
    switch (range) {
      case 'today':
        // Bugün
        newStartDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        setStartDate(newStartDate);
        setEndDate(today);
        break;
      case 'week':
        // Bu hafta
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - today.getDay());
        setStartDate(newStartDate);
        setEndDate(today);
        break;
      case 'month':
        // Bu ay
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        setStartDate(newStartDate);
        setEndDate(today);
        break;
      case 'year':
        // Bu yıl
        newStartDate = new Date(today.getFullYear(), 0, 1);
        setStartDate(newStartDate);
        setEndDate(today);
        break;
      default:
        break;
    }
    
    // Tarih değişikliğinden sonra verileri çek
    setTimeout(() => fetchStatData(), 100);
  };

  // Yenileme işlemi
  const handleRefresh = useCallback(() => {
    console.log('Veriler yenileniyor...');
    setRefreshing(true);
    fetchStatData().then(() => {
      console.log('Veriler yenilendi');
      setRefreshing(false);
    }).catch(err => {
      console.error('Yenileme hatası:', err);
      setRefreshing(false);
    });
  }, [fetchStatData]);

  // Uygulama ilk açıldığında verileri çek
  useEffect(() => {
    if (user && user.token) {
      console.log('İlk veri çekme işlemi başlatılıyor...');
      fetchStatData();
    } else {
      setLoading(false);
      setError('Oturum açılmamış. Lütfen giriş yapın.');
    }
  }, [user, fetchStatData]);

  // Ekran odaklandığında verileri yenile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Stats ekranı odaklandı, veriler yenileniyor...');
      if (user && user.token) {
        fetchStatData();
      }
    });

    return unsubscribe;
  }, [navigation, fetchStatData, user]);

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Kategori ikonları
  const getCategoryIcon = (category) => {
    const icons = {
      'Yiyecek': 'coffee',
      'Konaklama': 'home',
      'Ulaşım': 'truck',
      'Eğlence': 'music',
      'Faturalar': 'file-text',
      'Alışveriş': 'shopping-bag',
      'Sağlık': 'heart',
      'Eğitim': 'book',
      'Yatırım': 'trending-up',
      'Maaş': 'dollar-sign',
      'Diğer': 'grid'
    };
    
    return icons[category] || 'circle';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Başlık */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Finansal İstatistikler</Text>
      </View>
      
      {/* Tarih Aralığı Seçimi */}
      <View style={[styles.dateRangeContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.dateRangeTitle, { color: colors.secondaryText }]}>Tarih Aralığı</Text>
        <View style={styles.datePickerRow}>
          <TouchableOpacity 
            style={[styles.datePickerButton, { backgroundColor: isDarkMode ? colors.border : '#F0F0F0' }]}
            onPress={() => showDatePicker('start')}
          >
            <Feather name="calendar" size={16} color={colors.primary} style={styles.dateIcon} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {moment(startDate).format('DD MMM YYYY')}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.dateRangeSeparator, { color: colors.secondaryText }]}>-</Text>
          
          <TouchableOpacity 
            style={[styles.datePickerButton, { backgroundColor: isDarkMode ? colors.border : '#F0F0F0' }]}
            onPress={() => showDatePicker('end')}
          >
            <Feather name="calendar" size={16} color={colors.primary} style={styles.dateIcon} />
            <Text style={[styles.dateText, { color: colors.text }]}>
              {moment(endDate).format('DD MMM YYYY')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Hızlı Tarih Seçenekleri */}
        <View style={styles.quickDateOptions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuickDateRange('today')}
            >
              <Text style={styles.quickDateButtonText}>Bugün</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuickDateRange('week')}
            >
              <Text style={styles.quickDateButtonText}>Bu Hafta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuickDateRange('month')}
            >
              <Text style={styles.quickDateButtonText}>Bu Ay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickDateButton, { backgroundColor: colors.primary }]}
              onPress={() => setQuickDateRange('year')}
            >
              <Text style={styles.quickDateButtonText}>Bu Yıl</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      
      {/* DatePicker */}
      {datePickerVisible && (
        <DateTimePicker
          value={dateType === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {/* Ana İçerik */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              İstatistikler yükleniyor...
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
            <Feather name="alert-circle" size={40} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={fetchStatData}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Özet Kartları */}
            <View style={styles.summaryCardsContainer}>
              <View style={styles.summaryCardRow}>
                {/* Gelir Kartı */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(78, 122, 249, 0.1)' }]}>
                    <Feather name="arrow-down" size={20} color="#4E7AF9" />
                  </View>
                  <Text style={[styles.summaryTitle, { color: colors.secondaryText }]}>Toplam Gelir</Text>
                  <Text style={[styles.summaryAmount, { color: colors.text }]}>
                    {formatCurrency(statData.income)}
                  </Text>
                </View>
                
                {/* Gider Kartı */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(255, 140, 66, 0.1)' }]}>
                    <Feather name="arrow-up" size={20} color="#FF8C42" />
                  </View>
                  <Text style={[styles.summaryTitle, { color: colors.secondaryText }]}>Toplam Gider</Text>
                  <Text style={[styles.summaryAmount, { color: colors.text }]}>
                    {formatCurrency(statData.expense)}
                  </Text>
                </View>
              </View>
              
              {/* Tasarruf Kartı */}
              <View style={[styles.savingCard, { backgroundColor: colors.card }]}>
                <View style={styles.savingSummary}>
                  <View>
                    <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(62, 207, 142, 0.1)' }]}>
                      <Feather name="dollar-sign" size={20} color="#3ECF8E" />
                    </View>
                    <Text style={[styles.summaryTitle, { color: colors.secondaryText }]}>Toplam Tasarruf</Text>
                    <Text style={[styles.summaryAmount, { color: colors.text }]}>
                      {formatCurrency(statData.savings)}
                    </Text>
                  </View>
                  
                  <View style={styles.savingsProgress}>
                    <Text style={[styles.savingsPercentage, { color: colors.text }]}>
                      {statData.income > 0 
                        ? `${Math.round((statData.savings / statData.income) * 100)}%` 
                        : '0%'}
                    </Text>
                    <View style={[styles.progressContainer, { backgroundColor: isDarkMode ? colors.border : '#F0F0F0' }]}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { 
                            backgroundColor: '#3ECF8E',
                            width: `${statData.income > 0 ? Math.min(100, (statData.savings / statData.income) * 100) : 0}%` 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.savingsGoal, { color: colors.secondaryText }]}>Gelire Oranı</Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Kategori Dağılımı */}
            <View style={[styles.categorySection, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Kategori Dağılımı</Text>
              
              <View style={styles.categoryList}>
                {statData.categories.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                    Bu dönemde herhangi bir harcama kaydı bulunamadı.
                  </Text>
                ) : (
                  statData.categories.map((category, index) => (
                    <View key={index} style={[styles.categoryItem, { borderBottomColor: isDarkMode ? colors.border : '#F0F0F0' }]}>
                      <View 
                        style={[
                          styles.categoryIcon, 
                          { backgroundColor: category.color || '#607D8B' }
                        ]}
                      >
                        <Feather name={getCategoryIcon(category.name)} size={18} color="#FFFFFF" />
                      </View>
                      
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                        <View style={styles.categoryStats}>
                          <Text style={[styles.categoryAmount, { color: colors.secondaryText }]}>
                            {formatCurrency(category.amount)}
                          </Text>
                          <Text 
                            style={[
                              styles.categoryPercentage, 
                              { 
                                backgroundColor: 'rgba(255, 140, 66, 0.1)',
                                color: '#FF8C42'
                              }
                            ]}
                          >
                            {statData.expense > 0 
                              ? `${Math.round((category.amount / statData.expense) * 100)}%` 
                              : '0%'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
            
            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dateRangeTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateIcon: {
    marginRight: 6,
  },
  dateText: {
    fontSize: 14,
  },
  dateRangeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  quickDateOptions: {
    marginTop: 8,
  },
  quickDateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  quickDateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  summaryCardsContainer: {
    padding: 16,
  },
  summaryCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  savingCard: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsProgress: {
    alignItems: 'flex-end',
  },
  savingsPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressContainer: {
    width: 100,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  savingsGoal: {
    fontSize: 12,
  },
  categorySection: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    marginRight: 8,
  },
  categoryPercentage: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default StatsScreen;
