import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  end_date: string | null;
  max_participants: number | null;
  cover_image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  registration_count?: number;
  is_registered?: boolean;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  profiles?: {
    name: string;
    avatar_url: string | null;
  };
}

// Hook for listing events
export function useEvents() {
  const { user } = useAuth();

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Get registration counts and user registration status
      const eventsWithCounts = await Promise.all(
        (events || []).map(async (event) => {
          const { count } = await supabase
            .from('event_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          let isRegistered = false;
          if (user) {
            const { data: registration } = await supabase
              .from('event_registrations')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isRegistered = !!registration;
          }

          return {
            ...event,
            registration_count: count || 0,
            is_registered: isRegistered,
          };
        })
      );

      return eventsWithCounts as Event[];
    },
    enabled: !!user,
  });

  return {
    events: eventsQuery.data || [],
    isLoading: eventsQuery.isLoading,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
  };
}

// Hook for event details
export function useEventDetails(eventId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId!)
        .single();

      if (error) throw error;

      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId!);

      let isRegistered = false;
      if (user) {
        const { data: registration } = await supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', eventId!)
          .eq('user_id', user.id)
          .maybeSingle();
        isRegistered = !!registration;
      }

      return {
        ...event,
        registration_count: count || 0,
        is_registered: isRegistered,
      } as Event;
    },
    enabled: !!eventId && !!user,
  });
}

// Hook for event registrations
export function useEventRegistrations(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId!)
        .order('registered_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for each registration
      const registrationsWithProfiles = await Promise.all(
        (data || []).map(async (registration) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', registration.user_id)
            .maybeSingle();

          return {
            ...registration,
            profiles: profile || undefined,
          };
        })
      );

      return registrationsWithProfiles as EventRegistration[];
    },
    enabled: !!eventId,
  });
}

// Hook for event mutations
export function useEventMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createEvent = useMutation({
    mutationFn: async (eventData: {
      title: string;
      description?: string;
      location?: string;
      event_date: string;
      end_date?: string;
      max_participants?: number;
      cover_image_url?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create reminders (24h and 1h before)
      const eventDate = new Date(eventData.event_date);
      const reminder24h = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      const reminder1h = new Date(eventDate.getTime() - 1 * 60 * 60 * 1000);

      await supabase.from('event_reminders').insert([
        { event_id: data.id, reminder_time: reminder24h.toISOString() },
        { event_id: data.id, reminder_time: reminder1h.toISOString() },
      ]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast.error('Erro ao criar evento');
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({
      id,
      ...eventData
    }: {
      id: string;
      title?: string;
      description?: string;
      location?: string;
      event_date?: string;
      end_date?: string;
      max_participants?: number;
      cover_image_url?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      toast.success('Evento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    },
  });

  const registerForEvent = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      toast.success('Inscrição realizada com sucesso!');
    },
    onError: (error) => {
      console.error('Error registering for event:', error);
      toast.error('Erro ao realizar inscrição');
    },
  });

  const cancelRegistration = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      toast.success('Inscrição cancelada');
    },
    onError: (error) => {
      console.error('Error canceling registration:', error);
      toast.error('Erro ao cancelar inscrição');
    },
  });

  const checkIn = useMutation({
    mutationFn: async ({ eventId, registrationId }: { eventId: string; registrationId: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: user.id,
        })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      toast.success('Check-in realizado!');
    },
    onError: (error) => {
      console.error('Error checking in:', error);
      toast.error('Erro ao realizar check-in');
    },
  });

  const undoCheckIn = useMutation({
    mutationFn: async ({ eventId, registrationId }: { eventId: string; registrationId: string }) => {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: false,
          checked_in_at: null,
          checked_in_by: null,
        })
        .eq('id', registrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      toast.success('Check-in desfeito');
    },
    onError: (error) => {
      console.error('Error undoing check-in:', error);
      toast.error('Erro ao desfazer check-in');
    },
  });

  const uploadEventImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('events')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    checkIn,
    undoCheckIn,
    uploadEventImage,
  };
}
