import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
  BackHandler,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '../types';

type ArticleWebViewRouteProp = RouteProp<RootStackParamList, 'ArticleWebView'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ArticleWebView() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ArticleWebViewRouteProp>();
  const { url, title, source } = route.params;
  
  const webViewRef = useRef<WebView>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior (close screen)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [canGoBack]);

  const handleLoadProgress = useCallback((event: any) => {
    setLoadingProgress(event.nativeEvent.progress);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setLoadingProgress(1);
  }, []);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCurrentUrl(navState.url);
    setCanGoBack(navState.canGoBack);
  }, []);

  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    const { url: requestUrl } = request;
    
    // Only allow http/https schemes
    if (!requestUrl.startsWith('http://') && !requestUrl.startsWith('https://')) {
      return false;
    }
    
    return true;
  }, []);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'Failed to load article');
    setIsLoading(false);
  }, []);

  const handleBackPress = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      navigation.goBack();
    }
  }, [canGoBack, navigation]);

  const handleReload = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${title || 'Article'}\n\n${currentUrl}`,
        url: currentUrl,
        title: title || 'Article',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
    }
  }, [currentUrl, title]);

  const handleOpenInBrowser = useCallback(async () => {
    try {
      await Linking.openURL(currentUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to open in browser');
    }
  }, [currentUrl]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>
            {canGoBack ? '← Back' : '✕ Close'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Article'}
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleReload} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenInBrowser} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>🌐</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      {loadingProgress < 1 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${loadingProgress * 100}%` }]} />
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to Load Article</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity onPress={handleRetry} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenInBrowser} style={styles.errorButton}>
              <Text style={styles.errorButtonText}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
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
      />

      {/* Source Pill */}
      {source && (
        <View style={styles.sourcePill}>
          <Text style={styles.sourceText}>{source}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressContainer: {
    height: 2,
    backgroundColor: '#333',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
    zIndex: 1000,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#999',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sourcePill: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
