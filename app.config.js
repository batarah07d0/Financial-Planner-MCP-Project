module.exports = {
  expo: {
    name: "Financial-Planner-MCP-Project",
    slug: "Financial-Planner-MCP-Project",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-location",
        {}
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Aplikasi memerlukan akses ke kamera Anda untuk fitur pemindaian barcode dan struk."
        }
      ],
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "Aplikasi memerlukan akses ke kamera Anda untuk fitur pemindaian barcode."
        }
      ],
      [
        "expo-media-library",
        {}
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Aplikasi memerlukan akses ke galeri foto Anda untuk memilih gambar.",
          "cameraPermission": "Aplikasi memerlukan akses ke kamera Anda untuk mengambil foto."
        }
      ],
      [
        "expo-file-system",
        {}
      ],
      [
        "expo-sensors",
        {}
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": [
            "./assets/notification-sound.wav"
          ]
        }
      ],
      [
        "expo-local-authentication",
        {}
      ],
      "expo-sqlite"
    ],
    // Tambahkan konfigurasi untuk menangani polyfills
    extra: {
      eas: {
        projectId: "your-project-id"
      },
      enablePolyfills: true
    }
  }
};
