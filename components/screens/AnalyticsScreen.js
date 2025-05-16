import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { getTransactionsByCategory, getMonthlySpending } from '../../utils/storage';
import Toast from '../Toast';
import ColorPicker from '../ColorPicker';

const AnalyticsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [selectedColor, setSelectedColor] = useState('#2a9d8f');

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const categories = await getTransactionsByCategory();
      const monthly = await getMonthlySpending();
      
      setCategoryData(categories);
      setMonthlyData(monthly);
      showToast('Analytics updated successfully');
    } catch (error) {
      console.error('Error loading analytics data:', error);
      showToast('Failed to update analytics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const pieChartData = Object.entries(categoryData).map(([category, amount], index) => {
    // Create a color palette based on the selected color
    const hue = parseInt(selectedColor.slice(1), 16);
    const baseHue = (hue + (index * 45)) % 360;
    return {
      name: category,
      amount: amount,
      color: `hsl(${baseHue}, 70%, 50%)`,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    };
  });

  const lineChartData = {
    labels: Object.keys(monthlyData).map(date => {
      const [year, month] = date.split('-');
      return `${month}/${year.slice(2)}`;
    }),
    datasets: [{
      data: Object.values(monthlyData),
      color: (opacity = 1) => `${selectedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    }],
  };

  const screenWidth = Dimensions.get('window').width;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        onHide={hideToast}
      />
      <ScrollView 
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2a9d8f']}
            tintColor="#2a9d8f"
          />
        }
      >
        <ColorPicker
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {pieChartData.length > 0 ? (
            <PieChart
              data={pieChartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `${selectedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <Text style={styles.noDataText}>No category data available</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Spending</Text>
          {Object.keys(monthlyData).length > 0 ? (
            <LineChart
              data={lineChartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `${selectedColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <Text style={styles.noDataText}>No monthly data available</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },
});

export default AnalyticsScreen;
