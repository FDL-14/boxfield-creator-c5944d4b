
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
      timeout: 10000,
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
 * Convert decimal coordinates to degrees, minutes, seconds format
 * @param coord Decimal coordinate
 * @returns String in DMS format
 */
export const decimalToDMS = (coord: number): string => {
  const absolute = Math.abs(coord);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
  
  return `${degrees}° ${minutes}' ${seconds}"`;
};

/**
 * Get a formatted DMS string for a location (latitude and longitude)
 * @param latitude Decimal latitude
 * @param longitude Decimal longitude
 * @returns Formatted string with latitude and longitude in DMS
 */
export const getFormattedDMSLocation = (latitude: number, longitude: number): string => {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const longDir = longitude >= 0 ? 'E' : 'W';
  
  return `${decimalToDMS(latitude)} ${latDir}, ${decimalToDMS(longitude)} ${longDir}`;
};

/**
 * Format coordinates to a Google Maps URL
 * @param coords Coordinates from geolocation API
 * @returns Google Maps URL for the coordinates
 */
export const getGoogleMapsUrl = (coords: GeolocationCoordinates): string => {
  return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
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
  dmsFormatted: string;
  mapsUrl: string;
  accuracy?: number;
}> => {
  try {
    console.log("Tentando obter localização...");
    const position = await getCurrentLocation();
    console.log("Localização obtida:", position);
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp).toISOString(),
      formatted: formatCoordinates(position.coords),
      dmsFormatted: getFormattedDMSLocation(position.coords.latitude, position.coords.longitude),
      mapsUrl: getGoogleMapsUrl(position.coords),
      accuracy: position.coords.accuracy
    };
  } catch (error) {
    console.error("Erro ao obter localização:", error);
    return {
      latitude: 0,
      longitude: 0,
      timestamp: new Date().toISOString(),
      formatted: "Localização não disponível",
      dmsFormatted: "Localização não disponível",
      mapsUrl: ""
    };
  }
};

/**
 * Try to get location data with multiple retries
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with location data
 */
export const getLocationWithRetry = async (maxRetries = 3): Promise<any> => {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      const locationData = await getLocationData();
      if (locationData && locationData.latitude && locationData.longitude) {
        return locationData;
      }
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
    } catch (error) {
      console.error(`Tentativa ${retries + 1} falhou:`, error);
      lastError = error;
      retries++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
    }
  }
  
  console.error(`Falha ao obter localização após ${maxRetries} tentativas.`);
  throw lastError || new Error("Não foi possível obter a localização");
};

