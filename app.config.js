export default {
  expo: {
    name: "F1 App",
    slug: "f1-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      readerBaseUrl: process.env.EXPO_PUBLIC_READER_BASE || "http://localhost:3001"
    }
  }
};
