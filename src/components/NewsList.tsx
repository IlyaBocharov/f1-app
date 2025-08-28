import React from "react";
import { View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Card from "./Card";
import { fetchNews } from "../services/newsApi";

type Props = { mode: "balanced" | "recent"; q?: string };

export default function NewsList({ mode, q }: Props) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["news", { mode, q }],
    queryFn: () => fetchNews({ mode, q }),
    staleTime: 5 * 60 * 1000,
  });

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
          <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
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
