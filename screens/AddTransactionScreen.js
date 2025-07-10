import React, { useState, useContext, useCallback } from 'react';
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

const AddTransactionScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [isIncome, setIsIncome] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleAddTransaction = useCallback(async () => {
    // Validasyon kontrolleri
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir miktar girin');
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        type: isIncome ? 'income' : 'expense',
        amount: parseFloat(amount),
        category: selectedCategory.apiValue,
        description: description || `${isIncome ? 'Gelir' : 'Gider'}: ${selectedCategory.name}`,
        paymentMethod: 'Diğer',
        date: new Date().toISOString()
      };

      // API host - Emülatör için 10.0.2.2, gerçek cihaz için localhost
      const apiHost = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
      
      const response = await axios.post(
        `${apiHost}/api/transactions`,
        transactionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      console.log('İşlem başarıyla eklendi:', response.data);
      
      // İşlem eklendiğinde bildirim oluştur
      try {
        const notificationData = {
          title: isIncome ? 'Yeni Gelir Eklendi' : 'Yeni Gider Eklendi',
          message: `${selectedCategory.name}: ${amount} TL - ${description || 'Açıklama yok'}`,
          type: isIncome ? 'success' : 'info',
          category: 'transaction',
          isImportant: false,
          relatedData: {
            transactionId: response.data._id,
            amount: parseFloat(amount),
            category: selectedCategory.apiValue,
            type: isIncome ? 'income' : 'expense'
          }
        };
        
        await axios.post(
          `${apiHost}/api/notifications`,
          notificationData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            }
          }
        );
        
        console.log('Bildirim başarıyla oluşturuldu');
      } catch (notificationError) {
        console.error('Bildirim oluşturulurken hata:', notificationError);
        // Bildirim oluşturma hatası işlemi etkilemeyecek
      }
      
      // İşlem eklendikten sonra formları temizle
      setAmount('');
      setDescription('');
      setSelectedCategory(categories[0]);
      
      // Başarı mesajı göster
      Alert.alert(
        'Başarılı',
        'İşlem başarıyla kaydedildi',
        [
          { 
            text: 'Tamam', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('İşlem eklenirken hata oluştu:', error);
      let errorMessage = 'Bir hata oluştu';
      
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        console.log('Sunucu hatası:', error.response.data);
      } else if (error.request) {
        errorMessage = 'Sunucuya ulaşılamadı';
        console.log('İstek hatası:', error.request);
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, navigation, amount, description, selectedCategory, isIncome]);

  return (
    <LinearGradient colors={['#1a4a9e', '#6fa8dc']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Yeni İşlem</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Miktar</Text>
          <View style={styles.amountInput}>
            <Text style={styles.currency}>₺</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {/* Type Toggle */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, isIncome && styles.typeButtonActive]}
            onPress={() => setIsIncome(true)}
          >
            <Ionicons name="cash" size={24} color={isIncome ? '#1a9e4a' : '#fff'} />
            <Text style={[styles.typeText, isIncome && styles.typeTextActive]}>Gelir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, !isIncome && styles.typeButtonActive]}
            onPress={() => setIsIncome(false)}
          >
            <Ionicons name="cart" size={24} color={!isIncome ? '#e74c3c' : '#fff'} />
            <Text style={[styles.typeText, !isIncome && styles.typeTextActive]}>Gider</Text>
          </TouchableOpacity>
        </View>

        {/* Category Selection */}
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
                <Text style={styles.categoryText}>{category.name}</Text>
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
          onPress={handleAddTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Kaydet</Text>
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

export default AddTransactionScreen;
