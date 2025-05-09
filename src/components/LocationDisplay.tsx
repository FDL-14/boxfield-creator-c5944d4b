
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Loader2, LocateFixed, Copy, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getLocationWithRetry } from "@/utils/geoUtils";

interface LocationDisplayProps {
  onLocationUpdate?: (location: any) => void;
  initialLocation?: any;
  showRefreshButton?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  onLocationUpdate,
  initialLocation,
  showRefreshButton = true
}) => {
  const { toast } = useToast();
  const [location, setLocation] = useState<any>(initialLocation || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationData = await getLocationWithRetry(3);
      
      setLocation(locationData);
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
      
      toast({
        title: "Localização obtida",
        description: "Sua localização foi determinada com sucesso"
      });
    } catch (err) {
      console.error("Erro ao obter localização:", err);
      setError("Não foi possível obter sua localização. Verifique as permissões do navegador.");
      
      toast({
        title: "Erro",
        description: "Não foi possível obter sua localização",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!initialLocation && !location) {
      fetchLocation();
    }
  }, []);
  
  const handleCopyCoordinates = () => {
    if (location) {
      const coordinates = `${location.latitude}, ${location.longitude}`;
      navigator.clipboard.writeText(coordinates).then(() => {
        toast({
          title: "Coordenadas copiadas",
          description: "Coordenadas copiadas para a área de transferência"
        });
      });
    }
  };
  
  const openInGoogleMaps = () => {
    if (location?.mapsUrl) {
      window.open(location.mapsUrl, '_blank');
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-blue-50 pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span>Localização Geográfica</span>
          </div>
          
          {showRefreshButton && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8" 
              onClick={fetchLocation}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <RefreshCw className="h-4 w-4 text-blue-500" />
              )}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Obtendo localização...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm flex items-start gap-2 w-full">
              <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchLocation} 
                  className="mt-2 border-red-200 text-red-700 hover:bg-red-50"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        ) : location ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="flex gap-1 items-center px-2">
                <LocateFixed className="h-3 w-3 text-green-600" />
                <span className="text-xs">Localização Determinada</span>
              </Badge>
              
              <div className="flex gap-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7" 
                  onClick={handleCopyCoordinates}
                >
                  <Copy className="h-3.5 w-3.5 text-gray-500" />
                </Button>
                
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7" 
                  onClick={openInGoogleMaps}
                >
                  <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Latitude:</div>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100">
                    {location.latitude}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">Longitude:</div>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100">
                    {location.longitude}
                  </div>
                </div>
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="link" size="sm" className="text-xs px-0 h-auto">
                  Ver detalhes completos
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Detalhes da Localização</h4>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Latitude:</span>
                      <span className="font-mono">{location.latitude}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Longitude:</span>
                      <span className="font-mono">{location.longitude}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Formato DMS:</span>
                      <span className="font-mono">{location.dmsFormatted}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Endereço:</span>
                      <span className="font-mono text-right flex-1 ml-2">{location.formatted}</span>
                    </div>
                    
                    {location.accuracy && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precisão:</span>
                        <span className="font-mono">{location.accuracy}m</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Data/Hora:</span>
                      <span className="font-mono">
                        {new Date(location.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCopyCoordinates}
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </Button>
                    
                    <Button 
                      size="sm" 
                      onClick={openInGoogleMaps}
                      className="h-7 text-xs"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Abrir no Mapa
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Button 
              variant="outline" 
              onClick={fetchLocation} 
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Obter Localização
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationDisplay;
