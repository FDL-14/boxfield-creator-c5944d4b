
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

    const { latitude, longitude } = position.coords;
    
    // Try to get readable address from coordinates
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      const data = await response.json();
      
      if (data && data.display_name) {
        return {
          latitude,
          longitude,
          formatted: data.display_name
        };
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
    }

    // Return coordinates if address lookup fails
    return {
      latitude,
      longitude,
      formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    };
  } catch (error) {
    console.error("Geolocation error:", error);
    return {
      latitude: 0,
      longitude: 0,
      formatted: "Não foi possível obter sua localização"
    };
  }
};
