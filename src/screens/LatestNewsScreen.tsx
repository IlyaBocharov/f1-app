import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../components/Card';

export default function LatestNewsScreen() {
  const handleCardPress = () => {
    console.log('Card pressed');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.placeholder}>Latest News</Text>
      
      {/* Sample cards */}
      <Card
        title="McLaren Reveals New Livery for 2024 Season"
        source="Motorsport.com"
        publishedAt={new Date()}
        onPress={handleCardPress}
      />
      
      <Card
        title="Red Bull Racing Confirms Driver Lineup for Next Year"
        source="F1.com"
        publishedAt={new Date(Date.now() - 3600000)} // 1 hour ago
        onPress={handleCardPress}
      />
      
      <Card
        title="New Safety Regulations Announced by FIA"
        source="Autosport"
        publishedAt={new Date(Date.now() - 7200000)} // 2 hours ago
        onPress={handleCardPress}
      />
      
      <Card
        title="Mercedes Introduces Revolutionary Aero Package"
        source="ESPN F1"
        publishedAt={new Date(Date.now() - 10800000)} // 3 hours ago
        onPress={handleCardPress}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
});
