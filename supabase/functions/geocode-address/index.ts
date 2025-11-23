import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Função para calcular distância entre dois pontos (em km)
function calculateDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { street, streetNumber, neighborhood, city, state, postalCode } = await req.json();

    // Construir query de endereço
    const addressParts = [];
    if (street && streetNumber) {
      addressParts.push(`${street}, ${streetNumber}`);
    } else if (street) {
      addressParts.push(street);
    }
    if (neighborhood) addressParts.push(neighborhood);
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (postalCode) addressParts.push(postalCode);
    addressParts.push('Brasil');

    const address = addressParts.join(', ');

    if (!address || addressParts.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Endereço insuficiente para geolocalização' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Geocoding address with Mapbox:', address);

    // Mapbox Access Token (público)
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljay0xNyIsImEiOiJjbWlhc2R0NTMwOHNkMm1wdzZ3d250cDZ3In0.29vHKdadYBcdi4ioD_UIuQ';

    // Função auxiliar para tentar geocodificação com Mapbox
    const tryGeocode = async (searchAddress: string, options: { types?: string, proximity?: string, bbox?: string } = {}): Promise<any> => {
      let mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?country=BR&access_token=${MAPBOX_TOKEN}&limit=1`;
      
      // Adicionar parâmetros opcionais
      if (options.types) {
        mapboxUrl += `&types=${options.types}`;
      }
      if (options.proximity) {
        mapboxUrl += `&proximity=${options.proximity}`;
      }
      if (options.bbox) {
        mapboxUrl += `&bbox=${options.bbox}`;
      }
      
      const response = await fetch(mapboxUrl);

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data && data.features && data.features.length > 0 ? data.features[0] : null;
    };

    // Obter coordenadas da cidade primeiro para validação
    let cityLocation = null;
    if (city && state) {
      const cityAddress = `${city}, ${state}, Brasil`;
      console.log('🔍 Obtendo coordenadas da cidade:', cityAddress);
      cityLocation = await tryGeocode(cityAddress, { types: 'place' });
      
      if (cityLocation) {
        const [cityLng, cityLat] = cityLocation.center;
        console.log(`✅ Cidade localizada: ${cityLat}, ${cityLng}`);
      }
    }

    // Estratégia de fallback progressivo
    let location = null;
    
    // Tentar 1: Endereço completo com validação geográfica
    if (cityLocation) {
      const [cityLng, cityLat] = cityLocation.center;
      const proximity = `${cityLng},${cityLat}`;
      const bbox = `${cityLng - 0.5},${cityLat - 0.5},${cityLng + 0.5},${cityLat + 0.5}`; // ~50km bbox
      
      console.log('🔍 Tentativa 1: Endereço completo com bbox');
      location = await tryGeocode(address, { types: 'address,place,poi', proximity, bbox });
      
      // Validar se o resultado está próximo da cidade
      if (location) {
        const [resultLng, resultLat] = location.center;
        const distance = calculateDistance(cityLng, cityLat, resultLng, resultLat);
        console.log(`📍 Distância do resultado à cidade: ${distance.toFixed(2)} km`);
        
        if (distance > 50) {
          console.warn(`⚠️ Resultado muito distante da cidade (${distance.toFixed(2)} km) - ignorando`);
          location = null;
        }
      }
    } else {
      console.log('🔍 Tentativa 1: Endereço completo sem validação');
      location = await tryGeocode(address, { types: 'address,place,poi' });
    }
    
    // Tentar 2: Rua + Cidade + Estado (sem número e bairro)
    if (!location && street && city && state) {
      const streetCityParts = [street, city, state, 'Brasil'];
      const streetCityAddress = streetCityParts.join(', ');
      console.log('🔍 Tentativa 2: Rua + Cidade + Estado:', streetCityAddress);
      
      if (cityLocation) {
        const [cityLng, cityLat] = cityLocation.center;
        const proximity = `${cityLng},${cityLat}`;
        const bbox = `${cityLng - 0.5},${cityLat - 0.5},${cityLng + 0.5},${cityLat + 0.5}`;
        location = await tryGeocode(streetCityAddress, { types: 'address,place', proximity, bbox });
        
        if (location) {
          const [resultLng, resultLat] = location.center;
          const distance = calculateDistance(cityLng, cityLat, resultLng, resultLat);
          if (distance > 50) {
            console.warn(`⚠️ Resultado muito distante (${distance.toFixed(2)} km) - ignorando`);
            location = null;
          }
        }
      } else {
        location = await tryGeocode(streetCityAddress, { types: 'address,place' });
      }
    }
    
    // Tentar 3: Bairro + Cidade + Estado (aproximado)
    if (!location && neighborhood && city && state) {
      const neighborhoodParts = [neighborhood, city, state, 'Brasil'];
      const neighborhoodAddress = neighborhoodParts.join(', ');
      console.log('🔍 Tentativa 3: Bairro + Cidade + Estado:', neighborhoodAddress);
      
      if (cityLocation) {
        const [cityLng, cityLat] = cityLocation.center;
        const proximity = `${cityLng},${cityLat}`;
        const bbox = `${cityLng - 0.5},${cityLat - 0.5},${cityLng + 0.5},${cityLat + 0.5}`;
        location = await tryGeocode(neighborhoodAddress, { types: 'locality,place,poi', proximity, bbox });
        
        if (location) {
          const [resultLng, resultLat] = location.center;
          const distance = calculateDistance(cityLng, cityLat, resultLng, resultLat);
          if (distance > 50) {
            console.warn(`⚠️ Resultado muito distante (${distance.toFixed(2)} km) - ignorando`);
            location = null;
          }
        }
      } else {
        location = await tryGeocode(neighborhoodAddress, { types: 'locality,place,poi' });
      }
    }
    
    // Tentar 4: Apenas cidade e estado (centro da cidade)
    if (!location && cityLocation) {
      console.log('🔍 Tentativa 4: Usar centro da cidade como fallback');
      location = cityLocation;
    }

    if (!location) {
      return new Response(
        JSON.stringify({ 
          error: 'Endereço não encontrado após múltiplas tentativas',
          latitude: null,
          longitude: null 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair coordenadas do Mapbox (formato: [longitude, latitude])
    const [longitude, latitude] = location.center;

    console.log('Geocoded coordinates (Mapbox):', { latitude, longitude, place_name: location.place_name });

    return new Response(
      JSON.stringify({ 
        latitude,
        longitude,
        displayName: location.place_name,
        precision: 'high'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geocode-address:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
