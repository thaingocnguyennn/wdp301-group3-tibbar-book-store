export default {
  expo: {
    name: "tibbar-bookstore",
    slug: "tibbar-bookstore",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    updates: {
      fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:5000",
    },
  },
};
