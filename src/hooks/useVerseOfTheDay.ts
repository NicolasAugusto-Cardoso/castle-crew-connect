import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VerseOfTheDay {
  id: string;
  reference: string;
  text: string;
  date: string;
}

export function useVerseOfTheDay() {
  const { data: verse, isLoading, error } = useQuery({
    queryKey: ['verse-of-the-day'],
    queryFn: async () => {
      // Get today's date in America/Sao_Paulo timezone
      const today = new Date().toLocaleDateString('en-CA', { 
        timeZone: 'America/Sao_Paulo' 
      });
      
      // Check if we have today's verse
      const { data: todayVerse, error: todayError } = await supabase
        .from('verse_of_the_day')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (todayError) {
        console.error('Error fetching today\'s verse:', todayError);
        throw todayError;
      }

      if (todayVerse) {
        return todayVerse as VerseOfTheDay;
      }

      // If no verse for today, get the most recent verse as fallback
      const { data: fallbackVerse, error: fallbackError } = await supabase
        .from('verse_of_the_day')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError) {
        console.error('Error fetching fallback verse:', fallbackError);
        throw fallbackError;
      }

      return fallbackVerse as VerseOfTheDay | null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Refetch every hour
    retry: 2
  });

  return { verse, isLoading, error };
}
