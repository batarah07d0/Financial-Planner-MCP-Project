// Konfigurasi untuk Maps dengan styling yang indah
export const MAPS_CONFIG = {
  // Default region (Jakarta, Indonesia)
  DEFAULT_REGION: {
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },

  // Provider configuration - menggunakan default untuk kompatibilitas terbaik
  PROVIDER: undefined, // Default provider: iOS = Apple Maps, Android = Google Maps

  // Map settings untuk performance dan visual yang indah
  SETTINGS: {
    showsUserLocation: true,
    showsMyLocationButton: false,
    showsCompass: true,
    showsScale: true,
    showsBuildings: true,
    showsTraffic: false,
    showsIndoors: true,
    rotateEnabled: true,
    zoomEnabled: true,
    scrollEnabled: true,
    pitchEnabled: true,
    loadingEnabled: true,
    mapType: 'standard' as const,
    cacheEnabled: true,
    minZoomLevel: 3,
    maxZoomLevel: 20,
  },

  // Custom Map Styles untuk tampilan yang lebih indah
  CUSTOM_STYLES: {
    // Style modern dengan warna soft
    MODERN_LIGHT: [
      {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#f5f5f5"
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.icon",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#616161"
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#f5f5f5"
          }
        ]
      },
      {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#bdbdbd"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#eeeeee"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#e5f5e5"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#4caf50"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#ffffff"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#dadada"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#616161"
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#9e9e9e"
          }
        ]
      },
      {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#e5e5e5"
          }
        ]
      },
      {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#eeeeee"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#c9e2f7"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#2196f3"
          }
        ]
      }
    ],

    // Style dark mode yang elegan
    DARK_MODE: [
      {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#212121"
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [
          {
            "color": "#212121"
          }
        ]
      },
      {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#181818"
          }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#263c3f"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#2c2c2c"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#8a8a8a"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#373737"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#3c3c3c"
          }
        ]
      },
      {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#4e4e4e"
          }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#616161"
          }
        ]
      },
      {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#757575"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#000000"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#3d3d3d"
          }
        ]
      }
    ]
  },

  // Timeout settings
  TIMEOUTS: {
    MAP_LOADING: 5000, // 5 seconds
    LOCATION_REQUEST: 10000, // 10 seconds
    ADDRESS_GEOCODING: 8000, // 8 seconds
  },

  // Zoom levels untuk berbagai kebutuhan
  ZOOM: {
    WORLD: {
      latitudeDelta: 180,
      longitudeDelta: 360,
    },
    COUNTRY: {
      latitudeDelta: 10,
      longitudeDelta: 10,
    },
    CITY: {
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
    NEIGHBORHOOD: {
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    },
    STREET: {
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    },
    BUILDING: {
      latitudeDelta: 0.001,
      longitudeDelta: 0.001,
    },
  },

  // Styling untuk marker yang indah
  MARKER_STYLES: {
    DEFAULT: {
      size: 40,
      color: '#3B82F6',
      borderColor: '#FFFFFF',
      borderWidth: 3,
      shadowColor: '#000000',
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    SELECTED: {
      size: 50,
      color: '#EF4444',
      borderColor: '#FFFFFF',
      borderWidth: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.5,
      shadowRadius: 8,
    },
    USER_LOCATION: {
      size: 20,
      color: '#10B981',
      borderColor: '#FFFFFF',
      borderWidth: 2,
      shadowColor: '#000000',
      shadowOpacity: 0.4,
      shadowRadius: 4,
    },
  },

  // Animation settings
  ANIMATIONS: {
    REGION_CHANGE_DURATION: 1000,
    MARKER_ANIMATION_DURATION: 300,
    ZOOM_ANIMATION_DURATION: 500,
  },
};

// Fungsi untuk mendapatkan region berdasarkan koordinat
export const getRegionFromCoordinates = (
  latitude: number,
  longitude: number,
  zoomLevel: keyof typeof MAPS_CONFIG.ZOOM = 'NEIGHBORHOOD'
) => ({
  latitude,
  longitude,
  ...MAPS_CONFIG.ZOOM[zoomLevel],
});

// Fungsi untuk validasi koordinat
export const isValidCoordinate = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

// Fungsi untuk menghitung jarak antara dua koordinat (dalam meter)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Fungsi untuk format koordinat untuk display
export const formatCoordinates = (latitude: number, longitude: number): string => {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(latitude).toFixed(6)}°${latDirection}, ${Math.abs(longitude).toFixed(6)}°${lonDirection}`;
};
