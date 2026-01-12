import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ABIBLIADIGITAL_URL = 'https://www.abibliadigital.com.br/api'
const BOLLS_LIFE_URL = 'https://bolls.life/get-chapter'

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

// Map ABíbliaDigital version codes to bolls.life translation IDs
const BOLLS_VERSION_MAP: Record<string, string> = {
  'nvi': 'NVI',
  'ara': 'ARA',
  'acf': 'ACF',
  'kjv': 'KJV',
  'bbe': 'BBE',
  'rvr': 'LBLA', // Spanish - closest match
}

// Map book abbreviations to bolls.life book numbers (1-66)
const BOOK_NUMBER_MAP: Record<string, number> = {
  'gn': 1, 'ex': 2, 'lv': 3, 'nm': 4, 'dt': 5,
  'js': 6, 'jz': 7, 'rt': 8, '1sm': 9, '2sm': 10,
  '1rs': 11, '2rs': 12, '1cr': 13, '2cr': 14, 'ed': 15,
  'ne': 16, 'et': 17, 'jó': 18, 'sl': 19, 'pv': 20,
  'ec': 21, 'ct': 22, 'is': 23, 'jr': 24, 'lm': 25,
  'ez': 26, 'dn': 27, 'os': 28, 'jl': 29, 'am': 30,
  'ob': 31, 'jn': 32, 'mq': 33, 'na': 34, 'hc': 35,
  'sf': 36, 'ag': 37, 'zc': 38, 'ml': 39,
  'mt': 40, 'mc': 41, 'lc': 42, 'jo': 43, 'at': 44,
  'rm': 45, '1co': 46, '2co': 47, 'gl': 48, 'ef': 49,
  'fp': 50, 'cl': 51, '1ts': 52, '2ts': 53, '1tm': 54,
  '2tm': 55, 'tt': 56, 'fm': 57, 'hb': 58, 'tg': 59,
  '1pe': 60, '2pe': 61, '1jo': 62, '2jo': 63, '3jo': 64,
  'jd': 65, 'ap': 66,
}

// Normalize verses from ABibliaDigital format
function normalizeABibliaDigital(data: any): NormalizedVerse[] {
  if (!data?.verses || !Array.isArray(data.verses)) return []
  return data.verses.map((v: any) => ({
    number: v.number,
    text: v.text,
  }))
}

// Normalize verses from bolls.life format
function normalizeBollsLife(data: any[]): NormalizedVerse[] {
  if (!Array.isArray(data)) return []
  return data.map((v: any) => ({
    number: v.verse,
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
    const timeoutId = setTimeout(() => controller.abort(), 8000)

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

// Try bolls.life as backup API
async function tryBollsLife(
  version: string,
  bookAbbrev: string,
  chapter: number
): Promise<{ verses: NormalizedVerse[] } | null> {
  try {
    const bollsVersion = BOLLS_VERSION_MAP[version] || 'NVI'
    const bookNumber = BOOK_NUMBER_MAP[bookAbbrev.toLowerCase()]
    
    if (!bookNumber) {
      console.log(`[bible-proxy] Unknown book abbrev for bolls.life: ${bookAbbrev}`)
      return null
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    // bolls.life format: /get-chapter/TRANSLATION/BOOK_NUMBER/CHAPTER
    const response = await fetch(
      `${BOLLS_LIFE_URL}/${bollsVersion}/${bookNumber}/${chapter}/`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`[bible-proxy] bolls.life returned ${response.status}`)
      return null
    }

    const data = await response.json()
    const verses = normalizeBollsLife(data)
    
    if (verses.length === 0) return null
    
    console.log(`[bible-proxy] bolls.life success: ${verses.length} verses`)
    return { verses }
  } catch (error) {
    console.log(`[bible-proxy] bolls.life failed:`, error)
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

    // 3. Try bolls.life as backup
    console.log(`[bible-proxy] Trying bolls.life backup for ${version}/${bookAbbrev}/${chapter}`)
    const bollsResult = await tryBollsLife(version, bookAbbrev, chapter)

    if (bollsResult) {
      // Save to cache
      await supabase.from('bible_chapter_cache').upsert({
        provider: 'bolls_life',
        version,
        book_abbrev: bookAbbrev,
        chapter,
        verses: bollsResult.verses,
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: 'version,book_abbrev,chapter',
      })

      const payload: ChapterPayload = {
        version,
        bookAbbrev,
        chapter,
        verses: bollsResult.verses,
        source: 'backup_api',
      }
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. All providers failed
    return new Response(
      JSON.stringify({ 
        error: 'Não foi possível carregar este capítulo. Todas as APIs estão temporariamente indisponíveis.',
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
