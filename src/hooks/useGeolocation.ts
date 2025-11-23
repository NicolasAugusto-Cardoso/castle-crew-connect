import { useState } from 'react';

export type LocationMethod = 'gps' | 'ip' | 'manual';

interface UseGeolocationReturn {
  userLocation: [number, number] | null;
  locationMethod: LocationMethod | null;
  loading: boolean;
  error: string | null;
  getLocationByGPS: () => Promise<void>;
  getLocationByIP: () => Promise<void>;
  setLocationManually: (lat: number, lng: number) => void;
  resetLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationMethod, setLocationMethod] = useState<LocationMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocationByGPS = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada pelo seu navegador');
      throw new Error('Geolocation not supported');
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      setUserLocation([lng, lat]);
      setLocationMethod('gps');
      console.log('✅ Localização GPS obtida:', lat, lng);
    } catch (err: any) {
      console.error('❌ Erro ao obter GPS:', err);
      
      if (err.code === 1) { // PERMISSION_DENIED
        setError('GPS negado');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setError('Localização GPS indisponível');
      } else if (err.code === 3) { // TIMEOUT
        setError('Tempo esgotado ao obter GPS');
      } else {
        setError('Erro ao obter GPS');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLocationByIP = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Obtendo localização por IP...');
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error('Falha na API de IP');
      }

      const data = await response.json();
      
      if (!data.latitude || !data.longitude) {
        throw new Error('Coordenadas não disponíveis');
      }

      const lat = data.latitude;
      const lng = data.longitude;

      setUserLocation([lng, lat]);
      setLocationMethod('ip');
      console.log('✅ Localização por IP obtida:', lat, lng, `(${data.city}, ${data.region})`);
    } catch (err) {
      console.error('❌ Erro ao obter localização por IP:', err);
      setError('Não foi possível obter localização aproximada');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setLocationManually = (lat: number, lng: number) => {
    setUserLocation([lng, lat]);
    setLocationMethod('manual');
    setError(null);
    console.log('✅ Localização manual definida:', lat, lng);
  };

  const resetLocation = () => {
    setUserLocation(null);
    setLocationMethod(null);
    setError(null);
    setLoading(false);
  };

  return {
    userLocation,
    locationMethod,
    loading,
    error,
    getLocationByGPS,
    getLocationByIP,
    setLocationManually,
    resetLocation
  };
}
