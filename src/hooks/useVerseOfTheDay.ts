import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VerseOfTheDay {
  id: string;
  reference: string;
  text: string;
  date: string;
}

export function useVerseOfTheDay() {
  const { data: verse, isLoading } = useQuery({
    queryKey: ['verse-of-the-day'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // First check if we have today's verse
      const { data: existingVerse } = await supabase
        .from('verse_of_the_day')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (existingVerse) {
        return existingVerse as VerseOfTheDay;
      }

      // If not, fetch from API and store (for admin users only)
      // For now, return null and let admins manage verses manually
      return null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60 // Refetch every hour
  });

  return { verse, isLoading };
}
