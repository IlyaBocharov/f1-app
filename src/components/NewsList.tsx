import React from "react";
import { View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Card from "./Card";
import { fetchNews } from "../services/newsApi";
import { RootStackParamList, NewsItem } from "../types";

type Props = { mode: "balanced" | "recent"; q?: string };

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function NewsList({ mode, q }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["news", { mode, q }],
    queryFn: () => fetchNews({ mode, q }),
    staleTime: 5 * 60 * 1000,
  });

  const handleCardPress = (article: NewsItem) => {
    // Ensure the URL is a valid http/https URL
    if (article.link && (article.link.startsWith('http://') || article.link.startsWith('https://'))) {
      navigation.navigate('ArticleWebView', {
        url: article.link,
        title: article.title,
        source: article.source,
      });
    }
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={{ textAlign: "center", marginTop: 16 }}>Error loading news</Text>;
  if (!data?.length) return <Text style={{ textAlign: "center", marginTop: 16 }}>No news found</Text>;

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleCardPress(item)}>
            <Card 
              title={item.title} 
              source={item.source} 
              publishedAt={item.publishedAt}
              image={item.image}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
