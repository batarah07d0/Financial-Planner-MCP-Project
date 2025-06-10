module.exports = {
  expo: {
    name: "BudgetWise",
    slug: "budgetwise",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/BudgetWiseLogo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/BudgetForSplashandAdaptive.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/BudgetForSplashandAdaptive.png",
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
          "icon": "./assets/BudgetWiseLogo.png",
          "color": "#3B82F6",
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
