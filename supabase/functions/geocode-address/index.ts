import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Validate if Mapbox result is in the expected city
function isInCorrectCity(mapboxResult: any, expectedCity: string): boolean {
  const placeName = mapboxResult.place_name?.toLowerCase() || '';
  const normalizedCity = expectedCity.toLowerCase().trim();
  
  // Check if the city appears in the place_name
  if (placeName.includes(normalizedCity)) {
    return true;
  }
  
  // Check in context (Mapbox administrative structure)
  if (mapboxResult.context && Array.isArray(mapboxResult.context)) {
    for (const ctx of mapboxResult.context) {
      if (ctx.id?.startsWith('place.') && 
          ctx.text?.toLowerCase().trim() === normalizedCity) {
        return true;
      }
    }
  }
  
  return false;
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

    // Simple helper function to call Mapbox API with city validation
    const callMapbox = async (address: string, validateCity: boolean = true) => {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=BR`;
      console.log('🔍 Calling Mapbox with:', address);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('❌ Mapbox API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const result = data.features[0];
        console.log('📍 Mapbox returned:', result.place_name);
        
        // Validate city if requested
        if (validateCity) {
          const cityMatch = isInCorrectCity(result, city);
          console.log('🏙️ Expected city:', city);
          console.log('✓ City matches:', cityMatch);
          
          if (!cityMatch) {
            console.log('❌ Result is NOT in the correct city, rejecting');
            return null;
          }
        }
        
        console.log('✅ Result accepted');
        return result;
      }
      
      console.log('⚠️ No results from Mapbox');
      return null;
    };

    let location = null;
    let accuracy: 'exact' | 'approximate' | 'city' = 'city';

    // Strategy 1: Complete address (street + number + neighborhood + city + state)
    if (!location && street && streetNumber && neighborhood) {
      console.log('🎯 Strategy 1: Complete address with neighborhood');
      const fullAddress = `${street} ${streetNumber}, ${neighborhood}, ${city}, ${state}, Brasil`;
      location = await callMapbox(fullAddress);
      if (location) {
        accuracy = 'exact';
        console.log('✅ Found with complete address');
      }
    }

    // Strategy 2: Without neighborhood (street + number + city + state)
    if (!location && street && streetNumber) {
      console.log('🎯 Strategy 2: Address without neighborhood');
      const addressWithoutNeighborhood = `${street} ${streetNumber}, ${city}, ${state}, Brasil`;
      location = await callMapbox(addressWithoutNeighborhood);
      if (location) {
        accuracy = 'exact';
        console.log('✅ Found without neighborhood');
      }
    }

    // Strategy 3: Street only (street + city + state)
    if (!location && street) {
      console.log('🎯 Strategy 3: Street only');
      const streetOnly = `${street}, ${city}, ${state}, Brasil`;
      location = await callMapbox(streetOnly);
      if (location) {
        accuracy = 'approximate';
        console.log('✅ Found street only');
      }
    }

    // Strategy 4: Postal code
    if (!location && postalCode) {
      console.log('🎯 Strategy 4: Postal code');
      const postalAddress = `${postalCode}, ${city}, ${state}, Brasil`;
      location = await callMapbox(postalAddress);
      if (location) {
        accuracy = 'approximate';
        console.log('✅ Found by postal code');
      }
    }

    // Fallback: City center (skip city validation for this)
    if (!location) {
      console.log('🎯 Fallback: City center');
      const cityAddress = `${city}, ${state}, Brasil`;
      location = await callMapbox(cityAddress, false); // Don't validate city for city center
      if (location) {
        accuracy = 'city';
        console.log('⚠️ Using city center as fallback');
      }
    }

    // If still no location, return error
    if (!location) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível geocodificar o endereço' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
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
