import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

const screenWidth = Dimensions.get('window').width;

const categories = [
  { id: '1', name: 'Yiyecek', icon: 'pizza', color: '#1a9e4a', apiValue: 'Yiyecek' },
  { id: '2', name: 'Faturalar', icon: 'flash', color: '#e74c3c', apiValue: 'Faturalar' },
  { id: '3', name: 'Konaklama', icon: 'home', color: '#1a4a9e', apiValue: 'Konaklama' },
  { id: '4', name: 'Ulaşım', icon: 'car', color: '#f1c40f', apiValue: 'Ulaşım' },
  { id: '5', name: 'Eğlence', icon: 'game-controller', color: '#FF4757', apiValue: 'Eğlence' },
  { id: '6', name: 'Alışveriş', icon: 'cart', color: '#FF7043', apiValue: 'Alışveriş' },
  { id: '7', name: 'Sağlık', icon: 'medkit', color: '#2196F3', apiValue: 'Sağlık' },
  { id: '8', name: 'Eğitim', icon: 'school', color: '#9C27B0', apiValue: 'Eğitim' },
  { id: '9', name: 'Yatırım', icon: 'trending-up', color: '#00BCD4', apiValue: 'Yatırım' },
  { id: '10', name: 'Maaş', icon: 'cash', color: '#8BC34A', apiValue: 'Maaş' },
  { id: '11', name: 'Diğer', icon: 'ellipsis-horizontal', color: '#607D8B', apiValue: 'Diğer' },
];

const EditTransactionScreen = ({ route, navigation }) => {
  // Route parametrelerinden mevcut işlem verilerini al
  const { transaction } = route.params;

  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description || '');
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find(cat => cat.apiValue === transaction.category) || categories[0]
  );
  const [isIncome, setIsIncome] = useState(transaction.type === 'income');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleUpdateTransaction = useCallback(async () => {
    // Validasyon kontrolleri
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin');
      return;
    }

    setLoading(true);

    try {
      const apiHost = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      const transactionData = {
        type: isIncome ? 'income' : 'expense',
        amount: parseFloat(amount),
        category: selectedCategory.apiValue,
        description: description || `${isIncome ? 'Gelir' : 'Gider'}: ${selectedCategory.name}`,
        paymentMethod: transaction.paymentMethod || 'Diğer',
        date: transaction.date // Mevcut tarihi koru
      };

      const response = await fetch(
        `${apiHost}/api/transactions/${transaction._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(transactionData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'İşlem güncellenirken bir hata oluştu');
      }

      const updatedTransaction = await response.json();
      console.log('İşlem başarıyla güncellendi:', updatedTransaction);
      
      // Başarı mesajı göster
      Alert.alert(
        'Başarılı',
        'İşlem başarıyla güncellendi',
        [
          { 
            text: 'Tamam', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('İşlem güncellenirken hata oluştu:', error);
      let errorMessage = 'Bir hata oluştu';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        console.log('Sunucu hatası:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamadı';
        console.log('İstek hatası:', error.request);
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, navigation, amount, description, selectedCategory, isIncome, transaction]);

  return (
    <LinearGradient colors={['#1a4a9e', '#6fa8dc']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>İşlem Düzenle</Text>
        </View>

        {/* Amount */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Miktar</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currency}>₺</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#ccc"
            />
          </View>
        </View>

        {/* Type */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, !isIncome && styles.typeButtonActive]}
            onPress={() => setIsIncome(false)}
          >
            <Ionicons
              name="arrow-down-circle"
              size={32}
              color={!isIncome ? '#fff' : '#1a4a9e'}
            />
            <Text style={[styles.typeText, !isIncome && styles.typeTextActive]}>Gider</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, isIncome && styles.typeButtonActive]}
            onPress={() => setIsIncome(true)}
          >
            <Ionicons
              name="arrow-up-circle"
              size={32}
              color={isIncome ? '#fff' : '#1a4a9e'}
            />
            <Text style={[styles.typeText, isIncome && styles.typeTextActive]}>Gelir</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <Text style={styles.label}>Kategori</Text>
          <View style={styles.categoryList}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryButton, selectedCategory.id === category.id && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Ionicons name={category.icon} size={24} color={category.color} />
                <Text 
                  style={[
                    styles.categoryText, 
                    selectedCategory.id === category.id && styles.categoryTextActive
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="İşlem açıklaması..."
            placeholderTextColor="#888"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Güncelle</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 8,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  currency: {
    color: '#1a4a9e',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: '#1a4a9e',
  },
  typeContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#1a4a9e',
  },
  typeText: {
    color: '#1a4a9e',
    fontSize: 16,
    marginTop: 8,
  },
  typeTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#1a4a9e',
  },
  categoryText: {
    color: '#1a4a9e',
    marginLeft: 8,
  },
  categoryTextActive: {
    color: '#fff',
  },
  saveButton: {
    marginHorizontal: 24,
    marginBottom: 40,
    backgroundColor: '#1a9e4a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EditTransactionScreen;
