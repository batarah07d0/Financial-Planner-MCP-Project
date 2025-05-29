/**
 * Mock untuk RNMapsAirModule
 * Ini membantu mengatasi masalah "RNMapsAirModule could not be found"
 */

// Buat objek dummy untuk RNMapsAirModule
const RNMapsAirModule = {
  // Implementasi dummy untuk fungsi yang diperlukan
  createMapView: () => {},
  createMarker: () => {},
  createPolyline: () => {},
  createPolygon: () => {},
  createCircle: () => {},
  createCallout: () => {},
  enableLatestRenderer: () => {},
  animateToRegion: () => {},
  animateToCoordinate: () => {},
  fitToElements: () => {},
  fitToSuppliedMarkers: () => {},
  fitToCoordinates: () => {},
  setMapBoundaries: () => {},
  takeSnapshot: () => {},
  pointForCoordinate: () => {},
  coordinateForPoint: () => {},
  getMarkersFrames: () => {},
  addressForCoordinate: () => {},
  clearMapCache: () => {},
};

// Ekspor modul
module.exports = RNMapsAirModule;
