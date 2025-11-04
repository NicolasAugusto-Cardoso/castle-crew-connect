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

    console.log('Geocoding address:', address);

    // Usar Nominatim (OpenStreetMap) para geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Lovable-Church-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Endereço não encontrado',
          latitude: null,
          longitude: null 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = data[0];
    const latitude = parseFloat(location.lat);
    const longitude = parseFloat(location.lon);

    console.log('Geocoded coordinates:', { latitude, longitude });

    return new Response(
      JSON.stringify({ 
        latitude,
        longitude,
        displayName: location.display_name
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