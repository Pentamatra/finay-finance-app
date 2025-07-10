import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const BAR_WIDTH = 28;
const MAX_BAR_HEIGHT = 150;

const TransactionChart = ({ data = [], themeColors = ['#4E7AF9', '#8C69FF'] }) => {
  // Boş veri kontrolü yaparak varsayılan değerler oluştur
  const safeData = data && data.length > 0 ? data : [
    { month: 1, amount: 0 },
    { month: 2, amount: 0 },
    { month: 3, amount: 0 },
    { month: 4, amount: 0 },
    { month: 5, amount: 0 },
    { month: 6, amount: 0 },
  ];
  
  const [barHeights, setBarHeights] = useState(safeData.map(() => new Animated.Value(0)));
  
  // Maksimum değeri bul (sıfırdan küçük olmamasını sağla)
  const maxValue = Math.max(...safeData.map(item => item.amount || 0), 100);
  
  useEffect(() => {
    // Bar animasyonları
    const animations = safeData.map((item, index) => {
      return Animated.timing(barHeights[index], {
        toValue: ((item.amount || 0) / maxValue) * MAX_BAR_HEIGHT,
        duration: 800,
        delay: index * 100,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: false
      });
    });
    
    // Animasyonları başlat
    Animated.stagger(50, animations).start();
  }, [safeData, maxValue]);
  
  const getMonthName = (monthIndex) => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return months[monthIndex - 1] || '';
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aylık Harcama Analizi</Text>
      
      <View style={styles.chartContainer}>
        {/* Y ekseni değerleri */}
        <View style={styles.yAxis}>
          <Text style={styles.yAxisLabel}>{maxValue.toLocaleString()} ₺</Text>
          <Text style={styles.yAxisLabel}>{(maxValue / 2).toLocaleString()} ₺</Text>
          <Text style={styles.yAxisLabel}>0 ₺</Text>
        </View>
        
        {/* Grafik alanı */}
        <View style={styles.chart}>
          {/* Yatay çizgiler */}
          <View style={[styles.horizontalLine, { top: 0 }]} />
          <View style={[styles.horizontalLine, { top: MAX_BAR_HEIGHT / 2 }]} />
          <View style={[styles.horizontalLine, { top: MAX_BAR_HEIGHT }]} />
          
          {/* Çubuklar */}
          <View style={styles.barsContainer}>
            {safeData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <Animated.View 
                  style={[
                    styles.barAnimatedWrapper,
                    { height: barHeights[index] }
                  ]}
                >
                  <LinearGradient
                    colors={themeColors}
                    style={styles.bar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </Animated.View>
                <Text style={styles.barLabel}>{getMonthName(item.month)}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      {/* Alt bilgi */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: themeColors[0] }]} />
          <Text style={styles.legendText}>Harcamalar</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT + 30,
    marginBottom: 10,
  },
  yAxis: {
    width: 60,
    height: MAX_BAR_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#888',
  },
  chart: {
    flex: 1,
    height: MAX_BAR_HEIGHT,
    position: 'relative',
  },
  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#eee',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: MAX_BAR_HEIGHT,
    paddingHorizontal: 5,
  },
  barColumn: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  barAnimatedWrapper: {
    width: BAR_WIDTH - 8,
    overflow: 'hidden',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  bar: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default TransactionChart;
