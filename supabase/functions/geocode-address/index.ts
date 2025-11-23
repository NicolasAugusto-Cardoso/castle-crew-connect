import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
    const tryGeocode = async (searchAddress: string): Promise<any> => {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchAddress)}.json?country=BR&access_token=${MAPBOX_TOKEN}&limit=1`;
      
      const response = await fetch(mapboxUrl);

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data && data.features && data.features.length > 0 ? data.features[0] : null;
    };

    // Estratégia de fallback progressivo
    let location = null;
    
    // Tentar 1: Endereço completo
    location = await tryGeocode(address);
    
    // Tentar 2: Sem número da rua
    if (!location && street) {
      const fallbackParts = addressParts.filter(part => part !== `${street}, ${streetNumber}` && part !== street);
      if (street) fallbackParts.unshift(street);
      fallbackParts.push('Brasil');
      const fallbackAddress = fallbackParts.join(', ');
      console.log('Trying fallback without street number:', fallbackAddress);
      location = await tryGeocode(fallbackAddress);
    }
    
    // Tentar 3: Apenas bairro, cidade e estado
    if (!location && neighborhood && city) {
      const simplifiedParts = [];
      if (neighborhood) simplifiedParts.push(neighborhood);
      if (city) simplifiedParts.push(city);
      if (state) simplifiedParts.push(state);
      simplifiedParts.push('Brasil');
      const simplifiedAddress = simplifiedParts.join(', ');
      console.log('Trying simplified address:', simplifiedAddress);
      location = await tryGeocode(simplifiedAddress);
    }
    
    // Tentar 4: Apenas cidade e estado
    if (!location && city) {
      const cityParts = [];
      if (city) cityParts.push(city);
      if (state) cityParts.push(state);
      cityParts.push('Brasil');
      const cityAddress = cityParts.join(', ');
      console.log('Trying city only:', cityAddress);
      location = await tryGeocode(cityAddress);
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
