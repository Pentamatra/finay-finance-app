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
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FundsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Örnek yatırım fonu verileri
  const fundsData = [
    {
      id: '1',
      code: 'TEFZL',
      name: 'Ziraat Portföy Altın Fonu',
      price: 3.214,
      change: 0.18,
      changePercent: 1.23,
      category: 'Altın',
      risk: 'Orta',
      return: { year1: 8.4, year3: 28.6 },
      isFavorite: true
    },
    {
      id: '2',
      code: 'ISBTR',
      name: 'İş Portföy BIST 30 Endeksi',
      price: 0.218,
      change: -0.003,
      changePercent: -1.39,
      category: 'Hisse',
      risk: 'Yüksek',
      return: { year1: 14.2, year3: 35.7 },
      isFavorite: true
    },
    {
      id: '3',
      code: 'AKUSD',
      name: 'Ak Portföy Amerikan Doları',
      price: 1.876,
      change: 0.026,
      changePercent: 1.48,
      category: 'Döviz',
      risk: 'Orta',
      return: { year1: 6.8, year3: 19.4 },
      isFavorite: false
    },
    {
      id: '4',
      code: 'GAKVE',
      name: 'Garanti Portföy Kısa Vadeli',
      price: 0.587,
      change: 0.001,
      changePercent: 0.17,
      category: 'Para Piyasası',
      risk: 'Düşük',
      return: { year1: 3.6, year3: 11.2 },
      isFavorite: false
    },
    {
      id: '5',
      code: 'YAPBO',
      name: 'Yapı Kredi Portföy Yabancı Borçlanma',
      price: 2.123,
      change: -0.042,
      changePercent: -1.94,
      category: 'Borçlanma',
      risk: 'Orta',
      return: { year1: 5.9, year3: 16.8 },
      isFavorite: true
    },
    {
      id: '6',
      code: 'QNBTU',
      name: 'QNB Finans Portföy Altın Fonu',
      price: 2.745,
      change: 0.034,
      changePercent: 1.26,
      category: 'Altın',
      risk: 'Orta',
      return: { year1: 7.9, year3: 25.1 },
      isFavorite: false
    },
    {
      id: '7',
      code: 'VAKBR',
      name: 'Vakıf Portföy Birinci Karma',
      price: 0.453,
      change: -0.002,
      changePercent: -0.44,
      category: 'Karma',
      risk: 'Orta-Yüksek',
      return: { year1: 9.2, year3: 23.8 },
      isFavorite: false
    },
  ];
  
  const getFilteredData = () => {
    let filteredData = fundsData;
    
    // Filtre kategoriye göre
    if (activeTab === 'favorites') {
      filteredData = filteredData.filter(item => item.isFavorite);
    } else if (activeTab === 'gold') {
      filteredData = filteredData.filter(item => item.category === 'Altın');
    } else if (activeTab === 'equity') {
      filteredData = filteredData.filter(item => item.category === 'Hisse');
    } else if (activeTab === 'bond') {
      filteredData = filteredData.filter(item => item.category === 'Borçlanma');
    } else if (activeTab === 'forex') {
      filteredData = filteredData.filter(item => item.category === 'Döviz');
    }
    
    // Arama sorgusu filtreleme
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = filteredData.filter(
        item => item.code.toLowerCase().includes(query) || 
               item.name.toLowerCase().includes(query)
      );
    }
    
    return filteredData;
  };
  
  const renderFundItem = ({ item }) => (
    <TouchableOpacity style={styles.fundItem}>
      <View style={styles.fundHeader}>
        <View>
          <Text style={styles.fundCode}>{item.code}</Text>
          <Text style={styles.fundName}>{item.name}</Text>
        </View>
        
        <TouchableOpacity style={styles.favoriteButton}>
          <Feather 
            name={item.isFavorite ? 'star' : 'star'} 
            size={20} 
            color={item.isFavorite ? '#FDCB6E' : '#e0e0e0'} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.fundAttributes}>
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Kategori</Text>
          <Text style={styles.attributeValue}>{item.category}</Text>
        </View>
        
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>Risk</Text>
          <Text style={styles.attributeValue}>{item.risk}</Text>
        </View>
        
        <View style={styles.attributeItem}>
          <Text style={styles.attributeLabel}>1 Yıllık</Text>
          <Text style={[styles.attributeValue, {color: item.return.year1 > 0 ? '#2ED573' : '#FF4757'}]}>
            %{item.return.year1}
          </Text>
        </View>
      </View>
      
      <View style={styles.fundBottom}>
        <View>
          <Text style={styles.fundPriceLabel}>Fiyat</Text>
          <Text style={styles.fundPrice}>{item.price.toFixed(3)} ₺</Text>
        </View>
        
        <View style={styles.fundChange}>
          <Feather 
            name={item.change >= 0 ? 'arrow-up-right' : 'arrow-down-right'} 
            size={16} 
            color={item.change >= 0 ? '#2ED573' : '#FF4757'} 
            style={styles.changeIcon}
          />
          <Text style={[
            styles.fundChangeText,
            { color: item.change >= 0 ? '#2ED573' : '#FF4757' }
          ]}>
            %{Math.abs(item.changePercent).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderCategoryButton = (title, tabId) => (
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
        <Text style={styles.headerTitle}>Yatırım Fonları</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="filter" size={20} color="#4E7AF9" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Fon ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsScrollView}
        contentContainerStyle={styles.tabsContainer}
      >
        {renderCategoryButton('Tümü', 'all')}
        {renderCategoryButton('Favoriler', 'favorites')}
        {renderCategoryButton('Altın', 'gold')}
        {renderCategoryButton('Hisse', 'equity')}
        {renderCategoryButton('Borçlanma', 'bond')}
        {renderCategoryButton('Döviz', 'forex')}
      </ScrollView>
      
      <FlatList
        data={getFilteredData()}
        renderItem={renderFundItem}
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
        <TouchableOpacity style={styles.compareButton}>
          <LinearGradient
            colors={['#4E7AF9', '#8C69FF']}
            style={styles.compareButtonGradient}
          >
            <Feather name="bar-chart-2" size={18} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.compareButtonText}>Fonları Karşılaştır</Text>
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
  tabsScrollView: {
    maxHeight: 50,
    marginBottom: 15,
  },
  tabsContainer: {
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 10,
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
  fundItem: {
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
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  fundName: {
    fontSize: 14,
    color: '#666',
    maxWidth: width - 120,
  },
  favoriteButton: {
    padding: 4,
  },
  fundAttributes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attributeItem: {
    alignItems: 'center',
  },
  attributeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fundBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundPriceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  fundPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fundChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeIcon: {
    marginRight: 4,
  },
  fundChangeText: {
    fontSize: 14,
    fontWeight: '600',
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
  compareButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  compareButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FundsScreen;
