import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BIBLE_VERSIONS } from '@/hooks/useBible';

interface BibleVersionSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

// Only show PT-BR versions prominently
const PT_BR_VERSIONS = BIBLE_VERSIONS.filter(v => 
  ['nvi', 'ara', 'acf'].includes(v.value)
);

export const BibleVersionSelector = ({ value, onChange }: BibleVersionSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[320px] bg-background border-border rounded-xl h-11">
        <SelectValue placeholder="Selecione a versão" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {PT_BR_VERSIONS.map((version) => (
          <SelectItem 
            key={version.value} 
            value={version.value}
            className="rounded-lg"
          >
            {version.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};