
/**
 * Gets the current geolocation of the user
 * @returns Promise with coordinates or error
 */
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

/**
 * Format coordinates to a readable string
 * @param coords Coordinates from geolocation API
 * @returns Formatted string with latitude and longitude
 */
export const formatCoordinates = (coords: GeolocationCoordinates): string => {
  const latitude = coords.latitude.toFixed(6);
  const longitude = coords.longitude.toFixed(6);
  return `${latitude}, ${longitude}`;
};

/**
 * Get a complete location data object with coordinates and timestamp
 * @returns Promise with location data object
 */
export const getLocationData = async (): Promise<{
  latitude: number;
  longitude: number;
  timestamp: string;
  formatted: string;
}> => {
  try {
    const position = await getCurrentLocation();
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp).toISOString(),
      formatted: formatCoordinates(position.coords)
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return {
      latitude: 0,
      longitude: 0,
      timestamp: new Date().toISOString(),
      formatted: "Localização não disponível"
    };
  }
};
