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

const ForexScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('major');
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  
  // Örnek döviz verileri
  const forexData = {
    major: [
      {
        id: '1',
        symbol: 'USD/TRY',
        name: 'Amerikan Doları',
        buy: 33.92,
        sell: 33.98,
        change: 0.05,
        changePercent: 0.15,
        isFavorite: true
      },
      {
        id: '2',
        symbol: 'EUR/TRY',
        name: 'Euro',
        buy: 36.71,
        sell: 36.78,
        change: -0.12,
        changePercent: -0.33,
        isFavorite: true
      },
      {
        id: '3',
        symbol: 'GBP/TRY',
        name: 'İngiliz Sterlini',
        buy: 42.95,
        sell: 43.05,
        change: 0.07,
        changePercent: 0.16,
        isFavorite: false
      },
      {
        id: '4',
        symbol: 'JPY/TRY',
        name: 'Japon Yeni',
        buy: 0.220,
        sell: 0.223,
        change: 0.001,
        changePercent: 0.45,
        isFavorite: false
      },
      {
        id: '5',
        symbol: 'CHF/TRY',
        name: 'İsviçre Frangı',
        buy: 38.11,
        sell: 38.20,
        change: -0.03,
        changePercent: -0.08,
        isFavorite: false
      }
    ],
    cross: [
      {
        id: '6',
        symbol: 'EUR/USD',
        name: 'Euro / Dolar',
        buy: 1.082,
        sell: 1.084,
        change: -0.004,
        changePercent: -0.37,
        isFavorite: true
      },
      {
        id: '7',
        symbol: 'GBP/USD',
        name: 'Sterlin / Dolar',
        buy: 1.268,
        sell: 1.269,
        change: 0.001,
        changePercent: 0.08,
        isFavorite: false
      },
      {
        id: '8',
        symbol: 'USD/JPY',
        name: 'Dolar / Yen',
        buy: 153.94,
        sell: 154.02,
        change: -0.29,
        changePercent: -0.19,
        isFavorite: false
      }
    ],
    crypto: [
      {
        id: '9',
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        buy: 67245.82,
        sell: 67289.73,
        change: 823.14,
        changePercent: 1.24,
        isFavorite: true
      },
      {
        id: '10',
        symbol: 'ETH/USD',
        name: 'Ethereum',
        buy: 3456.91,
        sell: 3462.15,
        change: -45.23,
        changePercent: -1.29,
        isFavorite: false
      }
    ],
    commodity: [
      {
        id: '11',
        symbol: 'XAU/USD',
        name: 'Altın Ons',
        buy: 2312.45,
        sell: 2313.87,
        change: 18.73,
        changePercent: 0.82,
        isFavorite: true
      },
      {
        id: '12',
        symbol: 'XAG/USD',
        name: 'Gümüş Ons',
        buy: 27.12,
        sell: 27.18,
        change: 0.23,
        changePercent: 0.85,
        isFavorite: false
      },
      {
        id: '13',
        symbol: 'BRENT',
        name: 'Brent Petrol',
        buy: 82.45,
        sell: 82.55,
        change: -0.92,
        changePercent: -1.10,
        isFavorite: false
      }
    ]
  };
  
  const getFilteredData = () => {
    let data = [];
    
    if (activeTab === 'favorites') {
      data = [
        ...forexData.major.filter(item => item.isFavorite),
        ...forexData.cross.filter(item => item.isFavorite),
        ...forexData.crypto.filter(item => item.isFavorite),
        ...forexData.commodity.filter(item => item.isFavorite)
      ];
    } else if (activeTab === 'major') {
      data = forexData.major;
    } else if (activeTab === 'cross') {
      data = forexData.cross;
    } else if (activeTab === 'crypto') {
      data = forexData.crypto;
    } else if (activeTab === 'commodity') {
      data = forexData.commodity;
    }
    
    // Arama sorgusu filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        item => item.symbol.toLowerCase().includes(query) || 
               item.name.toLowerCase().includes(query)
      );
    }
    
    return data;
  };
  
  const toggleFavorite = (id) => {
    // Gerçek uygulamada bu state'i değiştirip sunucuya kaydedecek şekilde yapılır
    // Bu demo için basit bir konsol mesajı bırakıyoruz
    console.log(`Toggle favorite for ${id}`);
  };
  
  const openCalculator = (currency) => {
    setSelectedCurrency(currency);
    setCalculatorVisible(true);
  };
  
  const renderForexItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.forexItem}
      onPress={() => openCalculator(item)}
    >
      <View style={styles.forexInfo}>
        <View style={styles.symbolContainer}>
          <Text style={styles.forexSymbol}>{item.symbol}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <Feather 
              name={item.isFavorite ? 'star' : 'star'} 
              size={18} 
              color={item.isFavorite ? '#FDCB6E' : '#e0e0e0'} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.forexName}>{item.name}</Text>
      </View>
      
      <View style={styles.ratesContainer}>
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Alış</Text>
          <Text style={styles.rateValue}>{item.buy.toFixed(3)}</Text>
        </View>
        
        <View style={styles.rateSeparator} />
        
        <View style={styles.rateItem}>
          <Text style={styles.rateLabel}>Satış</Text>
          <Text style={styles.rateValue}>{item.sell.toFixed(3)}</Text>
        </View>
      </View>
      
      <View style={styles.changeContainer}>
        <View style={[
          styles.changeIndicator,
          { backgroundColor: item.change >= 0 ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)' }
        ]}>
          <Feather 
            name={item.change >= 0 ? 'arrow-up-right' : 'arrow-down-right'} 
            size={14} 
            color={item.change >= 0 ? '#2ED573' : '#FF4757'} 
          />
          <Text style={[
            styles.changeText,
            { color: item.change >= 0 ? '#2ED573' : '#FF4757' }
          ]}>
            %{Math.abs(item.changePercent).toFixed(2)}
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
  
  const renderCalculator = () => {
    if (!selectedCurrency || !calculatorVisible) return null;
    
    const calculateResult = () => {
      const inputAmount = parseFloat(amount) || 0;
      return inputAmount * selectedCurrency.buy;
    };
    
    return (
      <View style={styles.calculatorOverlay}>
        <View style={styles.calculatorContainer}>
          <View style={styles.calculatorHeader}>
            <Text style={styles.calculatorTitle}>Döviz Hesaplama</Text>
            <TouchableOpacity onPress={() => setCalculatorVisible(false)}>
              <Feather name="x" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calculatorContent}>
            <View style={styles.selectedCurrency}>
              <Text style={styles.selectedCurrencySymbol}>{selectedCurrency.symbol}</Text>
              <Text style={styles.selectedCurrencyName}>{selectedCurrency.name}</Text>
              <Text style={styles.selectedCurrencyRate}>1 {selectedCurrency.symbol.split('/')[0]} = {selectedCurrency.buy.toFixed(3)} {selectedCurrency.symbol.split('/')[1]}</Text>
            </View>
            
            <View style={styles.calculatorInputContainer}>
              <TextInput
                style={styles.calculatorInput}
                placeholder="Miktar giriniz"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.calculatorInputCurrency}>{selectedCurrency.symbol.split('/')[0]}</Text>
            </View>
            
            <View style={styles.calculatorResult}>
              <Text style={styles.calculatorResultLabel}>Sonuç</Text>
              <Text style={styles.calculatorResultValue}>
                {(parseFloat(amount) || 0).toLocaleString('tr-TR')} {selectedCurrency.symbol.split('/')[0]} = {calculateResult().toLocaleString('tr-TR')} {selectedCurrency.symbol.split('/')[1]}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.calculatorCloseButton} onPress={() => setCalculatorVisible(false)}>
              <Text style={styles.calculatorCloseButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Döviz</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="refresh-cw" size={20} color="#4E7AF9" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="calendar" size={20} color="#4E7AF9" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.marketInfo}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.marketInfoItem}>
            <Text style={styles.marketInfoLabel}>USD/TRY</Text>
            <View style={styles.marketInfoValueContainer}>
              <Text style={styles.marketInfoValue}>33.95</Text>
              <Feather name="arrow-up-right" size={12} color="#2ED573" />
            </View>
          </View>
          
          <View style={styles.marketInfoItem}>
            <Text style={styles.marketInfoLabel}>EUR/TRY</Text>
            <View style={styles.marketInfoValueContainer}>
              <Text style={styles.marketInfoValue}>36.74</Text>
              <Feather name="arrow-down-right" size={12} color="#FF4757" />
            </View>
          </View>
          
          <View style={styles.marketInfoItem}>
            <Text style={styles.marketInfoLabel}>Altın/TRY</Text>
            <View style={styles.marketInfoValueContainer}>
              <Text style={styles.marketInfoValue}>2.318</Text>
              <Feather name="arrow-up-right" size={12} color="#2ED573" />
            </View>
          </View>
          
          <View style={styles.marketInfoItem}>
            <Text style={styles.marketInfoLabel}>EUR/USD</Text>
            <View style={styles.marketInfoValueContainer}>
              <Text style={styles.marketInfoValue}>1.083</Text>
              <Feather name="arrow-down-right" size={12} color="#FF4757" />
            </View>
          </View>
          
          <View style={styles.marketInfoItem}>
            <Text style={styles.marketInfoLabel}>BTC/USD</Text>
            <View style={styles.marketInfoValueContainer}>
              <Text style={styles.marketInfoValue}>67.270</Text>
              <Feather name="arrow-up-right" size={12} color="#2ED573" />
            </View>
          </View>
        </ScrollView>
      </View>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Döviz ara..."
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
        {renderTabButton('Favoriler', 'favorites')}
        {renderTabButton('Döviz', 'major')}
        {renderTabButton('Pariteler', 'cross')}
        {renderTabButton('Kripto', 'crypto')}
        {renderTabButton('Emtia', 'commodity')}
      </View>
      
      <FlatList
        data={getFilteredData()}
        renderItem={renderForexItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="search" size={50} color="#ddd" />
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        }
      />
      
      {renderCalculator()}
      
      <View style={styles.bottomActionsContainer}>
        <TouchableOpacity style={styles.converterButton}>
          <LinearGradient
            colors={['#4E7AF9', '#8C69FF']}
            style={styles.converterButtonGradient}
          >
            <Feather name="refresh-cw" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.converterButtonText}>Döviz Çevirici</Text>
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
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  marketInfoItem: {
    backgroundColor: 'rgba(78, 122, 249, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 100,
  },
  marketInfoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  marketInfoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
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
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
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
  forexItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  forexInfo: {
    marginBottom: 12,
  },
  symbolContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  forexSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  forexName: {
    fontSize: 14,
    color: '#666',
  },
  ratesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  rateItem: {
    flex: 1,
    alignItems: 'center',
  },
  rateSeparator: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  rateLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  changeContainer: {
    alignItems: 'flex-end',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
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
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  converterButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  converterButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  converterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  calculatorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  calculatorContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 360,
  },
  calculatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calculatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calculatorContent: {
    padding: 16,
  },
  selectedCurrency: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedCurrencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedCurrencyName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 6,
  },
  selectedCurrencyRate: {
    fontSize: 14,
    color: '#888',
  },
  calculatorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  calculatorInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  calculatorInputCurrency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4E7AF9',
  },
  calculatorResult: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  calculatorResultLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  calculatorResultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calculatorCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  calculatorCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default ForexScreen;
