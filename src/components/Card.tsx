import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type CardProps = {
  title: string;
  source: string;
  publishedAt: string;
  image?: string;
};

export default function Card({ title, source, publishedAt, image }: CardProps) {
  return (
    <View style={styles.card}>
      {image && (
        <Image 
          source={{ uri: image }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{source} • {new Date(publishedAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  content: {
    padding: 12,
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4 
  },
  meta: { 
    fontSize: 12, 
    color: '#555' 
  },
});
