import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Testimonial {
  id: string;
  title: string;
  content: string;
  author_name: string | null;
  status: 'draft' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export function useTestimonials(includeUnpublished = false) {
  const queryClient = useQueryClient();

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials', includeUnpublished],
    queryFn: async () => {
      let query = supabase.from('testimonials').select('*');
      
      if (!includeUnpublished) {
        query = query.eq('status', 'published');
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Testimonial[];
    }
  });

  const createTestimonial = useMutation({
    mutationFn: async (testimonial: { title: string; content: string; author_name?: string; status?: 'draft' | 'published' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          ...testimonial,
          created_by: user.id,
          published_at: testimonial.status === 'published' ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testemunho criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar testemunho');
      console.error(error);
    }
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Testimonial> & { id: string }) => {
      const updateData: any = { ...updates };
      
      // Set published_at when status changes to published
      if (updates.status === 'published' && !updates.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testemunho atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar testemunho');
      console.error(error);
    }
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success('Testemunho excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir testemunho');
      console.error(error);
    }
  });

  return {
    testimonials,
    isLoading,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
  };
}
