import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { navigationRef, getRouteTree } from '@nav/RootNavigation';

import HomeScreen from './src/screens/HomeScreen';
import RaceHubScreen from './src/screens/RaceHubScreen';
import StandingsScreen from './src/screens/StandingsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ArticleWebView from './src/screens/ArticleWebView';
import ReaderScreen from './src/screens/ReaderScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="RaceHub" component={RaceHubScreen} />
      <Tab.Screen name="Standings" component={StandingsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  // Debug: Log route tree after navigation is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      const routeTree = getRouteTree();
      console.log('[NAV] Route tree after mount:', JSON.stringify(routeTree, null, 2));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Temporary post-mount check for navigation readiness
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[NAV] delayed isReady=', navigationRef.isReady());
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  console.log('App.tsx: Setting up navigation with screens:', {
    MainTabs: 'TabNavigator',
    ArticleWebView: 'ArticleWebView component',
    ArticleReader: 'ReaderScreen component'
  });

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer 
          ref={navigationRef}
          onReady={() => console.log('[NAV] onReady isReady=', navigationRef.isReady())}
        >
          <Stack.Navigator 
            initialRouteName="MainTabs"
            screenOptions={{
              headerShown: false,
              gestureEnabled: true,
            }}
          >
            <Stack.Screen 
              name="MainTabs" 
              component={TabNavigator} 
              options={{ 
                headerShown: false,
                title: 'Main Tabs'
              }}
            />
            <Stack.Screen 
              name="ArticleWebView" 
              component={ArticleWebView}
              options={{ 
                headerShown: false,
                title: 'Article WebView',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="ArticleReader" 
              component={ReaderScreen}
              options={{ 
                headerShown: false,
                title: 'Article Reader',
                presentation: 'modal'
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
