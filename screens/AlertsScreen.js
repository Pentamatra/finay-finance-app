import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  TextInput
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../contexts/ThemeContext';

const AlertsScreen = () => {
  const { isDarkMode, colors } = useContext(ThemeContext);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [newAlertType, setNewAlertType] = useState('price');
  const [newAlertSymbol, setNewAlertSymbol] = useState('');
  const [newAlertValue, setNewAlertValue] = useState('');
  
  // Örnek uyarı listesi
  const [alerts, setAlerts] = useState([
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      condition: 'above',
      value: 190.00,
      type: 'price',
      active: true,
      color: '#4E7AF9'
    },
    {
      id: '2',
      symbol: 'BTC',
      name: 'Bitcoin',
      condition: 'below',
      value: 65000.00,
      type: 'price',
      active: true,
      color: '#FDCB6E'
    },
    {
      id: '3',
      symbol: 'MSFT',
      name: 'Microsoft',
      condition: 'percent',
      value: 5.00,
      type: 'change',
      active: false,
      color: '#2ED573'
    },
    {
      id: '4',
      symbol: 'TSLA',
      name: 'Tesla',
      condition: 'above',
      value: 180.00,
      type: 'price',
      active: true,
      color: '#FF4757'
    }
  ]);
  
  const toggleAlert = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? {...alert, active: !alert.active} : alert
    ));
  };
  
  const addNewAlert = () => {
    if (!newAlertSymbol || !newAlertValue) return;
    
    const newAlert = {
      id: Date.now().toString(),
      symbol: newAlertSymbol.toUpperCase(),
      name: newAlertSymbol.toUpperCase(), // Gerçek bir API'da sembolün karşılığı alınır
      condition: 'above',
      value: parseFloat(newAlertValue),
      type: newAlertType,
      active: true,
      color: '#4E7AF9'
    };
    
    setAlerts([newAlert, ...alerts]);
    setNewAlertSymbol('');
    setNewAlertValue('');
    setAlertModalVisible(false);
  };
  
  const deleteAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };
  
  const renderAlertCondition = (alert) => {
    if (alert.type === 'price') {
      return (
        <Text>
          {alert.symbol} {alert.condition === 'above' ? '>' : '<'} {alert.value.toLocaleString('tr-TR')} ₺
        </Text>
      );
    } else {
      return (
        <Text>
          {alert.symbol} %{alert.value} {alert.condition === 'percent' ? 'değişim' : 'düşüş'}
        </Text>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDarkMode ? colors.background : '#f8f9fa'}]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: isDarkMode ? colors.text : '#333'}]}>Fiyat Uyarıları</Text>
        <TouchableOpacity 
          style={[styles.addButton, {backgroundColor: isDarkMode ? `${colors.primary}30` : 'rgba(78, 122, 249, 0.1)'}]}
          onPress={() => setAlertModalVisible(true)}
        >
          <Feather name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Feather name="bell-off" size={50} color={isDarkMode ? colors.border : "#ddd"} />
            </View>
            <Text style={[styles.emptyTitle, {color: isDarkMode ? colors.text : '#333'}]}>Henüz uyarı yok</Text>
            <Text style={[styles.emptyDescription, {color: isDarkMode ? `${colors.text}80` : '#888'}]}>Fiyat uyarıları oluşturarak piyasadaki önemli hareketleri kaçırmayın</Text>
            <TouchableOpacity 
              style={styles.createFirstButton}
              onPress={() => setAlertModalVisible(true)}
            >
              <LinearGradient
                colors={isDarkMode ? [colors.primary, '#8C69FF'] : ['#4E7AF9', '#8C69FF']}
                style={styles.createFirstButtonGradient}
              >
                <Text style={styles.createFirstButtonText}>İlk Uyarını Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.alertsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {color: isDarkMode ? colors.text : '#333'}]}>Aktif Uyarılar</Text>
              </View>
              
              {alerts.filter(alert => alert.active).map(alert => (
                <View key={alert.id} style={[styles.alertItem, {backgroundColor: isDarkMode ? colors.card : '#fff', shadowColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}]}>
                  <View style={styles.alertInfo}>
                    <View style={[styles.alertSymbolContainer, { backgroundColor: isDarkMode ? `${alert.color}30` : `${alert.color}20` }]}>
                      <Text style={[styles.alertSymbol, { color: alert.color }]}>{alert.symbol.substring(0, 1)}</Text>
                    </View>
                    <View style={styles.alertDetails}>
                      <Text style={[styles.alertName, {color: isDarkMode ? colors.text : '#333'}]}>{alert.name}</Text>
                      <Text style={[styles.alertCondition, {color: isDarkMode ? `${colors.text}80` : '#666'}]}>{renderAlertCondition(alert)}</Text>
                    </View>
                  </View>
                  <View style={styles.alertActions}>
                    <Switch
                      value={alert.active}
                      onValueChange={() => toggleAlert(alert.id)}
                      trackColor={{ false: isDarkMode ? '#555' : '#f4f3f4', true: isDarkMode ? `${colors.primary}50` : '#4E7AF920' }}
                      thumbColor={alert.active ? colors.primary : isDarkMode ? '#888' : '#f4f3f4'}
                    />
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteAlert(alert.id)}
                    >
                      <Feather name="trash-2" size={18} color="#FF4757" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            
            {alerts.some(alert => !alert.active) && (
              <View style={styles.alertsContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, {color: isDarkMode ? colors.text : '#333'}]}>Pasif Uyarılar</Text>
                </View>
                
                {alerts.filter(alert => !alert.active).map(alert => (
                  <View key={alert.id} style={[styles.alertItem, styles.inactiveAlertItem, {backgroundColor: isDarkMode ? colors.cardAlt : '#f8f8f8'}]}>
                    <View style={styles.alertInfo}>
                      <View style={[styles.alertSymbolContainer, { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }]}>
                        <Text style={[styles.alertSymbol, { color: isDarkMode ? '#888' : '#aaa' }]}>{alert.symbol.substring(0, 1)}</Text>
                      </View>
                      <View style={styles.alertDetails}>
                        <Text style={[styles.alertName, { color: isDarkMode ? '#888' : '#aaa' }]}>{alert.name}</Text>
                        <Text style={[styles.alertCondition, { color: isDarkMode ? '#777' : '#aaa' }]}>{renderAlertCondition(alert)}</Text>
                      </View>
                    </View>
                    <View style={styles.alertActions}>
                      <Switch
                        value={alert.active}
                        onValueChange={() => toggleAlert(alert.id)}
                        trackColor={{ false: isDarkMode ? '#444' : '#f4f3f4', true: isDarkMode ? `${colors.primary}50` : '#4E7AF920' }}
                        thumbColor={alert.active ? colors.primary : isDarkMode ? '#666' : '#f4f3f4'}
                      />
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => deleteAlert(alert.id)}
                      >
                        <Feather name="trash-2" size={18} color="#FF4757" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Yeni Uyarı Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={alertModalVisible}
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={[styles.modalOverlay, {backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)'}]}>
          <View style={[styles.modalContainer, {backgroundColor: isDarkMode ? colors.card : '#fff'}]}>
            <View style={[styles.modalHeader, {borderBottomColor: isDarkMode ? colors.border : '#f0f0f0'}]}>
              <Text style={[styles.modalTitle, {color: isDarkMode ? colors.text : '#333'}]}>Yeni Uyarı</Text>
              <TouchableOpacity onPress={() => setAlertModalVisible(false)}>
                <Feather name="x" size={24} color={isDarkMode ? colors.text : '#888'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, {color: isDarkMode ? colors.text : '#666'}]}>Uyarı Tipi</Text>
                <View style={[styles.alertTypeContainer, {borderColor: isDarkMode ? colors.border : '#e0e0e0'}]}>
                  <TouchableOpacity 
                    style={[
                      styles.alertTypeButton,
                      {backgroundColor: isDarkMode ? (newAlertType === 'price' ? colors.primary : '#333') : (newAlertType === 'price' ? '#4E7AF9' : '#f8f8f8')}
                    ]}
                    onPress={() => setNewAlertType('price')}
                  >
                    <Text 
                      style={[
                        styles.alertTypeText,
                        {color: newAlertType === 'price' ? '#fff' : (isDarkMode ? '#999' : '#666')}
                      ]}
                    >
                      Fiyat
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.alertTypeButton,
                      {backgroundColor: isDarkMode ? (newAlertType === 'change' ? colors.primary : '#333') : (newAlertType === 'change' ? '#4E7AF9' : '#f8f8f8')}
                    ]}
                    onPress={() => setNewAlertType('change')}
                  >
                    <Text 
                      style={[
                        styles.alertTypeText,
                        {color: newAlertType === 'change' ? '#fff' : (isDarkMode ? '#999' : '#666')}
                      ]}
                    >
                      Değişim
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, {color: isDarkMode ? colors.text : '#666'}]}>Sembol</Text>
                <TextInput
                  style={[styles.input, {borderColor: isDarkMode ? colors.border : '#e0e0e0', backgroundColor: isDarkMode ? colors.cardAlt : '#fff', color: isDarkMode ? colors.text : '#333'}]}
                  placeholder="Örn: AAPL, BTC, MSFT"
                  placeholderTextColor={isDarkMode ? '#777' : '#aaa'}
                  value={newAlertSymbol}
                  onChangeText={setNewAlertSymbol}
                  autoCapitalize="characters"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, {color: isDarkMode ? colors.text : '#666'}]}>{newAlertType === 'price' ? 'Fiyat' : 'Değişim Oranı (%)'}</Text>
                <TextInput
                  style={[styles.input, {borderColor: isDarkMode ? colors.border : '#e0e0e0', backgroundColor: isDarkMode ? colors.cardAlt : '#fff', color: isDarkMode ? colors.text : '#333'}]}
                  placeholder={newAlertType === 'price' ? "Örn: 190.50" : "Örn: 5.0"}
                  placeholderTextColor={isDarkMode ? '#777' : '#aaa'}
                  value={newAlertValue}
                  onChangeText={setNewAlertValue}
                  keyboardType="numeric"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={addNewAlert}
              >
                <LinearGradient
                  colors={isDarkMode ? [colors.primary, '#8C69FF'] : ['#4E7AF9', '#8C69FF']}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Uyarı Oluştur</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(78, 122, 249, 0.1)',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  createFirstButton: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  createFirstButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  alertsContainer: {
    marginBottom: 20,
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
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  inactiveAlertItem: {
    backgroundColor: '#f8f8f8',
    elevation: 0,
    shadowOpacity: 0,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertSymbolContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertDetails: {
    justifyContent: 'center',
  },
  alertName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alertCondition: {
    fontSize: 14,
    color: '#666',
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 80,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  alertTypeContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  alertTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  alertTypeButtonActive: {
    backgroundColor: '#4E7AF9',
  },
  alertTypeText: {
    fontSize: 14,
    color: '#666',
  },
  alertTypeTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  createButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AlertsScreen;
