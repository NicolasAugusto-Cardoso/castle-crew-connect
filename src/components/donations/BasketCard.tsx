import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type BasketModel = Database['public']['Tables']['basket_models']['Row'];

interface BasketCardProps {
  basket: BasketModel;
  onSelect: (basket: BasketModel) => void;
  selected?: boolean;
}

const BASKET_SIZE_LABELS = {
  P: 'Pequena',
  M: 'Média',
  G: 'Grande',
};

const BASKET_SIZE_COLORS = {
  P: 'bg-blue-100 text-blue-800',
  M: 'bg-green-100 text-green-800',
  G: 'bg-purple-100 text-purple-800',
};

export const BasketCard = ({ basket, onSelect, selected }: BasketCardProps) => {
  if (!basket.active) return null;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={() => onSelect(basket)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {basket.title}
          </CardTitle>
          <Badge className={BASKET_SIZE_COLORS[basket.type]}>
            {BASKET_SIZE_LABELS[basket.type]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {basket.description && (
          <p className="text-sm text-muted-foreground mb-3">{basket.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
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
      </CardContent>
    </Card>
  );
};
