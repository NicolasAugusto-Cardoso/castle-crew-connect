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

// Gera variações do nome da rua para tentar geocoding
function generateStreetVariations(street: string): string[] {
  if (!street) return [];
  
  const variations = [street]; // Original
  
  // Remover pontos (Av. → Av)
  if (street.includes('.')) {
    variations.push(street.replace(/\./g, ''));
  }
  
  // Expandir abreviações
  const abbreviations: { [key: string]: string } = {
    'Av.': 'Avenida',
    'Av': 'Avenida',
    'R.': 'Rua',
    'R': 'Rua',
    'Pç.': 'Praça',
    'Pç': 'Praça',
    'Al.': 'Alameda',
    'Al': 'Alameda',
    'Trav.': 'Travessa',
    'Trav': 'Travessa',
  };
  
  for (const [abbr, full] of Object.entries(abbreviations)) {
    if (street.startsWith(abbr + ' ') || street.startsWith(abbr)) {
      variations.push(street.replace(abbr, full));
    }
  }
  
  // Remover abreviação completamente (Av. República → República)
  const withoutAbbr = street.replace(/^(Av\.?|R\.?|Pç\.?|Al\.?|Trav\.?)\s+/i, '');
  if (withoutAbbr !== street) {
    variations.push(withoutAbbr);
  }
  
  // Remover duplicatas
  return [...new Set(variations)];
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

    if (!cityLocation) {
      console.log('❌ Cidade não encontrada');
      return new Response(
        JSON.stringify({ error: 'Cidade não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const [cityLng, cityLat] = cityLocation.center;

    // Estratégia de fallback progressivo com variações de rua
    let location = null;
    let accuracy: 'exact' | 'approximate' | 'city' = 'city';
    
    // Tentar 1: Endereço completo com variações de rua
    if (street) {
      const streetVariations = generateStreetVariations(street);
      console.log(`🔄 Tentando ${streetVariations.length} variações da rua: ${JSON.stringify(streetVariations)}`);

      for (const streetVar of streetVariations) {
        const fullAddress = [
          streetNumber ? `${streetVar} ${streetNumber}` : streetVar,
          neighborhood,
          city,
          state,
          'Brasil'
        ].filter(Boolean).join(', ');

        console.log(`🔍 Tentativa com variação: ${fullAddress}`);
        
        const proximity = `${cityLng},${cityLat}`;
        const bbox = `${cityLng - 0.5},${cityLat - 0.5},${cityLng + 0.5},${cityLat + 0.5}`;
        
        const testLocation = await tryGeocode(fullAddress, { types: 'address,poi', proximity, bbox });

        if (testLocation) {
          const [resultLng, resultLat] = testLocation.center;
          const distance = calculateDistance(cityLng, cityLat, resultLng, resultLat);
          console.log(`📏 Distância da cidade: ${distance.toFixed(2)} km`);

          if (distance <= 50) {
            location = testLocation;
            accuracy = streetNumber ? 'exact' : 'approximate';
            console.log(`✅ Endereço encontrado com variação: ${streetVar} (${accuracy})`);
            break;
          } else {
            console.warn(`⚠️ Resultado muito distante (${distance.toFixed(2)} km) - ignorando`);
          }
        }
      }
    }
    
    // Tentar 2: Rua + Cidade + Estado (sem número e bairro)
    if (!location && street) {
      console.log('🔄 Tentando sem bairro...');
      const streetVariations = generateStreetVariations(street);

      for (const streetVar of streetVariations) {
        const streetCityAddress = [streetVar, city, state, 'Brasil'].filter(Boolean).join(', ');
        console.log(`🔍 Tentativa sem bairro: ${streetCityAddress}`);
        
        const proximity = `${cityLng},${cityLat}`;
        const bbox = `${cityLng - 0.5},${cityLat - 0.5},${cityLng + 0.5},${cityLat + 0.5}`;
        
        const testLocation = await tryGeocode(streetCityAddress, { types: 'address,place', proximity, bbox });

        if (testLocation) {
          const [resultLng, resultLat] = testLocation.center;
          const distance = calculateDistance(cityLng, cityLat, resultLng, resultLat);

          if (distance <= 50) {
            location = testLocation;
            accuracy = 'approximate';
            console.log(`✅ Endereço encontrado sem bairro: ${streetVar}`);
            break;
          }
        }
      }
    }
    
    // Tentar 3: Bairro + Cidade + Estado (aproximado)
    if (!location && neighborhood) {
      const neighborhoodAddress = `${neighborhood}, ${city}, ${state}, Brasil`;
      console.log('🔍 Tentando apenas bairro:', neighborhoodAddress);
      
      const proximity = `${cityLng},${cityLat}`;
      const bbox = `${cityLng - 0.5},${cityLat - 0.5},${cityLng + 0.5},${cityLat + 0.5}`;
      
      const testLocation = await tryGeocode(neighborhoodAddress, { types: 'locality,place,poi', proximity, bbox });

      if (testLocation) {
        const [resultLng, resultLat] = testLocation.center;
        const distance = calculateDistance(cityLng, cityLat, resultLng, resultLat);

        if (distance <= 50) {
          location = testLocation;
          accuracy = 'approximate';
          console.log('✅ Bairro encontrado');
        }
      }
    }
    
    // Tentar 4: Apenas cidade e estado (centro da cidade)
    if (!location) {
      console.log('⚠️ Usando centro da cidade como fallback');
      location = cityLocation;
      accuracy = 'city';
    }

    // Extrair coordenadas do Mapbox (formato: [longitude, latitude])
    const [longitude, latitude] = location.center;

    console.log('Geocoded coordinates (Mapbox):', { latitude, longitude, place_name: location.place_name, accuracy });

    return new Response(
      JSON.stringify({ 
        latitude,
        longitude,
        displayName: location.place_name,
        accuracy
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
