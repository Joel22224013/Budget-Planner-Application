import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const THEMES = {
  default: {
    name: 'Default',
    colors: [
      '#2a9d8f', // Teal
      '#4a90e2', // Blue
      '#e76f51', // Coral
      '#f4a261', // Orange
      '#2ecc71', // Green
      '#9b59b6', // Purple
    ],
  },
  pastel: {
    name: 'Pastel',
    colors: [
      '#FFB3BA', // Pastel Pink
      '#BAFFC9', // Pastel Green
      '#BAE1FF', // Pastel Blue
      '#FFFFBA', // Pastel Yellow
      '#FFE4BA', // Pastel Orange
      '#E4BAFF', // Pastel Purple
    ],
  },
  vibrant: {
    name: 'Vibrant',
    colors: [
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
      '#00FFFF', // Cyan
    ],
  },
  earth: {
    name: 'Earth',
    colors: [
      '#8B4513', // Brown
      '#228B22', // Forest Green
      '#DEB887', // Burlywood
      '#D2691E', // Chocolate
      '#556B2F', // Dark Olive Green
      '#BC8F8F', // Rosy Brown
    ],
  },
};

const ColorPicker = ({ selectedColor, onSelectColor }) => {
  const [activeTheme, setActiveTheme] = useState('default');

  const handleThemeChange = (themeName) => {
    setActiveTheme(themeName);
    onSelectColor(THEMES[themeName].colors[0]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chart Colors</Text>
      
      {/* Theme Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
        <View style={styles.themeList}>
          {Object.keys(THEMES).map((themeName) => (
            <TouchableOpacity
              key={themeName}
              style={[
                styles.themeButton,
                activeTheme === themeName && styles.activeTheme,
              ]}
              onPress={() => handleThemeChange(themeName)}
            >
              <Text style={[
                styles.themeText,
                activeTheme === themeName && styles.activeThemeText,
              ]}>
                {THEMES[themeName].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Color Selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
        <View style={styles.colorList}>
          {THEMES[activeTheme].colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColor,
              ]}
              onPress={() => onSelectColor(color)}
            >
              {selectedColor === color && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  themeScroll: {
    marginBottom: 16,
  },
  themeList: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTheme: {
    backgroundColor: '#2a9d8f',
    borderColor: '#2a9d8f',
  },
  themeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeThemeText: {
    color: '#fff',
  },
  colorScroll: {
    marginTop: 8,
  },
  colorList: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
    transform: [{ scale: 1.1 }],
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ColorPicker; 