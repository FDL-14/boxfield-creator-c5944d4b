
/**
 * Utility functions for geolocation
 */
import { useToast } from "@/hooks/use-toast";

/**
 * Get current location data
 * @returns Promise with location data
 */
export const getLocationData = async () => {
  try {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      return {
        latitude: 0,
        longitude: 0,
        formatted: "Geolocalização não disponível no navegador"
      };
    }

    // Get current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    });

    const { latitude, longitude, accuracy } = position.coords;
    
    // Return coordinates as formatted string
    return {
      latitude,
      longitude,
      accuracy,
      formatted: `Longitude: ${longitude.toFixed(6)}, Latitude: ${latitude.toFixed(6)}`
    };
  } catch (error) {
    console.error("Geolocation error:", error);
    return {
      latitude: 0,
      longitude: 0,
      accuracy: null,
      formatted: "Não foi possível obter sua localização"
    };
  }
};

/**
 * Get location data with retry mechanism
 * @param maxRetries Maximum number of retries
 * @returns Promise with location data
 */
export const getLocationWithRetry = async (maxRetries = 3): Promise<any> => {
  let retries = 0;
  let lastError = null;
  
  while (retries < maxRetries) {
    try {
      const locationData = await getLocationData();
      
      // Add additional fields
      const timestamp = new Date().toISOString();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${locationData.latitude},${locationData.longitude}`;
      
      // Format DMS (Degrees, Minutes, Seconds)
      const latDMS = formatDMS(locationData.latitude, true);
      const lonDMS = formatDMS(locationData.longitude, false);
      
      return {
        ...locationData,
        timestamp,
        mapsUrl,
        dmsFormatted: `${lonDMS}, ${latDMS}`,
        accuracy: locationData.accuracy
      };
    } catch (error) {
      lastError = error;
      retries++;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  // All retries failed
  throw lastError || new Error("Failed to get location after multiple attempts");
};

/**
 * Format coordinates to DMS (Degrees, Minutes, Seconds)
 * @param coordinate Coordinate value
 * @param isLatitude Whether the coordinate is latitude
 * @returns Formatted DMS string
 */
const formatDMS = (coordinate: number, isLatitude: boolean): string => {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  
  const direction = isLatitude
    ? coordinate >= 0 ? "N" : "S"
    : coordinate >= 0 ? "E" : "W";
    
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
};
