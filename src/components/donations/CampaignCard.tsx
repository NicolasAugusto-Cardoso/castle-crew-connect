import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';
import {
  CardThemed,
  CardThemedHeader,
  CardThemedTitle,
  CardThemedContent,
} from '@/components/ui/themed-card';
import { COLOR_THEMES, getColorTheme, type ColorTheme } from '@/lib/colorThemes';
import { cn } from '@/lib/utils';

type DonationCampaign = Database['public']['Tables']['donation_campaigns']['Row'];

interface CampaignCardProps {
  campaign: DonationCampaign;
  onSelect?: (campaign: DonationCampaign) => void;
  selected?: boolean;
  currentAmount?: number;
  currentBaskets?: number;
  index?: number;
  colorTheme?: ColorTheme;
}

export const CampaignCard = ({
  campaign,
  onSelect,
  selected,
  currentAmount = 0,
  currentBaskets = 0,
  index = 0,
  colorTheme,
}: CampaignCardProps) => {
  const progressAmount = campaign.goal_amount
    ? Math.min((currentAmount / Number(campaign.goal_amount)) * 100, 100)
    : 0;
  const progressBaskets = campaign.goal_baskets
    ? Math.min((currentBaskets / campaign.goal_baskets) * 100, 100)
    : 0;

  const theme = colorTheme ?? getColorTheme(index);
  const t = COLOR_THEMES[theme];

  return (
    <CardThemed
      colorTheme={theme}
      className={cn(
        'cursor-pointer',
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        !campaign.active && 'opacity-60',
      )}
      onClick={() => onSelect?.(campaign)}
    >
      <CardThemedHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardThemedTitle colorTheme={theme} className="flex items-center gap-2">
            <Target className={cn('w-5 h-5', t.accent)} />
            {campaign.title}
          </CardThemedTitle>
          <Badge
            variant="outline"
            className={cn(
              'border-2',
              campaign.active ? `${t.border} ${t.title}` : 'border-muted text-muted-foreground',
            )}
          >
            {campaign.active ? 'Ativa' : 'Encerrada'}
          </Badge>
        </div>
        {campaign.end_date && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            Até {format(new Date(campaign.end_date), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        )}
      </CardThemedHeader>
      <CardThemedContent className="space-y-3">
        {campaign.description && (
          <p className="text-sm text-slate-300/80">{campaign.description}</p>
        )}

        {campaign.goal_amount && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Meta financeira</span>
              <span className={cn('font-medium', t.title)}>
                R$ {currentAmount.toFixed(2).replace('.', ',')} / R${' '}
                {Number(campaign.goal_amount).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <Progress value={progressAmount} className="h-2" />
          </div>
        )}

        {campaign.goal_baskets && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Meta de cestas</span>
              <span className={cn('font-medium', t.title)}>
                {currentBaskets} / {campaign.goal_baskets}
              </span>
            </div>
            <Progress value={progressBaskets} className="h-2" />
          </div>
        )}
      </CardThemedContent>
    </CardThemed>
  );
};
