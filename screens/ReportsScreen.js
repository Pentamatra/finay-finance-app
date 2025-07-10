import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const { user } = useContext(AuthContext);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 0,
    profitLoss: 0,
    percentChange: 0
  });
  const [error, setError] = useState(null);
  
  // API'den rapor verilerini çekme fonksiyonu
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kullanıcı oturum açtı mı kontrol et
      if (!user || !user.token) {
        throw new Error('Oturum açılmamış. Lütfen giriş yapın.');
      }
      
      // API host - Emülatör için 10.0.2.2, gerçek cihaz için localhost
      const apiHost = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      
      // Paralel olarak rapor ve portföy özeti verilerini çek
      const [reportsResponse, portfolioResponse] = await Promise.all([
        // Raporları çek
        fetch(`${apiHost}/api/reports?period=${selectedPeriod}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }),
        
        // Portföy özetini çek
        fetch(`${apiHost}/api/portfolio/summary?period=${selectedPeriod}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      // Rapor yanıtını kontrol et
      if (!reportsResponse.ok) {
        const errorData = await reportsResponse.json();
        throw new Error(errorData.message || 'Rapor verileri alınamadı');
      }
      
      // Portföy yanıtını kontrol et
      if (!portfolioResponse.ok) {
        const errorData = await portfolioResponse.json();
        throw new Error(errorData.message || 'Portföy verileri alınamadı');
      }
      
      // Yanıtları işle
      const reportsData = await reportsResponse.json();
      const portfolioData = await portfolioResponse.json();
      
      console.log('Rapor yanıtı:', reportsData);
      console.log('Portföy yanıtı:', portfolioData);
      
      // API'den veri alınamazsa dummy verileri kullan
      if (reportsData && reportsData.data) {
        setReports(reportsData.data);
      } else {
        setReports(dummyReports);
      }
      
      // Portföy özeti verilerini ayarla
      if (portfolioData && portfolioData.data) {
        setPortfolioSummary({
          totalValue: portfolioData.data.totalValue || 0,
          profitLoss: portfolioData.data.profitLoss || 0,
          percentChange: portfolioData.data.percentChange || 0
        });
      }
      
    } catch (err) {
      console.error('Veri çekme hatası:', err.message || err);
      setError('Veriler yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
      // Hata durumunda dummy verileri kullan
      setReports(dummyReports);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedPeriod]);
  
  // Yenileme işlemi
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportData();
  }, [fetchReportData]);
  
  // İlk yükleme ve periyot değiştiğinde verileri çek
  useEffect(() => {
    if (user && user.token) {
      fetchReportData();
    } else {
      setLoading(false);
      setError('Oturum açılmamış. Lütfen giriş yapın.');
    }
  }, [user, fetchReportData, selectedPeriod]);
  
  // Format para birimini
  const formatCurrency = (amount) => {
    return `${Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  };
  
  const dummyReports = [
    {
      id: '1',
      title: 'Portföy Performans Analizi',
      description: 'Portföyünüzün genel performans analizi',
      icon: 'bar-chart-2',
      color: '#4E7AF9'
    },
    {
      id: '2',
      title: 'Sektör Dağılımı',
      description: 'Varlıklarınızın sektörlere göre dağılımı',
      icon: 'pie-chart',
      color: '#2ED573'
    },
    {
      id: '3',
      title: 'Risk Analizi',
      description: 'Portföy risk durumu ve öneriler',
      icon: 'activity',
      color: '#FF4757'
    },
    {
      id: '4',
      title: 'Gelir Raporu',
      description: 'Temettü ve diğer gelir kaynakları',
      icon: 'dollar-sign',
      color: '#FDCB6E'
    },
    {
      id: '5',
      title: 'Trend Analizi',
      description: 'Varlıklarınızın uzun dönem performansı',
      icon: 'trending-up',
      color: '#8C69FF'
    },
  ];

  const renderPeriodSelectors = () => {
    const periods = [
      { id: 'week', label: 'Haftalık' },
      { id: 'month', label: 'Aylık' },
      { id: 'quarter', label: 'Çeyrek' },
      { id: 'year', label: 'Yıllık' }
    ];
    
    return (
      <View style={styles.periodSelectorContainer}>
        {periods.map(period => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodSelector,
              selectedPeriod === period.id && styles.periodSelectorActive
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Text
              style={[
                styles.periodSelectorText,
                selectedPeriod === period.id && styles.periodSelectorTextActive
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Raporlar</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="filter" size={20} color="#4E7AF9" />
        </TouchableOpacity>
      </View>
      
      {renderPeriodSelectors()}
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E7AF9" />
          <Text style={styles.loadingText}>Raporlar yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={50} color="#FF4757" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReportData}>
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4E7AF9']}
              tintColor="#4E7AF9"
            />
          }
        >
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['rgba(78, 122, 249, 0.1)', 'rgba(140, 105, 255, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.summaryCardGradient}
          >
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Portföy Özeti</Text>
              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>Detaylar</Text>
                <Feather name="chevron-right" size={16} color="#4E7AF9" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Toplam Değer</Text>
                <Text style={styles.statValue}>{formatCurrency(portfolioSummary.totalValue)}</Text>
                <View style={styles.statChange}>
                  <Feather 
                    name={portfolioSummary.percentChange >= 0 ? "arrow-up" : "arrow-down"} 
                    size={12} 
                    color={portfolioSummary.percentChange >= 0 ? "#2ED573" : "#FF4757"} 
                  />
                  <Text 
                    style={[styles.statChangeText, { 
                      color: portfolioSummary.percentChange >= 0 ? "#2ED573" : "#FF4757" 
                    }]}
                  >
                    {Math.abs(portfolioSummary.percentChange).toFixed(1)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Kar/Zarar</Text>
                <Text style={styles.statValue}>
                  {portfolioSummary.profitLoss >= 0 ? '+' : ''}
                  {formatCurrency(portfolioSummary.profitLoss)}
                </Text>
                <View style={styles.statChange}>
                  <Feather 
                    name={portfolioSummary.profitLoss >= 0 ? "arrow-up" : "arrow-down"} 
                    size={12} 
                    color={portfolioSummary.profitLoss >= 0 ? "#2ED573" : "#FF4757"} 
                  />
                  <Text 
                    style={[styles.statChangeText, { 
                      color: portfolioSummary.profitLoss >= 0 ? "#2ED573" : "#FF4757" 
                    }]}
                  >
                    {Math.abs(portfolioSummary.percentChange).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mevcut Raporlar</Text>
        </View>
        
        {reports.length > 0 ? (
          reports.map(report => (
            <TouchableOpacity key={report.id} style={styles.reportCard}>
              <View style={[styles.reportIconContainer, { backgroundColor: `${report.color}20` }]}>
                <Feather name={report.icon} size={24} color={report.color} />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.reportDescription}>{report.description}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noReportsContainer}>
            <Feather name="file-text" size={50} color="#ccc" />
            <Text style={styles.noReportsText}>Rapor bulunamadı</Text>
          </View>
        )}
        
        <View style={styles.createReportContainer}>
          <TouchableOpacity style={styles.createReportButton}>
            <LinearGradient
              colors={['#4E7AF9', '#8C69FF']}
              style={styles.createReportGradient}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.createReportText}>Özel Rapor Oluştur</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4E7AF9',
    fontWeight: '500'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#4E7AF9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  noReportsContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10
  },
  noReportsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
    textAlign: 'center'
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 122, 249, 0.1)',
  },
  periodSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  periodSelector: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  periodSelectorActive: {
    backgroundColor: '#4E7AF9',
  },
  periodSelectorText: {
    fontSize: 14,
    color: '#666',
  },
  periodSelectorTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryCardGradient: {
    padding: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#4E7AF9',
    fontSize: 14,
    marginRight: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChangeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  reportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#888',
  },
  createReportContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  createReportButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createReportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  createReportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 80,
  }
});

export default ReportsScreen;
