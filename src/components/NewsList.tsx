import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Text,
  Modal,
  Share,
  Alert,
  Dimensions,
  ScrollView,
  Linking
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { RenderHTML } from "react-native-render-html";
import { WebView, WebViewNavigation } from "react-native-webview";
import Constants from "expo-constants";
import Card from "./Card";
import { fetchNews } from "../services/newsApi";
import { NewsItem, ReaderContent } from "../types";

type Props = { mode: "balanced" | "recent"; q?: string };

const FONT_SIZE_KEY = '@reader_font_size';
const THEME_KEY = '@reader_theme';
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 22;

// Get reader backend URL from environment
const READER_BASE_URL = Constants.expoConfig?.extra?.readerBaseUrl || "http://localhost:3001";

export default function NewsList({ mode, q }: Props) {
  const [selectedArticle, setSelectedArticle] = useState<{
    url: string;
    title?: string;
    source?: string
  } | null>(null);
  const [isReaderFailed, setIsReaderFailed] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["news", { mode, q }],
    queryFn: () => fetchNews({ mode, q }),
    staleTime: 5 * 60 * 1000,
  });

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [savedFontSize, savedTheme] = await Promise.all([
        AsyncStorage.getItem(FONT_SIZE_KEY),
        AsyncStorage.getItem(THEME_KEY),
      ]);

      if (savedFontSize) {
        const size = parseInt(savedFontSize, 10);
        if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
          setFontSize(size);
        }
      }

      if (savedTheme === 'light') {
        setIsDarkTheme(false);
      }
    } catch (error) {
      console.log('Failed to load reader preferences:', error);
    }
  };

  const saveFontSize = async (size: number) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size.toString());
    } catch (error) {
      console.log('Failed to save font size:', error);
    }
  };

  const saveTheme = async (dark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch (error) {
      console.log('Failed to save theme:', error);
    }
  };

  const handleCardPress = (article: NewsItem) => {
    if (article.link && (article.link.startsWith('http://') || article.link.startsWith('https://'))) {
      setSelectedArticle({
        url: article.link,
        title: article.title,
        source: article.source,
      });
      setIsReaderFailed(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
    setIsReaderFailed(false);
  };

  const handleShare = async () => {
    if (!selectedArticle) return;

    try {
      await Share.share({
        message: `${selectedArticle.title || 'Article'}\n\n${selectedArticle.url}`,
        url: selectedArticle.url,
        title: selectedArticle.title || 'Article',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const handleOpenInBrowser = async () => {
    if (!selectedArticle) return;

    try {
      await Linking.openURL(selectedArticle.url);
    } catch (error) {
      Alert.alert('Error', 'Failed to open in browser');
    }
  };

  const handleFontSizeChange = (increment: number) => {
    const newSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize + increment));
    setFontSize(newSize);
    saveFontSize(newSize);
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleLinkPress = (href: string) => {
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      Linking.openURL(href);
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
          <TouchableOpacity
            onPress={() => handleCardPress(item)}
          >
            <Card
              title={item.title}
              source={item.source}
              publishedAt={item.publishedAt}
              image={item.image}
            />
          </TouchableOpacity>
        )}
      />

      {/* Article Modal */}
      <Modal
        visible={!!selectedArticle}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseModal}
      >
        <SafeAreaView style={{
          flex: 1,
          backgroundColor: isDarkTheme ? '#000000' : '#ffffff'
        }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: isDarkTheme ? '#333333' : '#e0e0e0',
            backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
          }}>
            <TouchableOpacity onPress={handleCloseModal} style={{ padding: 8 }}>
              <Text style={{
                fontSize: 24,
                color: isDarkTheme ? '#ffffff' : '#000000',
                fontWeight: 'bold'
              }}>
                ×
              </Text>
            </TouchableOpacity>

            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDarkTheme ? '#ffffff' : '#000000',
              flex: 1,
              textAlign: 'center',
              marginHorizontal: 16
            }}>
              {selectedArticle?.title || 'Article'}
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={handleShare} style={{ padding: 8, marginRight: 8 }}>
                <Text style={{
                  fontSize: 16,
                  color: isDarkTheme ? '#007AFF' : '#007AFF',
                  fontWeight: '500'
                }}>
                  Share
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleOpenInBrowser} style={{ padding: 8 }}>
                <Text style={{
                  fontSize: 16,
                  color: isDarkTheme ? '#007AFF' : '#007AFF',
                  fontWeight: '500'
                }}>
                  Browser
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reader Controls (when not failed) */}
          {!isReaderFailed && (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: isDarkTheme ? '#333333' : '#e0e0e0',
              backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => handleFontSizeChange(-1)}
                  style={{ padding: 8, marginRight: 8 }}
                >
                  <Text style={{
                    fontSize: 18,
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    fontWeight: 'bold'
                  }}>
                    A-
                  </Text>
                </TouchableOpacity>

                <Text style={{
                  fontSize: 14,
                  color: isDarkTheme ? '#ffffff' : '#000000',
                  marginRight: 8
                }}>
                  {fontSize}pt
                </Text>

                <TouchableOpacity
                  onPress={() => handleFontSizeChange(1)}
                  style={{ padding: 8 }}
                >
                  <Text style={{
                    fontSize: 18,
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    fontWeight: 'bold'
                  }}>
                    A+
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleThemeToggle} style={{ padding: 8 }}>
                <Text style={{
                  fontSize: 16,
                  color: isDarkTheme ? '#007AFF' : '#007AFF',
                  fontWeight: '500'
                }}>
                  {isDarkTheme ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Modal Body */}
          <View style={{ flex: 1 }}>
            {!isReaderFailed ? (
              <ArticleReader
                url={selectedArticle?.url || ''}
                onFailure={() => setIsReaderFailed(true)}
                fontSize={fontSize}
                isDarkTheme={isDarkTheme}
                onLinkPress={handleLinkPress}
              />
            ) : (
              <ArticleWebView
                url={selectedArticle?.url || ''}
                onRetry={() => setIsReaderFailed(false)}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// Article Reader Component
function ArticleReader({
  url,
  onFailure,
  fontSize,
  isDarkTheme,
  onLinkPress
}: {
  url: string;
  onFailure: () => void;
  fontSize: number;
  isDarkTheme: boolean;
  onLinkPress: (href: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url) return;

    // Reset state on article change
    setLoading(true);
    setRetries(0);
    setError(null);
    setHtml(null);

    fetchReaderContent();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url]);

  const fetchReaderContent = async (isRetry = false) => {
    if (!url || !url.startsWith('http')) {
      onFailure();
      return;
    }

    if (isRetry) {
      setRetries(prev => prev + 1);
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 15000); // 15 seconds

      const readerUrl = `${READER_BASE_URL}/reader?url=${encodeURIComponent(url)}`;
      console.log(`[READER] Fetching from: ${readerUrl}`);

      const response = await fetch(readerUrl, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      console.log('[READER] status', response.status, 'ok', data.ok, 'len', data?.contentHtml?.length);

      // Validate response structure and content
      if (data.ok === true && typeof data.contentHtml === 'string' && data.contentHtml.length >= 300) {
        setHtml(data.contentHtml);
        setLoading(false);
        console.log(`[READER] Successfully loaded content: ${data.title || 'Untitled'}`);
        return;
      }

      // Check if we should retry
      if (retries < 1 && (response.status >= 500 || data.reason === 'timeout_or_network')) {
        console.log('[READER] Retrying after error...');
        setTimeout(() => {
          fetchReaderContent(true);
        }, 1000);
        return;
      }

      // No more retries or not retryable error
      console.log('[READER] Falling back to WebView');
      setLoading(false);
      onFailure();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Request timed out');
      } else {
        console.log('Reader fetch failed:', error);
        setError(error.message || 'Failed to load article');
      }

      // Check if we should retry
      if (retries < 1 && (error.message?.includes('5') || error.name === 'AbortError')) {
        console.log('[READER] Retrying after error...');
        setTimeout(() => {
          fetchReaderContent(true);
        }, 1000);
        return;
      }

      // No more retries
      console.log('[READER] Falling back to WebView');
      setLoading(false);
      onFailure();
    }
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkTheme ? '#000000' : '#ffffff'
      }}>
        <ActivityIndicator size="large" color={isDarkTheme ? '#ffffff' : '#000000'} />
        <Text style={{
          marginTop: 16,
          color: isDarkTheme ? '#ffffff' : '#000000',
          fontSize: 16
        }}>
          {retries > 0 ? `Retrying (${retries})...` : 'Loading article...'}
        </Text>
      </View>
    );
  }

  if (error || !html) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkTheme ? '#000000' : '#ffffff'
      }}>
        <Text style={{
          color: isDarkTheme ? '#ffffff' : '#000000',
          fontSize: 16,
          textAlign: 'center',
          marginHorizontal: 32
        }}>
          {error || 'Failed to load article'}
        </Text>
        <Text style={{
          color: isDarkTheme ? '#ffffff' : '#000000',
          fontSize: 14,
          textAlign: 'center',
          marginTop: 16,
          marginHorizontal: 32
        }}>
          Opening original...
        </Text>
      </View>
    );
  }

  const renderersProps = {
    a: {
      onPress: (event: any, href: string) => onLinkPress(href),
    },
  };

  const tagsStyles = {
    body: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize,
      lineHeight: 1.6,
    },
    p: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize,
      lineHeight: 1.6,
      marginBottom: 16,
    },
    h1: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize + 8,
      fontWeight: 'bold' as const,
      marginBottom: 16,
      marginTop: 24,
    },
    h2: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize + 6,
      fontWeight: 'bold' as const,
      marginBottom: 12,
      marginTop: 20,
    },
    h3: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize + 4,
      fontWeight: 'bold' as const,
      marginBottom: 10,
      marginTop: 18,
    },
    h4: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize + 2,
      fontWeight: 'bold' as const,
      marginBottom: 8,
      marginTop: 16,
    },
    ul: {
      marginBottom: 16,
    },
    ol: {
      marginBottom: 16,
    },
    li: {
      color: isDarkTheme ? '#ffffff' : '#000000',
      fontSize: fontSize,
      lineHeight: 1.6,
      marginBottom: 4,
    },
    img: {
      marginVertical: 16,
      borderRadius: 8,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: isDarkTheme ? '#007AFF' : '#007AFF',
      paddingLeft: 16,
      marginVertical: 16,
      fontStyle: 'italic' as const,
    },
    strong: {
      fontWeight: 'bold' as const,
    },
    em: {
      fontStyle: 'italic' as const,
    },
    a: {
      color: isDarkTheme ? '#007AFF' : '#007AFF',
      textDecorationLine: 'underline' as const,
    },
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: isDarkTheme ? '#000000' : '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 20
      }}
      showsVerticalScrollIndicator={false}
    >
      <RenderHTML
        contentWidth={Dimensions.get('window').width - 32}
        source={{ html: html }}
        renderersProps={renderersProps}
        tagsStyles={tagsStyles}
      />
    </ScrollView>
  );
}

// Article WebView Component
function ArticleWebView({ url, onRetry }: { url: string; onRetry: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const isHttpUrl = (u: string): boolean => /^https?:\/\//i.test(u);
  const isDisallowedScheme = (u: string): boolean => /^(about|data|blob|file|javascript):/i.test(u);

  const handleLoadProgress = (event: any) => {
    setProgress(event.nativeEvent.progress);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setWebViewError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    if (isHttpUrl(navState.url)) {
      setCurrentUrl(navState.url);
    }
    setCanGoBack(navState.canGoBack);
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    const { url: requestUrl } = request;
    if (isDisallowedScheme(requestUrl)) {
      return false;
    }
    if (!isHttpUrl(requestUrl)) {
      return false;
    }
    return true;
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setWebViewError(nativeEvent.description || 'Failed to load page');
    setIsLoading(false);
  };

  const handleReload = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleRetry = () => {
    onRetry();
  };

  if (webViewError) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 32,
      }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 24,
        }}>
          {webViewError}
        </Text>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={handleRetry}
            style={{
              backgroundColor: '#007AFF',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              marginRight: 16,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Try Reader
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReload}
            style={{
              backgroundColor: '#34C759',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Progress Bar */}
      {progress < 1 && (
        <View style={{
          height: 3,
          backgroundColor: '#333333',
          width: '100%',
        }}>
          <View style={{
            height: '100%',
            backgroundColor: '#007AFF',
            width: `${progress * 100}%`,
          }} />
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1,
        }}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadProgress={handleLoadProgress}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onError={handleError}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        originWhitelist={['https://*', 'http://*']}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
