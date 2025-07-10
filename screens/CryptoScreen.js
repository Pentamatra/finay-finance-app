import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const CryptoScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Örnek kripto para verileri
  const cryptoData = [
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67245.82,
      change: 1.23,
      changePercent: 1.23,
      volume: '$42.1B',
      marketCap: '$1.32T',
      imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      isFavorite: true
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3456.91,
      change: -45.23,
      changePercent: -1.29,
      volume: '$21.8B',
      marketCap: '$415.6B',
      imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      isFavorite: true
    },
    {
      id: '3',
      symbol: 'BNB',
      name: 'Binance Coin',
      price: 605.42,
      change: 15.63,
      changePercent: 2.65,
      volume: '$2.1B',
      marketCap: '$90.8B',
      imageUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
      isFavorite: false
    },
    {
      id: '4',
      symbol: 'SOL',
      name: 'Solana',
      price: 144.30,
      change: -2.58,
      changePercent: -1.76,
      volume: '$3.8B',
      marketCap: '$62.5B',
      imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
      isFavorite: true
    },
    {
      id: '5',
      symbol: 'ADA',
      name: 'Cardano',
      price: 0.46,
      change: 0.0045,
      changePercent: 0.98,
      volume: '$932.7M',
      marketCap: '$16.3B',
      imageUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
      isFavorite: false
    },
    {
      id: '6',
      symbol: 'XRP',
      name: 'Ripple',
      price: 0.54,
      change: 0.01,
      changePercent: 1.89,
      volume: '$1.5B',
      marketCap: '$29.5B',
      imageUrl: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
      isFavorite: false
    },
    {
      id: '7',
      symbol: 'DOGE',
      name: 'Dogecoin',
      price: 0.14,
      change: -0.002,
      changePercent: -1.41,
      volume: '$1.2B',
      marketCap: '$19.8B',
      imageUrl: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
      isFavorite: false
    },
  ];
  
  const getFilteredData = () => {
    let filteredData = cryptoData;
    
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
  
  const renderCryptoItem = ({ item }) => (
    <TouchableOpacity style={styles.cryptoItem}>
      <View style={styles.cryptoInfo}>
        <View style={styles.cryptoIconContainer}>
          {/* Gerçek API'dan alınan resimler burada gösterilecek */}
          <View style={styles.cryptoIcon}>
            <Text style={styles.cryptoIconText}>{item.symbol.charAt(0)}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.cryptoSymbol}>{item.symbol}</Text>
          <Text style={styles.cryptoName}>{item.name}</Text>
        </View>
      </View>
      
      <View style={styles.cryptoPriceInfo}>
        <Text style={styles.cryptoPrice}>{item.price.toLocaleString('tr-TR')} ₺</Text>
        <View style={styles.cryptoChange}>
          <Feather 
            name={item.change >= 0 ? 'arrow-up-right' : 'arrow-down-right'} 
            size={14} 
            color={item.change >= 0 ? '#2ED573' : '#FF4757'} 
          />
          <Text style={[
            styles.cryptoChangeText,
            { color: item.change >= 0 ? '#2ED573' : '#FF4757' }
          ]}>
            {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.favoriteButton}>
        <Feather 
          name={item.isFavorite ? 'star' : 'star'} 
          size={20} 
          color={item.isFavorite ? '#FDCB6E' : '#e0e0e0'} 
        />
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Kripto Paralar</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="refresh-cw" size={20} color="#4E7AF9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="sliders" size={20} color="#4E7AF9" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.marketInfo}>
        <View style={styles.marketInfoItem}>
          <Text style={styles.marketInfoLabel}>BTC Hakimiyet</Text>
          <Text style={styles.marketInfoValue}>51.4%</Text>
        </View>
        <View style={styles.marketInfoItem}>
          <Text style={styles.marketInfoLabel}>Toplam Piyasa</Text>
          <Text style={styles.marketInfoValue}>$2.56T</Text>
        </View>
        <View style={styles.marketInfoItem}>
          <Text style={styles.marketInfoLabel}>24s Hacim</Text>
          <Text style={styles.marketInfoValue}>$98.7B</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kripto para ara..."
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
        renderItem={renderCryptoItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="search" size={50} color="#ddd" />
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        }
      />
      
      <View style={styles.bottomActionsContainer}>
        <TouchableOpacity style={styles.bottomActionButton}>
          <LinearGradient
            colors={['#4E7AF9', '#8C69FF']}
            style={styles.bottomActionGradient}
          >
            <Feather name="plus" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.bottomActionText}>İzleme Listesine Ekle</Text>
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
  marketInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  marketInfoItem: {
    alignItems: 'center',
  },
  marketInfoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  marketInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  cryptoItem: {
    flexDirection: 'row',
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
  cryptoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cryptoIconContainer: {
    marginRight: 12,
  },
  cryptoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cryptoIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cryptoName: {
    fontSize: 14,
    color: '#666',
  },
  cryptoPriceInfo: {
    alignItems: 'flex-end',
    marginRight: 15,
  },
  cryptoPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cryptoChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoChangeText: {
    fontSize: 14,
    marginLeft: 4,
  },
  favoriteButton: {
    padding: 8,
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
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  bottomActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottomActionGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  bottomActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CryptoScreen;
