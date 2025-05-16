import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from '../Toast';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', color: '#FF6B6B' },
  { name: 'Transportation', color: '#4ECDC4' },
  { name: 'Shopping', color: '#45B7D1' },
  { name: 'Entertainment', color: '#96CEB4' },
  { name: 'Bills & Utilities', color: '#FFEEAD' },
  { name: 'Health & Fitness', color: '#D4A5A5' },
  { name: 'Travel', color: '#9B59B6' },
  { name: 'Education', color: '#3498DB' },
  { name: 'Personal Care', color: '#E67E22' },
  { name: 'Others', color: '#95A5A6' },
];

const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#95A5A6',
  '#1ABC9C', '#2ECC71', '#F1C40F', '#E74C3C', '#34495E',
];

const EMOJI_CATEGORIES = {
  'Faces': ['😊', '😎', '🤓', '😇', '🤖', '😍', '🥰', '😋', '🤔', '😴', '😎', '🤩', '🥳', '😇', '🤠'],
  'People': ['👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🍳', '👩‍🏫', '🧑‍⚕️', '👨‍🏭', '👩‍🔬', '🧑‍🌾', '👨‍🚀', '👩‍🚀', '🧑‍🎭', '👨‍🎨', '👩‍🎤', '🧑‍🎪'],
  'Activities': ['🎮', '🎨', '🎵', '🏃', '🧘', '🎯', '⚽️', '🏀', '🎾', '🏈', '⚾️', '🎳', '🎲', '🎮', '🎯'],
  'Nature': ['🌺', '🌸', '🌼', '🌻', '🌹', '🌷', '🌳', '🌲', '🌵', '🌴', '🌱', '🌿', '🍀', '🌾', '🌻'],
  'Objects': ['📱', '💻', '⌚️', '📷', '🎥', '🎬', '📚', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠', '🎯', '🎲'],
};

const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#95A5A6',
  '#1ABC9C', '#2ECC71', '#F1C40F', '#E74C3C', '#34495E',
];

const EMOJI_OPTIONS = ['😊', '😎', '🤓', '😇', '🤖', '👨‍💻', '👩‍💻', '🎮', '🎨', '🎵', '🏃', '🧘', '🎯', '🌟', '💫'];

const UserProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [userDetails, setUserDetails] = useState({
    name: '',
    email: '',
    phone: '',
    profilePicture: null,
    monthlyBudget: '',
    currency: 'USD',
    theme: 'default',
    categories: DEFAULT_CATEGORIES,
    notifications: {
      budgetAlerts: true,
      weeklyReport: true,
      monthlyReport: true,
      categoryLimit: true,
    },
  });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarType, setAvatarType] = useState('image');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedColor, setSelectedColor] = useState('#2a9d8f');
  const [customColor, setCustomColor] = useState('');
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('Faces');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadUserDetails();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos');
    }
  };

  const loadUserDetails = async () => {
    try {
      const details = await AsyncStorage.getItem('userDetails');
      if (details) {
        setUserDetails(JSON.parse(details));
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      showToast('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const hideToast = () => {
    setToast({ visible: false, message: '' });
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setUserDetails({
          ...userDetails,
          profilePicture: result.assets[0].uri,
          avatarType: 'image',
        });
        setAvatarType('image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick image');
    }
  };

  const animateAvatarChange = () => {
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

  const handleEmojiSelect = (emoji) => {
    animateAvatarChange();
    setSelectedEmoji(emoji);
    setUserDetails({
      ...userDetails,
      avatarType: 'emoji',
      profileEmoji: emoji,
    });
    setAvatarType('emoji');
    setShowAvatarModal(false);
  };

  const handleColorSelect = (color) => {
    animateAvatarChange();
    setSelectedColor(color);
    setUserDetails({
      ...userDetails,
      avatarType: 'color',
      profileColor: color,
    });
    setAvatarType('color');
    setShowAvatarModal(false);
  };

  const handleCustomColor = () => {
    if (!/^#[0-9A-F]{6}$/i.test(customColor)) {
      showToast('Please enter a valid hex color (e.g., #FF0000)');
      return;
    }
    handleColorSelect(customColor);
  };

  const handleSave = async () => {
    if (!userDetails.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setSaving(true);
      await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
      showToast('Profile updated successfully');
    } catch (error) {
      console.error('Error saving user details:', error);
      showToast('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (userDetails.categories.some(cat => cat.name === newCategory.trim())) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    setUserDetails({
      ...userDetails,
      categories: [
        ...userDetails.categories,
        { name: newCategory.trim(), color: CATEGORY_COLORS[0] },
      ],
    });
    setNewCategory('');
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (category) => {
    if (DEFAULT_CATEGORIES.some(cat => cat.name === category.name)) {
      Alert.alert('Error', 'Cannot delete default categories');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUserDetails({
              ...userDetails,
              categories: userDetails.categories.filter((c) => c.name !== category.name),
            });
          },
        },
      ]
    );
  };

  const handleCategoryColorChange = (category, color) => {
    setUserDetails({
      ...userDetails,
      categories: userDetails.categories.map(cat =>
        cat.name === category.name ? { ...cat, color } : cat
      ),
    });
    setShowColorPicker(false);
    setSelectedCategory(null);
  };

  const renderAvatar = () => {
    const avatarContent = (() => {
      switch (userDetails?.avatarType || avatarType) {
        case 'emoji':
          return (
            <View style={[styles.profilePicturePlaceholder, { backgroundColor: '#f0f0f0' }]}>
              <Text style={styles.emojiText}>{userDetails?.profileEmoji || selectedEmoji}</Text>
            </View>
          );
        case 'color':
          return (
            <View style={[styles.profilePicturePlaceholder, { backgroundColor: userDetails?.profileColor || selectedColor }]}>
              <Text style={styles.initialsText}>
                {userDetails?.name ? userDetails.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          );
        default:
          return userDetails?.profilePicture ? (
            <Image
              source={{ uri: userDetails.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          );
      }
    })();

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {avatarContent}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2a9d8f" />
        <Text style={styles.loadingText}>Loading profile...</Text>
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
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            {renderAvatar()}
            <TouchableOpacity
              style={styles.changePictureButton}
              onPress={() => setShowAvatarModal(true)}
            >
              <Text style={styles.changePictureText}>Change Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={userDetails.name}
              onChangeText={(text) => setUserDetails({ ...userDetails, name: text })}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={userDetails.email}
              onChangeText={(text) => setUserDetails({ ...userDetails, email: text })}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={userDetails.phone}
              onChangeText={(text) => setUserDetails({ ...userDetails, phone: text })}
              placeholder="Enter your phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Budget</Text>
            <TextInput
              style={styles.input}
              value={userDetails.monthlyBudget}
              onChangeText={(text) => setUserDetails({ ...userDetails, monthlyBudget: text })}
              placeholder="Enter monthly budget"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency</Text>
            <View style={styles.currencyContainer}>
              {['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'GHS'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.currencyButton,
                    userDetails.currency === currency && styles.selectedCurrency,
                  ]}
                  onPress={() => setUserDetails({ ...userDetails, currency })}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      userDetails.currency === currency && styles.selectedCurrencyText,
                    ]}
                  >
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categories</Text>
            <View style={styles.categoriesContainer}>
              {userDetails.categories.map((category) => (
                <View key={category.name} style={styles.categoryItem}>
                  <View
                    style={[
                      styles.categoryColor,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text style={styles.categoryText}>{category.name}</Text>
                  {!DEFAULT_CATEGORIES.some(cat => cat.name === category.name) && (
                    <TouchableOpacity
                      onPress={() => handleDeleteCategory(category)}
                      style={styles.deleteCategoryButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#e74c3c" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowColorPicker(true);
                    }}
                    style={styles.colorPickerButton}
                  >
                    <Ionicons name="color-palette" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#2a9d8f" />
              <Text style={styles.addCategoryText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          
          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>Budget Alerts</Text>
            <Switch
              value={userDetails.notifications.budgetAlerts}
              onValueChange={(value) =>
                setUserDetails({
                  ...userDetails,
                  notifications: { ...userDetails.notifications, budgetAlerts: value },
                })
              }
              trackColor={{ false: '#767577', true: '#2a9d8f' }}
              thumbColor={userDetails.notifications.budgetAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>Weekly Reports</Text>
            <Switch
              value={userDetails.notifications.weeklyReport}
              onValueChange={(value) =>
                setUserDetails({
                  ...userDetails,
                  notifications: { ...userDetails.notifications, weeklyReport: value },
                })
              }
              trackColor={{ false: '#767577', true: '#2a9d8f' }}
              thumbColor={userDetails.notifications.weeklyReport ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>Monthly Reports</Text>
            <Switch
              value={userDetails.notifications.monthlyReport}
              onValueChange={(value) =>
                setUserDetails({
                  ...userDetails,
                  notifications: { ...userDetails.notifications, monthlyReport: value },
                })
              }
              trackColor={{ false: '#767577', true: '#2a9d8f' }}
              thumbColor={userDetails.notifications.monthlyReport ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.notificationItem}>
            <Text style={styles.notificationText}>Category Limit Alerts</Text>
            <Switch
              value={userDetails.notifications.categoryLimit}
              onValueChange={(value) =>
                setUserDetails({
                  ...userDetails,
                  notifications: { ...userDetails.notifications, categoryLimit: value },
                })
              }
              trackColor={{ false: '#767577', true: '#2a9d8f' }}
              thumbColor={userDetails.notifications.categoryLimit ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="Enter category name"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddCategory}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedCategory?.color === color && styles.selectedColorOption,
                  ]}
                  onPress={() => handleCategoryColorChange(selectedCategory, color)}
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowColorPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAvatarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Avatar Type</Text>
            
            <View style={styles.avatarTypeButtons}>
              <TouchableOpacity
                style={[styles.avatarTypeButton, avatarType === 'image' && styles.selectedAvatarType]}
                onPress={() => {
                  setShowAvatarModal(false);
                  handlePickImage();
                }}
              >
                <Ionicons name="image" size={24} color={avatarType === 'image' ? '#fff' : '#666'} />
                <Text style={[styles.avatarTypeText, avatarType === 'image' && styles.selectedAvatarTypeText]}>
                  Photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.avatarTypeButton, avatarType === 'emoji' && styles.selectedAvatarType]}
                onPress={() => {
                  setAvatarType('emoji');
                }}
              >
                <Text style={styles.emojiPreview}>{selectedEmoji}</Text>
                <Text style={[styles.avatarTypeText, avatarType === 'emoji' && styles.selectedAvatarTypeText]}>
                  Emoji
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.avatarTypeButton, avatarType === 'color' && styles.selectedAvatarType]}
                onPress={() => {
                  setAvatarType('color');
                }}
              >
                <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                <Text style={[styles.avatarTypeText, avatarType === 'color' && styles.selectedAvatarTypeText]}>
                  Color
                </Text>
              </TouchableOpacity>
            </View>

            {avatarType === 'emoji' && (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiCategories}>
                  {Object.keys(EMOJI_CATEGORIES).map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.emojiCategoryButton,
                        activeEmojiCategory === category && styles.activeEmojiCategory,
                      ]}
                      onPress={() => setActiveEmojiCategory(category)}
                    >
                      <Text style={[
                        styles.emojiCategoryText,
                        activeEmojiCategory === category && styles.activeEmojiCategoryText,
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.emojiGrid}>
                  {EMOJI_CATEGORIES[activeEmojiCategory].map((emoji, index) => (
                    <TouchableOpacity
                      key={`${emoji}-${index}`}
                      style={styles.emojiOption}
                      onPress={() => handleEmojiSelect(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {avatarType === 'color' && (
              <>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorOption,
                      ]}
                      onPress={() => handleColorSelect(color)}
                    />
                  ))}
                </View>
                <View style={styles.customColorContainer}>
                  <TextInput
                    style={styles.customColorInput}
                    placeholder="#RRGGBB"
                    placeholderTextColor="#999"
                    value={customColor}
                    onChangeText={setCustomColor}
                    maxLength={7}
                  />
                  <TouchableOpacity
                    style={styles.customColorButton}
                    onPress={handleCustomColor}
                  >
                    <Text style={styles.customColorButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowAvatarModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
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
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePictureButton: {
    padding: 8,
  },
  changePictureText: {
    color: '#2a9d8f',
    fontSize: 16,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCurrency: {
    backgroundColor: '#2a9d8f',
    borderColor: '#2a9d8f',
  },
  currencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCurrencyText: {
    color: '#fff',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  deleteCategoryButton: {
    padding: 4,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addCategoryText: {
    color: '#2a9d8f',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2a9d8f',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#2a9d8f',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  colorPickerButton: {
    padding: 4,
    marginLeft: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 40,
  },
  initialsText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  avatarTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  avatarTypeButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    width: '30%',
  },
  selectedAvatarType: {
    backgroundColor: '#2a9d8f',
  },
  avatarTypeText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  selectedAvatarTypeText: {
    color: '#fff',
  },
  emojiPreview: {
    fontSize: 24,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  emojiCategories: {
    marginBottom: 16,
  },
  emojiCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeEmojiCategory: {
    backgroundColor: '#2a9d8f',
  },
  emojiCategoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeEmojiCategoryText: {
    color: '#fff',
  },
  customColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  customColorInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
    color: '#333',
  },
  customColorButton: {
    backgroundColor: '#2a9d8f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  customColorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  emojiOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
  },
});

export default UserProfileScreen; 