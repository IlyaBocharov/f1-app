# F1 App - Article WebView Implementation

This React Native app now includes an in-app WebView article reader that allows users to read news articles without leaving the app.

## Features Implemented

### ArticleWebView Screen
- **Full-screen in-app WebView** for reading articles
- **Progress bar** showing loading progress (0-100%)
- **Loading indicator** with centered activity indicator
- **Error handling** with retry and external browser options
- **URL validation** - only allows http/https schemes
- **Navigation state tracking** - tracks current URL and back navigation capability

### Header Controls
- **Left button**: 
  - Shows "← Back" if WebView can go back
  - Shows "✕ Close" if at the root page
- **Right actions**:
  - **Reload** (↻): Refreshes the current page
  - **Share** (📤): Opens native share sheet
  - **Open in Browser** (🌐): Opens article in external browser

### Navigation
- **Stack navigation** with proper routing
- **Hardware back button support** for Android
- **Safe area handling** for different device sizes
- **Route parameters**: `{ url, title?, source? }`

### Security Features
- **URL scheme validation** - blocks non-http/https URLs
- **WebView sandboxing** with proper permissions
- **Error boundary** for failed loads

## Technical Implementation

### Dependencies Added
```bash
npm install react-native-webview expo-linking @react-navigation/stack
```

### Navigation Structure
```
App (Stack Navigator)
├── MainTabs (Tab Navigator)
│   ├── Home (Material Top Tabs)
│   │   ├── Top News
│   │   ├── Latest News
│   │   └── My Teams News
│   ├── RaceHub
│   ├── Standings
│   └── Settings
└── ArticleWebView (Modal/Stack)
```

### Key Components

#### ArticleWebView.tsx
- WebView with progress tracking
- Error handling and retry logic
- Header with navigation controls
- Source pill display
- Hardware back button support

#### NewsList.tsx
- Updated to navigate to ArticleWebView
- URL validation before navigation
- Maintains existing pull-to-refresh behavior

#### App.tsx
- Stack navigator configuration
- Tab navigator integration
- Proper screen registration

## Usage

### Opening Articles
1. Navigate to any news tab (Top, Latest, My Teams)
2. Tap on a news card
3. Article opens in full-screen WebView
4. Use header controls for navigation and actions

### Navigation Controls
- **Back/Close**: Navigate within WebView or close screen
- **Reload**: Refresh current page
- **Share**: Share article via native share sheet
- **Open in Browser**: View in external browser

### Error Handling
- **Network errors**: Shows retry and external browser options
- **Invalid URLs**: Blocked with error message
- **Load failures**: Graceful fallback with retry option

## Styling

### Theme
- **Dark theme** with consistent color scheme
- **Progress bar**: Blue accent color (#007AFF)
- **Header**: Dark gray (#1a1a1a) with blue accents
- **Error states**: Red accents for error messages

### Layout
- **Full-screen WebView** with proper safe areas
- **Fixed header** with action buttons
- **Overlay loading** and error states
- **Source pill** in bottom-right corner

## Platform Support

### iOS
- WebView with native Safari engine
- Gesture navigation support
- Safe area handling

### Android
- Hardware back button support
- WebView with Chromium engine
- Edge-to-edge display support

## Testing Checklist

### Functionality
- [ ] News cards navigate to WebView
- [ ] Progress bar shows loading progress
- [ ] Error states display correctly
- [ ] Header actions work (reload, share, external)
- [ ] Back navigation works properly
- [ ] URL validation blocks invalid schemes

### Platform Testing
- [ ] iOS: WebView loads articles correctly
- [ ] Android: Hardware back button works
- [ ] Both: Safe areas respected
- [ ] Both: Error handling works

### UX Testing
- [ ] Loading states are smooth
- [ ] Progress bar animates correctly
- [ ] Error recovery works
- [ ] Navigation feels natural

## Future Enhancements

### Potential Improvements
- **Offline caching** for articles
- **Reading mode** with simplified layout
- **Font size controls** for accessibility
- **Dark/light theme toggle**
- **Article bookmarking**
- **Reading progress tracking**

### Performance Optimizations
- **WebView preloading** for better UX
- **Image optimization** for faster loading
- **Memory management** for long articles
- **Background loading** for better performance

## Troubleshooting

### Common Issues
1. **WebView not loading**: Check URL validity and network
2. **Navigation issues**: Verify route parameters
3. **Performance problems**: Check WebView configuration
4. **Platform differences**: Test on both iOS and Android

### Debug Tips
- Use React Native Debugger for WebView inspection
- Check console logs for navigation events
- Verify URL schemes in navigation params
- Test with various article URLs

## Contributing

When adding new features to the WebView:
1. Maintain consistent styling with existing theme
2. Test on both iOS and Android
3. Handle error cases gracefully
4. Update navigation types if needed
5. Document new functionality

---

This implementation provides a robust, user-friendly in-app article reading experience while maintaining the app's existing functionality and design consistency.
