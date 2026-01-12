import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BIBLE_VERSIONS } from '@/hooks/useBible';

interface BibleVersionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const BibleVersionSelector = ({ value, onChange }: BibleVersionSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[280px] bg-card border-border">
        <SelectValue placeholder="Selecione a versão" />
      </SelectTrigger>
      <SelectContent>
        {BIBLE_VERSIONS.map((version) => (
          <SelectItem key={version.value} value={version.value}>
            {version.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
