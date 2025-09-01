import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRouteTree } from '@nav/RootNavigation';

export default function SettingsScreen() {
  const handleClearCache = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@reader_font_size',
        '@reader_theme',
      ]);
      Alert.alert('Success', 'Reader preferences cleared successfully');
    } catch (error) {
      console.log('Failed to clear cache:', error);
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  const handleDumpRouteTree = () => {
    const routeTree = getRouteTree();
    if (routeTree) {
      console.log('[SETTINGS] Route tree:', JSON.stringify(routeTree, null, 2));
      Alert.alert('Route Tree Dumped', 'Check console for navigation structure');
    } else {
      Alert.alert('Navigation Not Ready', 'Navigation ref is not ready yet');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading Experience</Text>
        
        <Text style={styles.settingDescription}>
          Articles now open in a full-screen modal with Reader Mode by default. 
          If parsing fails, it automatically switches to WebView.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Storage</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleClearCache}>
          <Text style={styles.buttonText}>Clear Reader Preferences</Text>
        </TouchableOpacity>
        
        <Text style={styles.cacheDescription}>
          This will reset font size and theme preferences for the article reader
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        
        <TouchableOpacity style={[styles.button, styles.debugButton]} onPress={handleDumpRouteTree}>
          <Text style={styles.buttonText}>Dump Route Tree</Text>
        </TouchableOpacity>
        
        <Text style={styles.debugDescription}>
          Dumps the current navigation structure to console for debugging
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.versionText}>F1 App v1.0.0</Text>
        <Text style={styles.description}>
          Formula 1 news and updates with enhanced reading experience
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  debugButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cacheDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.4,
    textAlign: 'center',
  },
  debugDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.4,
    textAlign: 'center',
  },
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 1.4,
  },
});
