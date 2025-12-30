import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type BasketType = 'P' | 'M' | 'G';
export type DonationStatus = 'pending' | 'reviewing' | 'confirmed' | 'rejected';

export interface BasketModel {
  id: string;
  type: BasketType;
  title: string;
  description: string | null;
  price: number;
  active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonationCampaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number | null;
  goal_baskets: number | null;
  start_date: string;
  end_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  basket_type: BasketType;
  campaign_id: string | null;
  amount: number;
  status: DonationStatus;
  anonymous: boolean;
  user_id: string | null;
  reference_code: string;
  receipt_url: string | null;
  donor_name: string | null;
  created_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
}

// Hook para modelos de cesta
export function useBasketModels() {
  return useQuery({
    queryKey: ['basket-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('basket_models')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data as BasketModel[];
    }
  });
}

// Hook para todas as cestas (admin)
export function useAllBasketModels() {
  return useQuery({
    queryKey: ['basket-models-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('basket_models')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data as BasketModel[];
    }
  });
}

// Hook para campanhas ativas
export function useActiveCampaigns() {
  return useQuery({
    queryKey: ['donation-campaigns-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donation_campaigns')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DonationCampaign[];
    }
  });
}

// Hook para todas as campanhas (admin)
export function useAllCampaigns() {
  return useQuery({
    queryKey: ['donation-campaigns-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donation_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DonationCampaign[];
    }
  });
}

// Hook para criar doação
export function useCreateDonation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      basket_type: BasketType;
      campaign_id?: string | null;
      amount: number;
      anonymous: boolean;
      donor_name?: string;
    }) => {
      const referenceCode = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { data: donation, error } = await supabase
        .from('donations')
        .insert({
          basket_type: data.basket_type,
          campaign_id: data.campaign_id || null,
          amount: data.amount,
          anonymous: data.anonymous,
          user_id: data.anonymous ? null : user?.id,
          donor_name: data.anonymous ? 'Anônimo' : (data.donor_name || user?.user_metadata?.name || 'Usuário'),
          reference_code: referenceCode,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return donation as Donation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations-stats'] });
    }
  });
}

// Hook para enviar comprovante
export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ donationId, file }: { donationId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${donationId}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('donations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('donations')
        .getPublicUrl(filePath);

      // Update donation with receipt URL and status
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          receipt_url: urlData.publicUrl,
          status: 'reviewing'
        })
        .eq('id', donationId);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success('Comprovante enviado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar comprovante');
    }
  });
}

// Hook para doações do usuário
export function useUserDonations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['donations', 'user', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Donation[];
    },
    enabled: !!user?.id
  });
}

// Hook para todas as doações (admin/volunteer)
export function useAllDonations() {
  return useQuery({
    queryKey: ['donations', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Donation[];
    }
  });
}

// Hook para confirmar/rejeitar doação
export function useUpdateDonationStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ donationId, status }: { donationId: string; status: DonationStatus }) => {
      const updateData: any = { status };
      
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmed_by = user?.id;
      }

      const { error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations-stats'] });
      toast.success(status === 'confirmed' ? 'Doação confirmada!' : 'Doação rejeitada');
    }
  });
}

// Hook para estatísticas públicas (apenas confirmadas)
export function useDonationStats() {
  return useQuery({
    queryKey: ['donations-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('amount, basket_type, campaign_id')
        .eq('status', 'confirmed');
      
      if (error) throw error;
      
      const stats = {
        totalAmount: 0,
        totalBaskets: 0,
        byType: { P: 0, M: 0, G: 0 } as Record<BasketType, number>,
        byCampaign: {} as Record<string, { amount: number; count: number }>
      };

      (data || []).forEach((donation: any) => {
        stats.totalAmount += Number(donation.amount);
        stats.totalBaskets += 1;
        stats.byType[donation.basket_type as BasketType] += 1;
        
        if (donation.campaign_id) {
          if (!stats.byCampaign[donation.campaign_id]) {
            stats.byCampaign[donation.campaign_id] = { amount: 0, count: 0 };
          }
          stats.byCampaign[donation.campaign_id].amount += Number(donation.amount);
          stats.byCampaign[donation.campaign_id].count += 1;
        }
      });

      return stats;
    }
  });
}

// Hook para gerenciar modelos de cesta (admin)
export function useManageBasketModels() {
  const queryClient = useQueryClient();

  const updateModel = useMutation({
    mutationFn: async ({ id, ...data }: Partial<BasketModel> & { id: string }) => {
      const { error } = await supabase
        .from('basket_models')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket-models'] });
      toast.success('Modelo atualizado!');
    }
  });

  return { updateModel };
}

// Hook para gerenciar campanhas (admin)
export function useManageCampaigns() {
  const queryClient = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: async (data: Omit<DonationCampaign, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('donation_campaigns')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-campaigns'] });
      toast.success('Campanha criada!');
    }
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...data }: Partial<DonationCampaign> & { id: string }) => {
      const { error } = await supabase
        .from('donation_campaigns')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-campaigns'] });
      toast.success('Campanha atualizada!');
    }
  });

  return { createCampaign, updateCampaign };
}
