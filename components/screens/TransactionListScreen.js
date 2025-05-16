import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import TransactionItem from '../TransactionItem';
import { getTransactions, deleteTransaction, updateTransaction } from '../../utils/storage';
import Toast from '../Toast';

const TransactionListScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '' });
  };

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      // Sort transactions by date, newest first
      const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sortedData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showToast('Failed to load transactions');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      await loadTransactions(); // Reload the list after deletion
      showToast('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Failed to delete transaction');
    }
  };

  const handleUpdate = async (id, updatedData) => {
    try {
      await updateTransaction(id, updatedData);
      await loadTransactions(); // Reload the list after update
      showToast('Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      showToast('Failed to update transaction');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTransactions();
      showToast('Transactions refreshed successfully');
    } catch (error) {
      showToast('Failed to refresh transactions');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Add focus listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsRefreshing(true);
      loadTransactions().finally(() => {
        setIsRefreshing(false);
        showToast('Transactions refreshed successfully');
      });
    });

    return unsubscribe;
  }, [navigation]);

  // Add refresh button to header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        onHide={hideToast}
      />
      {isRefreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Refreshing...</Text>
        </View>
      )}
      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              id={item.id}
              description={item.description}
              amount={item.amount}
              category={item.category}
              date={formatDate(item.date)}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubText}>Add a transaction to see it here</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    marginRight: 15,
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default TransactionListScreen;
