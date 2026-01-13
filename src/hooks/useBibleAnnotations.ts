import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Types for bible annotations
export interface BibleNote {
  id: string;
  user_id: string;
  version: string;
  book_abbrev: string;
  chapter: number;
  verse: number;
  content_json: {
    text: string;
    html?: string;
    formatting?: {
      bold?: boolean;
      underline?: boolean;
    };
  };
  text_color: string | null;
  background_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface BibleHighlight {
  id: string;
  user_id: string;
  version: string;
  book_abbrev: string;
  chapter: number;
  verse: number;
  color: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string | null;
  created_at: string;
}

export interface BibleFocusMark {
  id: string;
  user_id: string;
  version: string;
  book_abbrev: string;
  chapter: number;
  verse: number;
  created_at: string;
}

// Helper to create verse key
export function createVerseKey(version: string, bookAbbrev: string, chapter: number, verse: number) {
  return `${version}:${bookAbbrev}:${chapter}:${verse}`;
}

// Hook for Bible notes (annotations)
export function useBibleNotes(version?: string, bookAbbrev?: string, chapter?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notes for a chapter
  const notesQuery = useQuery({
    queryKey: ['bible-notes', user?.id, version, bookAbbrev, chapter],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('bible_notes')
        .select('*')
        .eq('user_id', user.id);
      
      if (version) query = query.eq('version', version);
      if (bookAbbrev) query = query.eq('book_abbrev', bookAbbrev);
      if (chapter) query = query.eq('chapter', chapter);
      
      const { data, error } = await query.order('verse', { ascending: true });
      
      if (error) throw error;
      return (data || []) as BibleNote[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Get note for specific verse
  const getNote = (verseNumber: number): BibleNote | undefined => {
    return notesQuery.data?.find(n => n.verse === verseNumber);
  };

  // Upsert note mutation
  const upsertNoteMutation = useMutation({
    mutationFn: async (params: {
      version: string;
      bookAbbrev: string;
      chapter: number;
      verse: number;
      content_json: BibleNote['content_json'];
      text_color?: string;
      background_color?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bible_notes')
        .upsert({
          user_id: user.id,
          version: params.version,
          book_abbrev: params.bookAbbrev,
          chapter: params.chapter,
          verse: params.verse,
          content_json: params.content_json,
          text_color: params.text_color || null,
          background_color: params.background_color || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,version,book_abbrev,chapter,verse',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BibleNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-notes', user?.id] });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('bible_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-notes', user?.id] });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    getNote,
    upsertNote: upsertNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    isUpserting: upsertNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}

// Hook for all user notes (for saved section)
export function useAllBibleNotes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bible-notes', user?.id, 'all'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bible_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as BibleNote[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for Bible highlights
export function useBibleHighlights(version?: string, bookAbbrev?: string, chapter?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch highlights for a chapter
  const highlightsQuery = useQuery({
    queryKey: ['bible-highlights', user?.id, version, bookAbbrev, chapter],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('bible_highlights')
        .select('*')
        .eq('user_id', user.id);
      
      if (version) query = query.eq('version', version);
      if (bookAbbrev) query = query.eq('book_abbrev', bookAbbrev);
      if (chapter) query = query.eq('chapter', chapter);
      
      const { data, error } = await query.order('verse', { ascending: true });
      
      if (error) throw error;
      return (data || []) as BibleHighlight[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Get highlights for specific verse
  const getHighlights = (verseNumber: number): BibleHighlight[] => {
    return highlightsQuery.data?.filter(h => h.verse === verseNumber) || [];
  };

  // Add highlight mutation
  const addHighlightMutation = useMutation({
    mutationFn: async (params: {
      version: string;
      bookAbbrev: string;
      chapter: number;
      verse: number;
      color: string;
      start_offset: number;
      end_offset: number;
      highlighted_text?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bible_highlights')
        .insert({
          user_id: user.id,
          version: params.version,
          book_abbrev: params.bookAbbrev,
          chapter: params.chapter,
          verse: params.verse,
          color: params.color,
          start_offset: params.start_offset,
          end_offset: params.end_offset,
          highlighted_text: params.highlighted_text || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BibleHighlight;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-highlights', user?.id] });
    },
  });

  // Remove highlight mutation
  const removeHighlightMutation = useMutation({
    mutationFn: async (highlightId: string) => {
      const { error } = await supabase
        .from('bible_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-highlights', user?.id] });
    },
  });

  // Remove all highlights for a verse
  const removeHighlightsForVerseMutation = useMutation({
    mutationFn: async (params: {
      version: string;
      bookAbbrev: string;
      chapter: number;
      verse: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('bible_highlights')
        .delete()
        .eq('user_id', user.id)
        .eq('version', params.version)
        .eq('book_abbrev', params.bookAbbrev)
        .eq('chapter', params.chapter)
        .eq('verse', params.verse);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-highlights', user?.id] });
    },
  });

  return {
    highlights: highlightsQuery.data || [],
    isLoading: highlightsQuery.isLoading,
    getHighlights,
    addHighlight: addHighlightMutation.mutateAsync,
    removeHighlight: removeHighlightMutation.mutateAsync,
    removeHighlightsForVerse: removeHighlightsForVerseMutation.mutateAsync,
    isAdding: addHighlightMutation.isPending,
    isRemoving: removeHighlightMutation.isPending,
  };
}

// Hook for all user highlights (for saved section)
export function useAllBibleHighlights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bible-highlights', user?.id, 'all'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bible_highlights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as BibleHighlight[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for Bible focus marks (reading mode)
export function useBibleFocusMarks(version?: string, bookAbbrev?: string, chapter?: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch focus marks for a chapter
  const focusMarksQuery = useQuery({
    queryKey: ['bible-focus-marks', user?.id, version, bookAbbrev, chapter],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('bible_focus_marks')
        .select('*')
        .eq('user_id', user.id);
      
      if (version) query = query.eq('version', version);
      if (bookAbbrev) query = query.eq('book_abbrev', bookAbbrev);
      if (chapter) query = query.eq('chapter', chapter);
      
      const { data, error } = await query.order('verse', { ascending: true });
      
      if (error) throw error;
      return (data || []) as BibleFocusMark[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Check if verse has focus mark
  const hasFocusMark = (verseNumber: number): boolean => {
    return focusMarksQuery.data?.some(f => f.verse === verseNumber) || false;
  };

  // Toggle focus mark mutation
  const toggleFocusMarkMutation = useMutation({
    mutationFn: async (params: {
      version: string;
      bookAbbrev: string;
      chapter: number;
      verse: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if exists
      const { data: existing } = await supabase
        .from('bible_focus_marks')
        .select('id')
        .eq('user_id', user.id)
        .eq('version', params.version)
        .eq('book_abbrev', params.bookAbbrev)
        .eq('chapter', params.chapter)
        .eq('verse', params.verse)
        .single();

      if (existing) {
        // Remove
        const { error } = await supabase
          .from('bible_focus_marks')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        // Add
        const { error } = await supabase
          .from('bible_focus_marks')
          .insert({
            user_id: user.id,
            version: params.version,
            book_abbrev: params.bookAbbrev,
            chapter: params.chapter,
            verse: params.verse,
          });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bible-focus-marks', user?.id] });
    },
  });

  return {
    focusMarks: focusMarksQuery.data || [],
    isLoading: focusMarksQuery.isLoading,
    hasFocusMark,
    toggleFocusMark: toggleFocusMarkMutation.mutateAsync,
    isToggling: toggleFocusMarkMutation.isPending,
  };
}
