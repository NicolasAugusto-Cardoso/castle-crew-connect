import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type BasketModel = Database['public']['Tables']['basket_models']['Row'];
type DonationCampaign = Database['public']['Tables']['donation_campaigns']['Row'];
type Donation = Database['public']['Tables']['donations']['Row'];
type BasketType = Database['public']['Enums']['basket_type'];
type DonationStatus = Database['public']['Enums']['donation_status'];

export interface DonationWithDetails extends Donation {
  donor_profile?: {
    name: string;
    avatar_url: string | null;
  } | null;
  campaign?: {
    title: string;
  } | null;
}

// Fetch basket models
export const useBasketModels = () => {
  return useQuery({
    queryKey: ['basket-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('basket_models')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      return data as BasketModel[];
    },
  });
};

// Fetch campaigns
export const useDonationCampaigns = (activeOnly = false) => {
  return useQuery({
    queryKey: ['donation-campaigns', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('donation_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DonationCampaign[];
    },
  });
};

// Fetch donations
export const useDonations = (userId?: string, isAdmin = false) => {
  return useQuery({
    queryKey: ['donations', userId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('donations')
        .select(`
          *,
          campaign:donation_campaigns(title)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DonationWithDetails[];
    },
    enabled: isAdmin || !!userId,
  });
};

// Fetch confirmed donations for transparency
export const useConfirmedDonations = () => {
  return useQuery({
    queryKey: ['confirmed-donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          id,
          amount,
          basket_type,
          anonymous,
          donor_name,
          created_at,
          campaign:donation_campaigns(title)
        `)
        .eq('status', 'confirmed')
        .order('confirmed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch transparency stats
export const useTransparencyStats = () => {
  return useQuery({
    queryKey: ['transparency-stats'],
    queryFn: async () => {
      const { data: donations, error } = await supabase
        .from('donations')
        .select('amount, basket_type, campaign_id')
        .eq('status', 'confirmed');

      if (error) throw error;

      const stats = {
        totalAmount: 0,
        totalBaskets: 0,
        basketsByType: { P: 0, M: 0, G: 0 } as Record<BasketType, number>,
      };

      donations?.forEach((d) => {
        stats.totalAmount += Number(d.amount);
        stats.totalBaskets += 1;
        stats.basketsByType[d.basket_type] += 1;
      });

      return stats;
    },
  });
};

// Create donation
export const useCreateDonation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      basket_type: BasketType;
      amount: number;
      campaign_id?: string | null;
      anonymous: boolean;
      donor_name?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const referenceCode = `DON-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data: donation, error } = await supabase
        .from('donations')
        .insert({
          user_id: user.id,
          basket_type: data.basket_type,
          amount: data.amount,
          campaign_id: data.campaign_id || null,
          anonymous: data.anonymous,
          donor_name: data.anonymous ? 'Anônimo' : data.donor_name,
          reference_code: referenceCode,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return donation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast({
        title: 'Doação registrada',
        description: 'Sua doação foi registrada. Faça o pagamento via PIX.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar doação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Upload receipt
export const useUploadReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ donationId, file }: { donationId: string; file: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${donationId}-${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      // Update donation with receipt URL and status
      const { error: updateError } = await supabase
        .from('donations')
        .update({
          receipt_url: publicUrl,
          status: 'reviewing',
        })
        .eq('id', donationId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast({
        title: 'Comprovante enviado',
        description: 'Seu comprovante foi enviado para análise.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar comprovante',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Admin: Update donation status
export const useUpdateDonationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ donationId, status }: { donationId: string; status: DonationStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData: any = { status };
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.confirmed_by = user.id;
      }

      const { error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', donationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['confirmed-donations'] });
      queryClient.invalidateQueries({ queryKey: ['transparency-stats'] });
      toast({
        title: 'Status atualizado',
        description: 'O status da doação foi atualizado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Admin: Create/Update basket model
export const useManageBasketModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      title: string;
      description?: string;
      type: BasketType;
      price: number;
      active: boolean;
    }) => {
      if (data.id) {
        const { error } = await supabase
          .from('basket_models')
          .update({
            title: data.title,
            description: data.description,
            price: data.price,
            active: data.active,
          })
          .eq('id', data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('basket_models')
          .insert({
            title: data.title,
            description: data.description,
            type: data.type,
            price: data.price,
            active: data.active,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['basket-models'] });
      toast({
        title: 'Cesta salva',
        description: 'O modelo de cesta foi salvo com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar cesta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Admin: Manage campaign
export const useManageCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      title: string;
      description?: string;
      goal_amount?: number;
      goal_baskets?: number;
      active: boolean;
      end_date?: string;
    }) => {
      if (data.id) {
        const { error } = await supabase
          .from('donation_campaigns')
          .update({
            title: data.title,
            description: data.description,
            goal_amount: data.goal_amount,
            goal_baskets: data.goal_baskets,
            active: data.active,
            end_date: data.end_date,
          })
          .eq('id', data.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('donation_campaigns')
          .insert({
            title: data.title,
            description: data.description,
            goal_amount: data.goal_amount,
            goal_baskets: data.goal_baskets,
            active: data.active,
            end_date: data.end_date,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-campaigns'] });
      toast({
        title: 'Campanha salva',
        description: 'A campanha foi salva com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar campanha',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
