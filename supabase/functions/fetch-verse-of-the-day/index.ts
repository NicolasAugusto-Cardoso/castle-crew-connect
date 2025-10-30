import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BibleVerse {
  book: {
    name: string;
    abbrev: { pt: string; en: string };
    author: string;
    group: string;
    version: string;
  };
  chapter: number;
  number: number;
  text: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date in America/Sao_Paulo timezone
    const today = new Date().toLocaleDateString('en-CA', { 
      timeZone: 'America/Sao_Paulo' 
    });

    console.log(`Fetching verse for date: ${today}`);

    // Check if we already have a verse for today
    const { data: existingVerse, error: checkError } = await supabase
      .from('verse_of_the_day')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing verse:', checkError);
      throw checkError;
    }

    if (existingVerse) {
      console.log('Verse already exists for today:', existingVerse.reference);
      return new Response(
        JSON.stringify({ 
          message: 'Verse already exists for today', 
          verse: existingVerse 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get verses from the last 30 days to avoid repetition
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString('en-CA', {
      timeZone: 'America/Sao_Paulo'
    });

    const { data: recentVerses } = await supabase
      .from('verse_of_the_day')
      .select('reference')
      .gte('date', thirtyDaysAgoStr);

    const usedReferences = new Set(recentVerses?.map(v => v.reference) || []);
    console.log(`Found ${usedReferences.size} verses used in the last 30 days`);

    // Try to fetch a unique verse (max 5 attempts)
    let verse: BibleVerse | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Attempt ${attempts} to fetch unique verse`);

      // Fetch random verse from ABíbliaDigital API
      // Using "nvi" (Nova Versão Internacional) version
      const apiResponse = await fetch(
        'https://www.abibliadigital.com.br/api/verses/nvi/random'
      );

      if (!apiResponse.ok) {
        console.error('API response not OK:', apiResponse.status);
        if (attempts === maxAttempts) {
          throw new Error(`Bible API returned ${apiResponse.status}`);
        }
        continue;
      }

      const apiVerse: BibleVerse = await apiResponse.json();
      const reference = `${apiVerse.book.name} ${apiVerse.chapter}:${apiVerse.number}`;

      console.log(`Got verse: ${reference}`);

      // Check if this verse was used recently
      if (!usedReferences.has(reference)) {
        verse = apiVerse;
        console.log('Found unique verse!');
        break;
      }

      console.log('Verse was used recently, trying again');
    }

    if (!verse) {
      throw new Error('Could not find a unique verse after maximum attempts');
    }

    // Format the verse data
    const reference = `${verse.book.name} ${verse.chapter}:${verse.number}`;
    const text = verse.text;

    console.log(`Saving new verse: ${reference}`);

    // Save the verse to the database
    const { data: newVerse, error: insertError } = await supabase
      .from('verse_of_the_day')
      .insert([
        {
          date: today,
          reference: reference,
          text: text,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting verse:', insertError);
      throw insertError;
    }

    console.log('Successfully saved verse:', reference);

    return new Response(
      JSON.stringify({ 
        message: 'Successfully fetched and saved verse of the day', 
        verse: newVerse 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );

  } catch (error) {
    console.error('Error in fetch-verse-of-the-day:', error);

    // In case of error, try to get the most recent verse as fallback
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: fallbackVerse } = await supabase
        .from('verse_of_the_day')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackVerse) {
        console.log('Using fallback verse:', fallbackVerse.reference);
        return new Response(
          JSON.stringify({ 
            message: 'Error fetching new verse, using fallback', 
            verse: fallbackVerse,
            error: error instanceof Error ? error.message : 'Unknown error'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    } catch (fallbackError) {
      console.error('Error fetching fallback verse:', fallbackError);
    }

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to fetch verse of the day'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
