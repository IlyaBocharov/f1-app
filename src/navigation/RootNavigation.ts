import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name, 
  params?: RootStackParamList[Name]
) {
  if (navigationRef.isReady()) {
    console.log('[ROOT-NAV] Navigating to:', name, 'with params:', params);
    (navigationRef as any).navigate(name, params);
  } else {
    console.warn('[ROOT-NAV] not ready');
  }
}

export function getRouteTree() {
  if (navigationRef.isReady()) {
    return navigationRef.getRootState();
  }
  return null;
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function reset(routeName: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  }
}

export function isReady() {
  return navigationRef.isReady();
}
