import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';

type DonationCampaign = Database['public']['Tables']['donation_campaigns']['Row'];

interface CampaignCardProps {
  campaign: DonationCampaign;
  onSelect?: (campaign: DonationCampaign) => void;
  selected?: boolean;
  currentAmount?: number;
  currentBaskets?: number;
}

export const CampaignCard = ({ 
  campaign, 
  onSelect, 
  selected,
  currentAmount = 0,
  currentBaskets = 0,
}: CampaignCardProps) => {
  const progressAmount = campaign.goal_amount 
    ? Math.min((currentAmount / Number(campaign.goal_amount)) * 100, 100)
    : 0;
  const progressBaskets = campaign.goal_baskets 
    ? Math.min((currentBaskets / campaign.goal_baskets) * 100, 100)
    : 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      } ${!campaign.active ? 'opacity-60' : ''}`}
      onClick={() => onSelect?.(campaign)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {campaign.title}
          </CardTitle>
          <Badge variant={campaign.active ? 'default' : 'secondary'}>
            {campaign.active ? 'Ativa' : 'Encerrada'}
          </Badge>
        </div>
        {campaign.end_date && (
          <CardDescription className="flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            Até {format(new Date(campaign.end_date), "dd 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {campaign.description && (
          <p className="text-sm text-muted-foreground">{campaign.description}</p>
        )}
        
        {campaign.goal_amount && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Meta financeira</span>
              <span className="font-medium">
                R$ {currentAmount.toFixed(2).replace('.', ',')} / R$ {Number(campaign.goal_amount).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <Progress value={progressAmount} className="h-2" />
          </div>
        )}

        {campaign.goal_baskets && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Meta de cestas</span>
              <span className="font-medium">
                {currentBaskets} / {campaign.goal_baskets}
              </span>
            </div>
            <Progress value={progressBaskets} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
