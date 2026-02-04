import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AppSetting {
  id: string;
  key: string;
  value: boolean | string | number | object;
  updated_at: string;
  updated_by: string | null;
}

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      // Converter array para objeto key-value
      const settings: Record<string, any> = {};
      (data as AppSetting[])?.forEach(item => {
        settings[item.key] = item.value;
      });
      return settings;
    },
  });
}

export function useDonationsEnabled() {
  const { data: settings, isLoading } = useAppSettings();
  return {
    isDonationsEnabled: settings?.donations_enabled === true,
    isLoading,
  };
}

export function useUpdateAppSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('app_settings' as any)
        .upsert({ 
          key, 
          value, 
          updated_at: new Date().toISOString() 
        }, { 
          onConflict: 'key' 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
}
