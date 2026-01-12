import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ABIBLIADIGITAL_URL = 'https://www.abibliadigital.com.br/api'

interface NormalizedVerse {
  number: number
  text: string
}

interface ChapterPayload {
  version: string
  bookAbbrev: string
  chapter: number
  verses: NormalizedVerse[]
  source: 'abibliadigital' | 'backup_api' | 'cache'
  bookName?: string
}

// Normalize verses from ABibliaDigital format
function normalizeABibliaDigital(data: any): NormalizedVerse[] {
  if (!data?.verses || !Array.isArray(data.verses)) return []
  return data.verses.map((v: any) => ({
    number: v.number,
    text: v.text,
  }))
}

// Try ABibliaDigital API
async function tryABibliaDigital(
  version: string,
  bookAbbrev: string,
  chapter: number
): Promise<{ verses: NormalizedVerse[]; bookName?: string } | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout

    const response = await fetch(
      `${ABIBLIADIGITAL_URL}/verses/${version}/${bookAbbrev}/${chapter}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`[bible-proxy] ABibliaDigital returned ${response.status}`)
      return null
    }

    const data = await response.json()
    const verses = normalizeABibliaDigital(data)
    
    if (verses.length === 0) return null
    
    return { 
      verses, 
      bookName: data?.book?.name 
    }
  } catch (error) {
    console.log(`[bible-proxy] ABibliaDigital failed:`, error)
    return null
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { version, bookAbbrev, chapter } = await req.json()

    if (!version || !bookAbbrev || !chapter) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: version, bookAbbrev, chapter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role for cache operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check cache first
    const { data: cachedChapter } = await supabase
      .from('bible_chapter_cache')
      .select('*')
      .eq('version', version)
      .eq('book_abbrev', bookAbbrev)
      .eq('chapter', chapter)
      .single()

    if (cachedChapter) {
      console.log(`[bible-proxy] Cache hit for ${version}/${bookAbbrev}/${chapter}`)
      const payload: ChapterPayload = {
        version,
        bookAbbrev,
        chapter,
        verses: cachedChapter.verses as NormalizedVerse[],
        source: 'cache',
      }
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Try ABibliaDigital
    console.log(`[bible-proxy] Trying ABibliaDigital for ${version}/${bookAbbrev}/${chapter}`)
    const abibliaResult = await tryABibliaDigital(version, bookAbbrev, chapter)

    if (abibliaResult) {
      // Save to cache
      await supabase.from('bible_chapter_cache').upsert({
        provider: 'abibliadigital',
        version,
        book_abbrev: bookAbbrev,
        chapter,
        verses: abibliaResult.verses,
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: 'version,book_abbrev,chapter',
      })

      const payload: ChapterPayload = {
        version,
        bookAbbrev,
        chapter,
        verses: abibliaResult.verses,
        source: 'abibliadigital',
        bookName: abibliaResult.bookName,
      }
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. All providers failed
    return new Response(
      JSON.stringify({ 
        error: 'Não foi possível carregar este capítulo. A API está temporariamente indisponível.',
        code: 'API_UNAVAILABLE' 
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[bible-proxy] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
