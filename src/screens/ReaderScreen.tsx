import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Dimensions,
  InteractionManager
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RenderHTML } from 'react-native-render-html';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RootNavigation from '@nav/RootNavigation';
import { RootStackParamList, ReaderContent } from '../types';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'ArticleReader'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const FONT_SIZE_KEY = '@reader_font_size';
const THEME_KEY = '@reader_theme';
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 22;

export default function ReaderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReaderScreenRouteProp>();
  const { url, title, source } = route.params;
  
  const [content, setContent] = useState<ReaderContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  // Fetch reader content
  useEffect(() => {
    fetchReaderContent();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url]);

  const loadPreferences = async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      
      if (savedFontSize) {
        setFontSize(parseInt(savedFontSize, 10));
      }
      if (savedTheme) {
        setIsDarkTheme(savedTheme === 'dark');
      }
    } catch (error) {
      console.log('Failed to load preferences:', error);
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

  const fetchReaderContent = async () => {
    if (!url || !url.startsWith('http')) {
      fallbackToWebView();
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Use a timeout of 8 seconds
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 8000);

      const response = await fetch(`https://f1-api-ten.vercel.app/api/reader?url=${encodeURIComponent(url)}`, {
        signal: abortControllerRef.current.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.contentHtml && data.title) {
        setContent(data);
        setIsLoading(false);
      } else {
        throw new Error('Invalid content received');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request timed out
        setError('Request timed out');
      } else {
        console.log('Reader fetch failed:', error);
        setError(error.message || 'Failed to load article');
      }
      
      // Auto-fallback to WebView after a short delay
      setTimeout(() => {
        fallbackToWebView();
      }, 2000);
    }
  };

  const fallbackToWebView = () => {
    console.log('[ReaderScreen] Fallback to WebView with params:', { url, title, source });
    // Use global navigation ref for consistent behavior
    RootNavigation.navigate('ArticleWebView', { url, title, source });
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title || 'Article'}\n\n${url}`,
        url: url,
        title: title || 'Article',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share article');
    }
  };

  const handleOpenOriginal = () => {
    console.log('[ReaderScreen] Opening original in WebView with params:', { url, title, source });
    // Use global navigation ref for consistent behavior
    RootNavigation.navigate('ArticleWebView', { url, title, source });
  };

  const handleLinkPress = (href: string) => {
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      // Open external links in browser
      // Note: You'll need to implement this with expo-linking
      console.log('Opening external link:', href);
    }
  };

  // HTML renderer config
  const renderersProps = {
    a: {
      onPress: (event: any, href: string) => handleLinkPress(href),
    },
  };

  const tagsStyles = {
    body: {
      fontSize: fontSize,
      color: isDarkTheme ? '#ffffff' : '#000000',
      lineHeight: 1.6,
      paddingHorizontal: 16,
    },
    h1: {
      fontSize: fontSize + 8,
      fontWeight: 'bold' as const,
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginVertical: 16,
    },
    h2: {
      fontSize: fontSize + 6,
      fontWeight: 'bold' as const,
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginVertical: 14,
    },
    h3: {
      fontSize: fontSize + 4,
      fontWeight: 'bold' as const,
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginVertical: 12,
    },
    h4: {
      fontSize: fontSize + 4,
      fontWeight: 'bold' as const,
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginVertical: 10,
    },
    p: {
      fontSize: fontSize,
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginVertical: 8,
      lineHeight: 1.6,
    },
    blockquote: {
      fontSize: fontSize,
      color: isDarkTheme ? '#cccccc' : '#666666',
      fontStyle: 'italic' as const,
      borderLeftWidth: 4,
      borderLeftColor: isDarkTheme ? '#007AFF' : '#007AFF',
      paddingLeft: 16,
      marginVertical: 12,
    },
    ul: {
      marginVertical: 8,
    },
    ol: {
      marginVertical: 8,
    },
    li: {
      fontSize: fontSize,
      color: isDarkTheme ? '#ffffff' : '#000000',
      marginVertical: 4,
    },
    img: {
      maxWidth: '100%',
      height: 'auto',
      marginVertical: 12,
      borderRadius: 8,
    },
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkTheme ? '#000000' : '#ffffff' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: isDarkTheme ? '#ffffff' : '#000000' }]}>
            Loading article...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkTheme ? '#000000' : '#ffffff' }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorTitle, { color: isDarkTheme ? '#ffffff' : '#000000' }]}>
            Failed to Load Article
          </Text>
          <Text style={[styles.errorMessage, { color: isDarkTheme ? '#cccccc' : '#666666' }]}>
            {error}
          </Text>
          <Text style={[styles.fallbackMessage, { color: isDarkTheme ? '#007AFF' : '#007AFF' }]}>
            Opening in WebView...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    fallbackToWebView();
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkTheme ? '#000000' : '#ffffff' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkTheme ? '#1a1a1a' : '#f5f5f5' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: '#007AFF' }]}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: isDarkTheme ? '#ffffff' : '#000000' }]} numberOfLines={1}>
          Reader
        </Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: '#007AFF' }]}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenOriginal} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: '#007AFF' }]}>🌐</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reader Controls */}
      <View style={[styles.controls, { backgroundColor: isDarkTheme ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.fontControls}>
          <TouchableOpacity 
            onPress={() => handleFontSizeChange(-1)} 
            style={[styles.fontButton, fontSize <= MIN_FONT_SIZE && styles.disabledButton]}
            disabled={fontSize <= MIN_FONT_SIZE}
          >
            <Text style={[styles.fontButtonText, { color: '#007AFF' }]}>A-</Text>
          </TouchableOpacity>
          <Text style={[styles.fontSizeText, { color: isDarkTheme ? '#ffffff' : '#000000' }]}>
            {fontSize}pt
          </Text>
          <TouchableOpacity 
            onPress={() => handleFontSizeChange(1)} 
            style={[styles.fontButton, fontSize >= MAX_FONT_SIZE && styles.disabledButton]}
            disabled={fontSize >= MAX_FONT_SIZE}
          >
            <Text style={[styles.fontButtonText, { color: '#007AFF' }]}>A+</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleThemeToggle} style={styles.themeButton}>
          <Text style={[styles.themeButtonText, { color: '#007AFF' }]}>
            {isDarkTheme ? '☀️' : '🌙'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Article Content */}
      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={styles.contentWrapper}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={styles.articleHeader}>
          <Text style={[styles.articleTitle, { color: isDarkTheme ? '#ffffff' : '#000000' }]}>
            {content.title}
          </Text>
          
          {content.byline && (
            <Text style={[styles.articleByline, { color: isDarkTheme ? '#cccccc' : '#666666' }]}>
              {content.byline}
            </Text>
          )}
          
          {content.source && (
            <Text style={[styles.articleSource, { color: isDarkTheme ? '#007AFF' : '#007AFF' }]}>
              {content.source}
            </Text>
          )}
          
          {content.publishedAt && (
            <Text style={[styles.articleDate, { color: isDarkTheme ? '#999999' : '#999999' }]}>
              {new Date(content.publishedAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Lead Image */}
        {content.leadImageUrl && (
          <View style={styles.leadImageContainer}>
            <Text style={[styles.imageCaption, { color: isDarkTheme ? '#cccccc' : '#666666' }]}>
              Lead image
            </Text>
          </View>
        )}

        {/* Article Body */}
        <View style={styles.articleBody}>
          <RenderHTML
            contentWidth={Dimensions.get('window').width - 32}
            source={{ html: content.contentHtml }}
            tagsStyles={tagsStyles}
            renderersProps={renderersProps}
            baseStyle={{
              fontSize: fontSize,
              color: isDarkTheme ? '#ffffff' : '#000000',
              backgroundColor: 'transparent',
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fontButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  fontButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  fontSizeText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  themeButtonText: {
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
  },
  contentWrapper: {
    paddingBottom: 32,
  },
  articleHeader: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 1.3,
  },
  articleByline: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  articleSource: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  articleDate: {
    fontSize: 14,
  },
  leadImageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  imageCaption: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  articleBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  fallbackMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
});
