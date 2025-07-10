import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const PortfolioScreen = () => {
  const [loading, setLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState([
    { 
      id: '1', 
      name: 'Apple Inc.', 
      symbol: 'AAPL', 
      amount: 5,
      price: 187.62,
      change: 1.42,
      totalValue: 938.10,
      color: '#4E7AF9'
    },
    { 
      id: '2', 
      name: 'Microsoft', 
      symbol: 'MSFT', 
      amount: 3,
      price: 412.36,
      change: -0.23,
      totalValue: 1237.08,
      color: '#2ED573'
    },
    { 
      id: '3', 
      name: 'Amazon', 
      symbol: 'AMZN', 
      amount: 2,
      price: 178.22,
      change: 0.89,
      totalValue: 356.44,
      color: '#FF4757'
    },
    { 
      id: '4', 
      name: 'Tesla', 
      symbol: 'TSLA', 
      amount: 10,
      price: 174.50,
      change: -2.15,
      totalValue: 1745.00,
      color: '#FDCB6E'
    },
  ]);
  
  const totalPortfolioValue = portfolioData.reduce((total, item) => total + item.totalValue, 0);
  
  // Basit bir portföy dağılımı hesaplama
  const calculateDistribution = () => {
    return portfolioData.map(item => ({
      ...item,
      percentage: (item.totalValue / totalPortfolioValue) * 100
    }));
  };
  
  const distribution = calculateDistribution();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E7AF9" />
        <Text style={styles.loadingText}>Portföy yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portföyüm</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color="#4E7AF9" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Toplam Portföy Değeri</Text>
          <Text style={styles.summaryValue}>{totalPortfolioValue.toLocaleString('tr-TR')} ₺</Text>
          <Text style={styles.summaryChange}>Son 24 saat: 
            <Text style={{color: totalPortfolioValue > 4000 ? '#2ED573' : '#FF4757'}}> %{((totalPortfolioValue - 4000) / 4000 * 100).toFixed(2)}</Text>
          </Text>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Portföy Dağılımı</Text>
        </View>
        
        <View style={styles.distributionChart}>
          <View style={styles.barContainer}>
            {distribution.map((item, index) => (
              <View 
                key={item.id} 
                style={[
                  styles.distributionBar, 
                  { 
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }
                ]} 
              />
            ))}
          </View>
          <View style={styles.legendContainer}>
            {distribution.map((item) => (
              <View key={item.id} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.symbol} ({item.percentage.toFixed(1)}%)</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Varlıklarım</Text>
        </View>
        
        {portfolioData.map((item) => (
          <TouchableOpacity key={item.id} style={styles.assetCard}>
            <View style={styles.assetInfo}>
              <View style={[styles.assetIcon, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.assetSymbol, { color: item.color }]}>{item.symbol.substring(0, 1)}</Text>
              </View>
              <View style={styles.assetDetails}>
                <Text style={styles.assetName}>{item.name}</Text>
                <Text style={styles.assetAmount}>{item.amount} adet</Text>
              </View>
            </View>
            <View style={styles.assetValue}>
              <Text style={styles.assetPrice}>{item.totalValue.toLocaleString('tr-TR')} ₺</Text>
              <Text 
                style={[
                  styles.assetChange, 
                  { color: item.change >= 0 ? '#2ED573' : '#FF4757' }
                ]}
              >
                {item.change >= 0 ? '+' : ''}{item.change}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#4E7AF9', '#8C69FF']}
              style={styles.actionButtonGradient}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Varlık Ekle</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#FF4757', '#FF7B86']}
              style={styles.actionButtonGradient}
            >
              <Feather name="refresh-cw" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>İşlem Geçmişi</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 122, 249, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryChange: {
    fontSize: 14,
    color: '#888',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  distributionChart: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  barContainer: {
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 15,
  },
  distributionBar: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetDetails: {
    justifyContent: 'center',
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  assetAmount: {
    fontSize: 14,
    color: '#888',
  },
  assetValue: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  assetChange: {
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 80,
  }
});

export default PortfolioScreen;
