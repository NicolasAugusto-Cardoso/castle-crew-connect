import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { Card, CardContent } from '@/components/ui/card';
import {
  CardThemed,
  CardThemedHeader,
  CardThemedTitle,
  CardThemedContent,
} from '@/components/ui/themed-card';
import { COLOR_THEMES, getColorTheme } from '@/lib/colorThemes';
import { cn } from '@/lib/utils';
import { Folder, Calendar, Loader2, Image, Search } from 'lucide-react';
import { CreateFolderDialog } from '@/components/gallery/CreateFolderDialog';
import { UploadMediaDialog } from '@/components/gallery/UploadMediaDialog';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/ui/section-heading';
import { getSectionTheme } from '@/lib/colorThemes';

export default function Gallery() {
  const navigate = useNavigate();
  const { hasRole, loading: authLoading } = useAuth();
  const { folders, isLoading } = useGallery();
  const [searchTerm, setSearchTerm] = useState('');

  const canManage = hasRole(['admin', 'social_media']);

  // Filtrar pastas por nome ou descrição
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 xs:px-4 sm:px-6 py-4 xs:py-5 sm:py-6 max-w-6xl">
      <div className="mb-6 xs:mb-7 sm:mb-8">
        <SectionHeading
          colorTheme={getSectionTheme('gallery')}
          as="h1"
          icon={<Folder className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8" />}
        >
          Galeria
        </SectionHeading>
        <p className="text-sm xs:text-base text-muted-foreground">
          Fotos e vídeos dos eventos e ações do movimento
        </p>
      </div>

      <div className="mb-6 space-y-4">
        {canManage && <CreateFolderDialog />}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar pastas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : folders.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3" />
            {canManage ? (
              <>
                <p>Nenhuma pasta criada ainda</p>
                <p className="text-sm mt-2">Crie a primeira pasta para organizar fotos e vídeos!</p>
              </>
            ) : (
              <>
                <p>Nenhum conteúdo publicado ainda</p>
                <p className="text-sm mt-2">Em breve teremos fotos e vídeos dos nossos eventos!</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : filteredFolders.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhuma pasta encontrada</p>
            <p className="text-sm mt-2">Tente buscar com outros termos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 xs:gap-4 sm:gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3">
          {filteredFolders.map((folder, idx) => {
            const theme = getColorTheme(idx);
            const t = COLOR_THEMES[theme];
            return (
              <CardThemed
                key={folder.id}
                colorTheme={theme}
                className="cursor-pointer overflow-hidden hover:scale-[1.02]"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  navigate(`/gallery/${folder.id}`);
                }}
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {folder.cover_url ? (
                    <img
                      src={folder.cover_url}
                      alt={folder.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder className={cn('w-12 h-12', t.accent)} />
                    </div>
                  )}
                </div>
                <CardThemedHeader className="p-3 xs:p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardThemedTitle
                        colorTheme={theme}
                        as="h3"
                        className="text-sm xs:text-base break-words line-clamp-2 flex-1"
                      >
                        {folder.name}
                      </CardThemedTitle>
                      {canManage && (
                        <UploadMediaDialog folderId={folder.id} compact />
                      )}
                    </div>
                    {folder.description && (
                      <p className="text-xs text-slate-400 break-words line-clamp-2">{folder.description}</p>
                    )}
                  </div>
                </CardThemedHeader>
                <CardThemedContent className="p-3 xs:p-4 pt-0">
                  {folder.event_date && (
                    <div className="flex items-center gap-1.5 text-xs xs:text-sm text-slate-400">
                      <Calendar className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                      <span>{new Date(folder.event_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </CardThemedContent>
              </CardThemed>
            );
          })}
        </div>
      )}
    </div>
  );
}
