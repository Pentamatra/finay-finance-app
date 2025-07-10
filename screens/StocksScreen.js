import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const StocksScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Örnek borsa verileri
  const stocksData = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 187.62,
      change: 1.42,
      changePercent: 0.76,
      volume: '54.2M',
      marketCap: '2.89T',
      isFavorite: true
    },
    {
      id: '2',
      symbol: 'MSFT',
      name: 'Microsoft',
      price: 412.36,
      change: -0.23,
      changePercent: -0.06,
      volume: '23.1M',
      marketCap: '3.06T',
      isFavorite: true
    },
    {
      id: '3',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 164.76,
      change: 2.31,
      changePercent: 1.42,
      volume: '20.8M',
      marketCap: '2.05T',
      isFavorite: false
    },
    {
      id: '4',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 174.50,
      change: -2.15,
      changePercent: -1.22,
      volume: '102.4M',
      marketCap: '555.2B',
      isFavorite: true
    },
    {
      id: '5',
      symbol: 'AMZN',
      name: 'Amazon.com Inc.',
      price: 178.22,
      change: 0.89,
      changePercent: 0.5,
      volume: '35.6M',
      marketCap: '1.85T',
      isFavorite: false
    },
    {
      id: '6',
      symbol: 'META',
      name: 'Meta Platforms',
      price: 476.10,
      change: 4.25,
      changePercent: 0.9,
      volume: '15.3M',
      marketCap: '1.21T',
      isFavorite: false
    },
    {
      id: '7',
      symbol: 'NFLX',
      name: 'Netflix Inc.',
      price: 631.82,
      change: 10.23,
      changePercent: 1.65,
      volume: '4.5M',
      marketCap: '271.9B',
      isFavorite: false
    },
  ];
  
  const getFilteredData = () => {
    let filteredData = stocksData;
    
    // Filtre favorilere göre
    if (activeTab === 'favorites') {
      filteredData = filteredData.filter(item => item.isFavorite);
    } else if (activeTab === 'gainers') {
      filteredData = filteredData.filter(item => item.changePercent > 0);
    } else if (activeTab === 'losers') {
      filteredData = filteredData.filter(item => item.changePercent < 0);
    }
    
    // Arama sorgusu filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(
        item => item.symbol.toLowerCase().includes(query) || 
               item.name.toLowerCase().includes(query)
      );
    }
    
    return filteredData;
  };
  
  const renderStockItem = ({ item }) => (
    <TouchableOpacity style={styles.stockItem}>
      <View style={styles.stockInfo}>
        <Text style={styles.stockSymbol}>{item.symbol}</Text>
        <Text style={styles.stockName}>{item.name}</Text>
      </View>
      
      <View style={styles.stockPriceInfo}>
        <Text style={styles.stockPrice}>{item.price.toLocaleString('tr-TR')} ₺</Text>
        <View style={styles.stockChange}>
          <Feather 
            name={item.change >= 0 ? 'arrow-up-right' : 'arrow-down-right'} 
            size={14} 
            color={item.change >= 0 ? '#2ED573' : '#FF4757'} 
          />
          <Text style={[
            styles.stockChangeText,
            { color: item.change >= 0 ? '#2ED573' : '#FF4757' }
          ]}>
            {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderTabButton = (title, tabId) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabId && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tabId)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === tabId && styles.activeTabButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hisse Senetleri</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="trending-up" size={20} color="#4E7AF9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="filter" size={20} color="#4E7AF9" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hisse senedi ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.tabsContainer}>
        {renderTabButton('Tümü', 'all')}
        {renderTabButton('Favoriler', 'favorites')}
        {renderTabButton('Yükselenler', 'gainers')}
        {renderTabButton('Düşenler', 'losers')}
      </View>
      
      <FlatList
        data={getFilteredData()}
        renderItem={renderStockItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="search" size={50} color="#ddd" />
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        }
      />
      
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton}>
          <LinearGradient
            colors={['#4E7AF9', '#8C69FF']}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>İzleme Listesine Ekle</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 122, 249, 0.1)',
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Alt buton için alan
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 14,
    color: '#666',
  },
  stockPriceInfo: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stockChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockChangeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StocksScreen;
