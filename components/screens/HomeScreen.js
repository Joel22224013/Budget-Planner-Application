import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Toast from '../Toast';
import * as ImagePicker from 'expo-image-picker';

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    monthlyBudget: '',
    currency: 'USD',
    avatarType: 'image',
    profilePicture: null,
    profileEmoji: '😊',
    profileColor: '#2a9d8f',
  });
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'expense', 'income'
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [modalScale] = useState(new Animated.Value(0.8));
  const [modalOpacity] = useState(new Animated.Value(0));
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const [budgetAlertMessage, setBudgetAlertMessage] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [tempBudgets, setTempBudgets] = useState({
    daily: '',
    weekly: '',
    monthly: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsRefreshing(true);
      loadData().finally(() => {
        setIsRefreshing(false);
        showToast('Data refreshed successfully');
      });
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storedTransactions, storedUserDetails] = await Promise.all([
        AsyncStorage.getItem('transactions'),
        AsyncStorage.getItem('userDetails'),
      ]);

      if (storedTransactions) {
        const parsedTransactions = JSON.parse(storedTransactions);
        setTransactions(parsedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }

      if (storedUserDetails) {
        const parsedUserDetails = JSON.parse(storedUserDetails);
        setUserDetails(parsedUserDetails);
        animateProfileChange();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      showToast('Data refreshed successfully');
    } catch (error) {
      showToast('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '' });
  };

  const formatCurrency = (amount) => {
    const currency = userDetails?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const foundCategory = userDetails?.categories?.find(cat => cat.name === category);
    return foundCategory?.color || '#95A5A6';
  };

  const animateProfileChange = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const openAvatarModal = () => {
    setShowAvatarModal(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeAvatarModal = () => {
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAvatarModal(false);
    });
  };

  const saveProfilePicture = async () => {
    if (userDetails.avatarType === 'image' && userDetails.profilePicture) {
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          showToast("Permission to access media library is required!");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaType.IMAGE,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });

        if (!result.canceled) {
          const selectedAsset = result.assets[0];
          console.log("Selected Image URI:", selectedAsset.uri);
          
          const updatedUserDetails = {
            ...userDetails,
            profilePicture: selectedAsset.uri
          };
          await AsyncStorage.setItem('userDetails', JSON.stringify(updatedUserDetails));
          setUserDetails(updatedUserDetails);
          animateProfileChange();
          showToast('Profile picture updated successfully');
        }
      } catch (error) {
        console.error('Error updating profile picture:', error);
        showToast('Failed to update profile picture');
      }
    } else {
      showToast('Can only save profile pictures');
    }
  };

  const renderAvatarModal = () => (
    <Modal
      visible={showAvatarModal}
      transparent
      animationType="none"
      onRequestClose={closeAvatarModal}
    >
      <TouchableOpacity
        style={styles.avatarModalContainer}
        activeOpacity={1}
        onPress={closeAvatarModal}
      >
        <Animated.View
          style={[
            styles.avatarModalContent,
            {
              opacity: modalOpacity,
              transform: [{ scale: modalScale }],
            },
          ]}
        >
          {userDetails.avatarType === 'emoji' ? (
            <View style={styles.modalEmojiContainer}>
              <Text style={styles.modalEmojiText}>{userDetails.profileEmoji}</Text>
            </View>
          ) : userDetails.avatarType === 'color' ? (
            <View style={[styles.modalColorContainer, { backgroundColor: userDetails.profileColor }]}>
              <Text style={styles.modalInitialsText}>
                {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          ) : userDetails.profilePicture ? (
            <Image
              source={{ uri: userDetails.profilePicture }}
              style={styles.modalProfilePicture}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.modalDefaultAvatar}>
              <Ionicons name="person" size={80} color="#666" />
            </View>
          )}
        </Animated.View>

        <View style={styles.modalButtons}>
          {userDetails.avatarType === 'image' && userDetails.profilePicture && (
            <TouchableOpacity
              style={styles.modalButton}
              onPress={saveProfilePicture}
            >
              <Ionicons name="download-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.modalButton}
            onPress={closeAvatarModal}
          >
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderAvatar = () => {
    const avatarContent = (() => {
      switch (userDetails.avatarType) {
        case 'emoji':
          return (
            <View style={[styles.profilePicture, { backgroundColor: '#f0f0f0' }]}>
              <Text style={styles.emojiText}>{userDetails.profileEmoji}</Text>
            </View>
          );
        case 'color':
          return (
            <View style={[styles.profilePicture, { backgroundColor: userDetails.profileColor }]}>
              <Text style={styles.initialsText}>
                {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          );
        default:
          return userDetails.profilePicture ? (
            <Image
              source={{ uri: userDetails.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicture}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          );
      }
    })();

    return (
      <TouchableOpacity
        onPress={openAvatarModal}
        activeOpacity={0.7}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {avatarContent}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const getFilteredAndSortedTransactions = () => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === filterCategory);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date) - new Date(a.date);
          break;
        case 'amount':
          comparison = b.amount - a.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = new Date(b.date) - new Date(a.date); // Default to date sorting
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  };

  const getUniqueCategories = () => {
    return ['all', ...new Set(transactions.map(t => t.category))];
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter & Sort</Text>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Transaction Type</Text>
            <View style={styles.filterOptions}>
              {['all', 'expense', 'income'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    filterType === type && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterType === type && styles.filterButtonTextActive,
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView style={styles.categoryList}>
              {getUniqueCategories().map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    filterCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setFilterCategory(category)}
                >
                  <View style={[
                    styles.categoryDot,
                    { backgroundColor: category === 'all' ? '#95A5A6' : getCategoryColor(category) }
                  ]} />
                  <Text style={[
                    styles.categoryButtonText,
                    filterCategory === category && styles.categoryButtonTextActive,
                  ]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {['date', 'amount', 'category'].map(sort => (
                <TouchableOpacity
                  key={sort}
                  style={[
                    styles.sortButton,
                    sortBy === sort && styles.sortButtonActive,
                  ]}
                  onPress={() => {
                    if (sortBy === sort) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(sort);
                      setSortOrder('desc');
                    }
                  }}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === sort && styles.sortButtonTextActive,
                  ]}>
                    {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    {sortBy === sort && (
                      <Ionicons
                        name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color="#fff"
                        style={styles.sortIcon}
                      />
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getDailySpent = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(transaction => new Date(transaction.date).toDateString() === today)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getWeeklySpent = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    return transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startOfWeek && transactionDate <= today;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getMonthlySpent = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const checkBudgetAlerts = () => {
    const dailySpent = getDailySpent();
    const weeklySpent = getWeeklySpent();
    const monthlySpent = getMonthlySpent();
    const alerts = [];

    if (userDetails?.dailyBudget) {
      const dailyPercentage = (dailySpent / parseFloat(userDetails.dailyBudget)) * 100;
      if (dailyPercentage >= 90 && dailyPercentage < 100) {
        alerts.push(`You've used ${Math.round(dailyPercentage)}% of your daily budget`);
      } else if (dailyPercentage >= 100) {
        alerts.push("You've exceeded your daily budget");
      }
    }

    if (userDetails?.weeklyBudget) {
      const weeklyPercentage = (weeklySpent / parseFloat(userDetails.weeklyBudget)) * 100;
      if (weeklyPercentage >= 90 && weeklyPercentage < 100) {
        alerts.push(`You've used ${Math.round(weeklyPercentage)}% of your weekly budget`);
      } else if (weeklyPercentage >= 100) {
        alerts.push("You've exceeded your weekly budget");
      }
    }

    if (userDetails?.monthlyBudget) {
      const monthlyPercentage = (monthlySpent / parseFloat(userDetails.monthlyBudget)) * 100;
      if (monthlyPercentage >= 90 && monthlyPercentage < 100) {
        alerts.push(`You've used ${Math.round(monthlyPercentage)}% of your monthly budget`);
      } else if (monthlyPercentage >= 100) {
        alerts.push("You've exceeded your monthly budget");
      }
    }

    if (alerts.length > 0) {
      setBudgetAlertMessage(alerts);
      setShowBudgetAlert(true);
    }
  };

  useEffect(() => {
    if (transactions.length > 0) {
      checkBudgetAlerts();
    }
  }, [transactions, userDetails]);

  const handleBudgetSave = async () => {
    try {
      const updatedUserDetails = {
        ...userDetails,
        dailyBudget: tempBudgets.daily,
        weeklyBudget: tempBudgets.weekly,
        monthlyBudget: tempBudgets.monthly
      };
      await AsyncStorage.setItem('userDetails', JSON.stringify(updatedUserDetails));
      setUserDetails(updatedUserDetails);
      setShowBudgetModal(false);
      showToast('Budget updated successfully');
    } catch (error) {
      console.error('Error saving budget:', error);
      showToast('Failed to update budget');
    }
  };

  const renderBudgetModal = () => (
    <Modal
      visible={showBudgetModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBudgetModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set Budget</Text>
          
          <View style={styles.budgetInputContainer}>
            <Text style={styles.budgetInputLabel}>Daily Budget</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>
                {userDetails?.currency === 'USD' ? '$' : 
                 userDetails?.currency === 'EUR' ? '€' : 
                 userDetails?.currency === 'GBP' ? '£' : 
                 userDetails?.currency === 'GHS' ? '₵' : '$'}
              </Text>
              <TextInput
                style={styles.budgetInput}
                value={tempBudgets.daily}
                onChangeText={(text) => setTempBudgets(prev => ({ ...prev, daily: text }))}
                keyboardType="numeric"
                placeholder="Enter daily budget"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.budgetInputContainer}>
            <Text style={styles.budgetInputLabel}>Weekly Budget</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>
                {userDetails?.currency === 'USD' ? '$' : 
                 userDetails?.currency === 'EUR' ? '€' : 
                 userDetails?.currency === 'GBP' ? '£' : 
                 userDetails?.currency === 'GHS' ? '₵' : '$'}
              </Text>
              <TextInput
                style={styles.budgetInput}
                value={tempBudgets.weekly}
                onChangeText={(text) => setTempBudgets(prev => ({ ...prev, weekly: text }))}
                keyboardType="numeric"
                placeholder="Enter weekly budget"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.budgetInputContainer}>
            <Text style={styles.budgetInputLabel}>Monthly Budget</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencySymbol}>
                {userDetails?.currency === 'USD' ? '$' : 
                 userDetails?.currency === 'EUR' ? '€' : 
                 userDetails?.currency === 'GBP' ? '£' : 
                 userDetails?.currency === 'GHS' ? '₵' : '$'}
              </Text>
              <TextInput
                style={styles.budgetInput}
                value={tempBudgets.monthly}
                onChangeText={(text) => setTempBudgets(prev => ({ ...prev, monthly: text }))}
                keyboardType="numeric"
                placeholder="Enter monthly budget"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowBudgetModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleBudgetSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const recentTransactions = transactions.slice(0, 3);

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        onHide={hideToast}
      />
      <Modal
        visible={showBudgetAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBudgetAlert(false)}
      >
        <View style={styles.alertModalContainer}>
          <View style={styles.alertModalContent}>
            <Ionicons name="alert-circle" size={40} color="#e74c3c" />
            <Text style={styles.alertTitle}>Budget Alert</Text>
            <View style={styles.alertMessageContainer}>
              {(budgetAlertMessage || []).map((message, index) => (
                <Text key={index} style={styles.alertMessage}>{message}</Text>
              ))}
            </View>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setShowBudgetAlert(false)}
            >
              <Text style={styles.alertButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {(loading || isRefreshing) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2a9d8f" />
          <Text style={styles.loadingText}>
            {isRefreshing ? 'Refreshing...' : 'Loading...'}
          </Text>
        </View>
      )}
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
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {renderAvatar()}
            <View style={styles.profileInfo}>
              <Text style={styles.welcomeText}>
                Welcome back, {userDetails.name || 'User'}!
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="settings-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Today's Spending</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setTempBudgets({
                  daily: userDetails?.dailyBudget || '',
                  weekly: userDetails?.weeklyBudget || '',
                  monthly: userDetails?.monthlyBudget || ''
                });
                setShowBudgetModal(true);
              }}
            >
              <Ionicons name="pencil" size={20} color="#2a9d8f" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(getDailySpent())}</Text>
          {userDetails?.dailyBudget && (
            <View style={styles.budgetProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (getDailySpent() / parseFloat(userDetails.dailyBudget)) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        getDailySpent() > parseFloat(userDetails.dailyBudget)
                          ? '#e74c3c'
                          : '#2a9d8f',
                    },
                  ]}
                />
              </View>
              <Text style={styles.budgetText}>
                {formatCurrency(getDailySpent())} of {formatCurrency(userDetails.dailyBudget)}
              </Text>
            </View>
          )}

          <View style={styles.budgetDivider} />

          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Weekly Spending</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setTempBudgets({
                  weekly: userDetails?.weeklyBudget || '',
                  monthly: userDetails?.monthlyBudget || ''
                });
                setShowBudgetModal(true);
              }}
            >
              <Ionicons name="pencil" size={20} color="#2a9d8f" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(getWeeklySpent())}</Text>
          {userDetails?.weeklyBudget && (
            <View style={styles.budgetProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (getWeeklySpent() / parseFloat(userDetails.weeklyBudget)) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        getWeeklySpent() > parseFloat(userDetails.weeklyBudget)
                          ? '#e74c3c'
                          : '#2a9d8f',
                    },
                  ]}
                />
              </View>
              <Text style={styles.budgetText}>
                {formatCurrency(getWeeklySpent())} of {formatCurrency(userDetails.weeklyBudget)}
              </Text>
            </View>
          )}

          <View style={styles.budgetDivider} />

          <Text style={styles.balanceTitle}>Monthly Spending</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(getMonthlySpent())}</Text>
          {userDetails?.monthlyBudget && (
            <View style={styles.budgetProgress}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        (getMonthlySpent() / parseFloat(userDetails.monthlyBudget)) * 100,
                        100
                      )}%`,
                      backgroundColor:
                        getMonthlySpent() > parseFloat(userDetails.monthlyBudget)
                          ? '#e74c3c'
                          : '#2a9d8f',
                    },
                  ]}
                />
              </View>
              <Text style={styles.budgetText}>
                {formatCurrency(getMonthlySpent())} of {formatCurrency(userDetails.monthlyBudget)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Add')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Add Transaction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4a90e2' }]}>
              <Ionicons name="bar-chart" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>View Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="filter" size={20} color="#2a9d8f" />
              </TouchableOpacity>
              {transactions.length > 5 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('List')}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#2a9d8f" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>

          {getFilteredAndSortedTransactions().length > 0 ? (
            getFilteredAndSortedTransactions().slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <View style={styles.transactionHeader}>
                    <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(transaction.category) }]} />
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                  </View>
                  <Text style={styles.transactionCategory}>
                    {transaction.category}
                  </Text>
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'expense' ? '#e74c3c' : '#2ecc71' }
                  ]}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {searchQuery || filterType !== 'all' || filterCategory !== 'all'
                  ? 'No matching transactions'
                  : 'No transactions yet'}
              </Text>
              <TouchableOpacity
                style={styles.addTransactionButton}
                onPress={() => navigation.navigate('Add')}
              >
                <Text style={styles.addTransactionButtonText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {renderFilterModal()}
      </ScrollView>
      {renderAvatarModal()}
      {renderBudgetModal()}
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
  profileSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginRight: 12,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 24,
  },
  initialsText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  settingsButton: {
    padding: 8,
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  budgetProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a9d8f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2a9d8f',
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearSearchButton: {
    padding: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
  },
  addTransactionButton: {
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTransactionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2a9d8f',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  categoryList: {
    maxHeight: 150,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2a9d8f',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#2a9d8f',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  applyButton: {
    backgroundColor: '#2a9d8f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContent: {
    width: '80%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProfilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  modalEmojiContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmojiText: {
    fontSize: 120,
  },
  modalColorContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInitialsText: {
    fontSize: 80,
    color: '#fff',
    fontWeight: '600',
  },
  modalDefaultAvatar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  budgetDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  alertModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  alertMessageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  alertMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertButton: {
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    padding: 4,
  },
  budgetInputContainer: {
    marginBottom: 20,
  },
  budgetInputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#2a9d8f',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  mediaDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default HomeScreen;
