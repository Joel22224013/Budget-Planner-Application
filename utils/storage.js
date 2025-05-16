import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = '@transactions';

export const saveTransaction = async (transaction) => {
  try {
    const existingTransactions = await getTransactions();
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    const updatedTransactions = [...existingTransactions, newTransaction];
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    return newTransaction;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const transactions = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return transactions ? JSON.parse(transactions) : [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const updateTransaction = async (transactionId, updatedData) => {
  try {
    const transactions = await getTransactions();
    const updatedTransactions = transactions.map(transaction => 
      transaction.id === transactionId 
        ? { ...transaction, ...updatedData }
        : transaction
    );
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

export const deleteTransaction = async (transactionId) => {
  try {
    const transactions = await getTransactions();
    const updatedTransactions = transactions.filter(t => t.id !== transactionId);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const getTransactionsByCategory = async () => {
  const transactions = await getTransactions();
  const categoryTotals = {};
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'Uncategorized';
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(transaction.amount);
  });

  return categoryTotals;
};

export const getMonthlySpending = async () => {
  const transactions = await getTransactions();
  const monthlyTotals = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + Number(transaction.amount);
  });

  return monthlyTotals;
};
