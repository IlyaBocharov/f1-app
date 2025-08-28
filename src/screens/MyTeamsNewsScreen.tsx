import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../components/Card';

export default function MyTeamsNewsScreen() {
  const handleCardPress = () => {
    console.log('Card pressed');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.placeholder}>My Teams</Text>
      
      {/* Sample cards */}
      <Card
        title="Ferrari Announces New Engine Partnership"
        source="Ferrari.com"
        publishedAt={new Date()}
        onPress={handleCardPress}
      />
      
      <Card
        title="Mercedes Team Principal Interview: Season Goals"
        source="Mercedes-AMG"
        publishedAt={new Date(Date.now() - 43200000)} // 12 hours ago
        onPress={handleCardPress}
      />
      
      <Card
        title="Red Bull Racing: Behind the Scenes at Factory"
        source="Red Bull Racing"
        publishedAt={new Date(Date.now() - 86400000)} // 1 day ago
        onPress={handleCardPress}
      />
      
      <Card
        title="McLaren Driver Academy: New Talent Announced"
        source="McLaren Racing"
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
