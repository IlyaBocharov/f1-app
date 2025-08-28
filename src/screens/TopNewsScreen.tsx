import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../components/Card';

export default function TopNewsScreen() {
  const handleCardPress = () => {
    console.log('Card pressed');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.placeholder}>Top News</Text>
      
      {/* Sample cards */}
      <Card
        title="Hamilton Secures Pole Position for Monaco Grand Prix"
        source="F1.com"
        publishedAt={new Date()}
        onPress={handleCardPress}
      />
      
      <Card
        title="Verstappen Sets New Lap Record at Silverstone"
        source="ESPN F1"
        publishedAt={new Date(Date.now() - 86400000)} // 1 day ago
        onPress={handleCardPress}
      />
      
      <Card
        title="Ferrari Announces New Technical Director"
        source="Autosport"
        publishedAt={new Date(Date.now() - 172800000)} // 2 days ago
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
