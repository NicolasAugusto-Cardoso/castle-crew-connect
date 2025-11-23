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

// Função para validar se o resultado está na cidade correta
function isInCorrectCity(result: any, expectedCity: string): boolean {
  const placeName = result.place_name.toLowerCase();
  const normalizedCity = expectedCity.toLowerCase();
  
  // Verificar se a cidade aparece no place_name
  if (placeName.includes(normalizedCity)) {
    return true;
  }
  
  // Verificar no context (contexto administrativo)
  if (result.context) {
    for (const ctx of result.context) {
      if (ctx.id.startsWith('place.') && ctx.text.toLowerCase() === normalizedCity) {
        return true;
      }
    }
  }
  
  return false;
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

    console.log('Geocoding address:', { street, streetNumber, neighborhood, city, state, postalCode });

    if (!city || !state) {
      return new Response(
        JSON.stringify({ error: 'Cidade e estado são obrigatórios para geocodificação' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Mapbox Access Token (público)
    const MAPBOX_TOKEN = 'pk.eyJ1Ijoibmljay0xNyIsImEiOiJjbWlhc2R0NTMwOHNkMm1wdzZ3d250cDZ3In0.29vHKdadYBcdi4ioD_UIuQ';

    // Função auxiliar para tentar geocodificação com Mapbox
    const tryGeocode = async (searchAddress: string, options: { types?: string, proximity?: string, bbox?: string } = {}): Promise<any> => {
      let mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?country=BR&access_token=${MAPBOX_TOKEN}&limit=5&language=pt`;
      
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
      
      console.log('🔍 Tentando geocodificar:', searchAddress);
      
      const response = await fetch(mapboxUrl);

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Filtrar resultados para incluir apenas aqueles na cidade correta
        const validFeatures = data.features.filter((feature: any) => isInCorrectCity(feature, city));
        
        if (validFeatures.length > 0) {
          console.log('✅ Resultado válido encontrado:', validFeatures[0].place_name);
          return validFeatures[0];
        } else {
          console.log('❌ Nenhum resultado na cidade correta');
        }
      }
      
      return null;
    };

    // Obter coordenadas da cidade primeiro para validação
    const cityAddress = `${city}, ${state}, Brasil`;
    console.log('🏙️ Obtendo coordenadas da cidade:', cityAddress);
    const cityLocation = await tryGeocode(cityAddress, { types: 'place' });
    
    if (!cityLocation) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível encontrar a cidade informada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const [cityLng, cityLat] = cityLocation.center;
    const proximity = `${cityLng},${cityLat}`;
    
    // Criar bounding box ao redor da cidade (aproximadamente 30km de raio)
    const bbox = `${cityLng - 0.3},${cityLat - 0.3},${cityLng + 0.3},${cityLat + 0.3}`;

    console.log('🏙️ Cidade encontrada:', cityLocation.place_name, { cityLat, cityLng });

    let location = null;
    let accuracy: 'exact' | 'approximate' | 'city' = 'city';
    
    // Limites de distância baseados na completude do endereço
    const MAX_DISTANCE_WITH_NUMBER = 10;      // 10km para endereço com número
    const MAX_DISTANCE_WITHOUT_NUMBER = 20;   // 20km para endereço sem número
    const MAX_DISTANCE_NEIGHBORHOOD = 30;     // 30km para apenas bairro

    // ESTRATÉGIA 1: Rua + Número + Cidade + Estado (SEM bairro) - MAIOR PRIORIDADE
    if (street && streetNumber && !location) {
      console.log('🎯 Tentativa 1: Rua + Número + Cidade (SEM bairro)');
      const streetVariations = generateStreetVariations(street);
      
      for (const streetVar of streetVariations) {
        const address = `${streetVar} ${streetNumber}, ${city}, ${state}, Brasil`;
        const testLocation = await tryGeocode(address, { types: 'address', proximity, bbox });
        
        if (testLocation) {
          const [lng, lat] = testLocation.center;
          const distance = calculateDistance(cityLng, cityLat, lng, lat);
          
          console.log('📍 Resultado:', testLocation.place_name);
          console.log('🏙️ Cidade esperada:', city);
          console.log('✓ Cidade corresponde:', isInCorrectCity(testLocation, city));
          console.log('📏 Distância:', distance.toFixed(2), 'km');
          
          if (distance < MAX_DISTANCE_WITH_NUMBER) {
            location = testLocation;
            accuracy = 'exact';
            console.log('✅ Endereço exato encontrado!');
            break;
          }
        }
      }
    }
    
    // ESTRATÉGIA 2: Rua + Cidade + Estado (sem número e sem bairro)
    if (street && !location) {
      console.log('🎯 Tentativa 2: Rua + Cidade (sem número)');
      const streetVariations = generateStreetVariations(street);
      
      for (const streetVar of streetVariations) {
        const address = `${streetVar}, ${city}, ${state}, Brasil`;
        const testLocation = await tryGeocode(address, { types: 'address,place', proximity, bbox });
        
        if (testLocation) {
          const [lng, lat] = testLocation.center;
          const distance = calculateDistance(cityLng, cityLat, lng, lat);
          
          console.log('📍 Resultado:', testLocation.place_name);
          console.log('📏 Distância:', distance.toFixed(2), 'km');
          
          if (distance < MAX_DISTANCE_WITHOUT_NUMBER) {
            location = testLocation;
            accuracy = 'approximate';
            console.log('⚠️ Endereço aproximado encontrado (sem número)');
            break;
          }
        }
      }
    }
    
    // ESTRATÉGIA 3: Rua + Número + Bairro + Cidade (com bairro)
    if (street && streetNumber && neighborhood && !location) {
      console.log('🎯 Tentativa 3: Rua + Número + Bairro + Cidade');
      const streetVariations = generateStreetVariations(street);
      
      for (const streetVar of streetVariations) {
        const address = `${streetVar} ${streetNumber}, ${neighborhood}, ${city}, ${state}, Brasil`;
        const testLocation = await tryGeocode(address, { types: 'address', proximity, bbox });
        
        if (testLocation) {
          const [lng, lat] = testLocation.center;
          const distance = calculateDistance(cityLng, cityLat, lng, lat);
          
          console.log('📍 Resultado:', testLocation.place_name);
          console.log('📏 Distância:', distance.toFixed(2), 'km');
          
          if (distance < MAX_DISTANCE_WITH_NUMBER) {
            location = testLocation;
            accuracy = 'exact';
            console.log('✅ Endereço com bairro encontrado!');
            break;
          }
        }
      }
    }
    
    // ESTRATÉGIA 4: CEP (se fornecido)
    if (postalCode && !location) {
      console.log('🎯 Tentativa 4: CEP');
      const address = `${postalCode}, ${city}, ${state}, Brasil`;
      const testLocation = await tryGeocode(address, { types: 'postcode', proximity, bbox });
      
      if (testLocation) {
        const [lng, lat] = testLocation.center;
        const distance = calculateDistance(cityLng, cityLat, lng, lat);
        
        console.log('📍 Resultado:', testLocation.place_name);
        console.log('📏 Distância:', distance.toFixed(2), 'km');
        
        if (distance < MAX_DISTANCE_WITHOUT_NUMBER) {
          location = testLocation;
          accuracy = 'approximate';
          console.log('⚠️ Localização por CEP encontrada');
        }
      }
    }
    
    // ESTRATÉGIA 5: Apenas bairro
    if (neighborhood && !location) {
      console.log('🎯 Tentativa 5: Apenas bairro');
      const address = `${neighborhood}, ${city}, ${state}, Brasil`;
      const testLocation = await tryGeocode(address, { types: 'neighborhood,place', proximity, bbox });
      
      if (testLocation) {
        const [lng, lat] = testLocation.center;
        const distance = calculateDistance(cityLng, cityLat, lng, lat);
        
        console.log('📍 Resultado:', testLocation.place_name);
        console.log('📏 Distância:', distance.toFixed(2), 'km');
        
        if (distance < MAX_DISTANCE_NEIGHBORHOOD) {
          location = testLocation;
          accuracy = 'approximate';
          console.log('⚠️ Localização por bairro encontrada');
        }
      }
    }

    // FALLBACK: Usar centro da cidade
    if (!location) {
      location = cityLocation;
      accuracy = 'city';
      console.log('⚠️ FALLBACK: Usando centro da cidade');
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
