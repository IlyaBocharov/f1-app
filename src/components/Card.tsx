import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CardProps = {
  title: string;
  source: string;
  publishedAt: string;
};

export default function Card({ title, source, publishedAt }: CardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>{source} • {new Date(publishedAt).toLocaleDateString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 12, color: '#555' },
});
