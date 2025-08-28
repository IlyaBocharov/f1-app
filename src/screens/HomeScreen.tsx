import React from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Card from '../components/Card';

// Фейковая функция загрузки новостей
async function fetchNews() {
  // Здесь будет запрос к нашему API (позже)
  // пока возвращаем заглушку
  return [
    { id: '1', title: 'Formula 1 2025 season kicks off!', source: 'Autosport', publishedAt: new Date().toISOString() },
    { id: '2', title: 'Verstappen dominates opening race', source: 'Motorsport', publishedAt: new Date().toISOString() },
    { id: '3', title: 'FIA announces new regulations', source: 'FIA', publishedAt: new Date().toISOString() },
  ];
}

export default function HomeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['news'],
    queryFn: fetchNews,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={{ flex: 1, textAlign: 'center' }}>Error loading news</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => {}}>
            <Card title={item.title} source={item.source} publishedAt={item.publishedAt} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
});
