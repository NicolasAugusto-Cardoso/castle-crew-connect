import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import {
  CardThemed,
  CardThemedHeader,
  CardThemedTitle,
  CardThemedContent,
} from '@/components/ui/themed-card';
import { COLOR_THEMES, getColorTheme, type ColorTheme } from '@/lib/colorThemes';
import { cn } from '@/lib/utils';

type BasketModel = Database['public']['Tables']['basket_models']['Row'];

interface BasketCardProps {
  basket: BasketModel;
  onSelect: (basket: BasketModel) => void;
  selected?: boolean;
  /** Position in the grid — drives the rotating color theme. */
  index?: number;
  /** Override the auto-rotated color. */
  colorTheme?: ColorTheme;
}

const BASKET_SIZE_LABELS = {
  P: 'Econômica',
  M: 'Clássica',
  G: 'Master',
};

export const BasketCard = ({
  basket,
  onSelect,
  selected,
  index = 0,
  colorTheme,
}: BasketCardProps) => {
  if (!basket.active) return null;

  const theme = colorTheme ?? getColorTheme(index);
  const t = COLOR_THEMES[theme];

  return (
    <CardThemed
      colorTheme={theme}
      className={cn(
        'cursor-pointer',
        selected && 'ring-2 ring-offset-2 ring-offset-background',
        selected && t.ring.replace('focus-visible:', ''),
      )}
      onClick={() => onSelect(basket)}
    >
      <CardThemedHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardThemedTitle colorTheme={theme} className="flex items-center gap-2">
            <Package className={cn('w-5 h-5', t.accent)} />
            {basket.title}
          </CardThemedTitle>
          <Badge variant="outline" className={cn('border-2', t.border, t.title)}>
            {BASKET_SIZE_LABELS[basket.type]}
          </Badge>
        </div>
      </CardThemedHeader>
      <CardThemedContent>
        {basket.description && (
          <p className="text-sm text-slate-300/80 mb-3">{basket.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className={cn('text-2xl font-bold', t.title)}>
            R$ {Number(basket.price).toFixed(2).replace('.', ',')}
          </span>
          <Button
            variant={selected ? 'default' : 'outline'}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(basket);
            }}
          >
            {selected ? 'Selecionada' : 'Selecionar'}
          </Button>
        </div>
      </CardThemedContent>
    </CardThemed>
  );
};
