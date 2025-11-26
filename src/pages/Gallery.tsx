import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Calendar, Loader2, Image, Search } from 'lucide-react';
import { CreateFolderDialog } from '@/components/gallery/CreateFolderDialog';
import { UploadMediaDialog } from '@/components/gallery/UploadMediaDialog';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

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
        <div className="flex items-center gap-2 xs:gap-3 mb-2">
          <Folder className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8 text-primary flex-shrink-0" />
          <h1 className="text-2xl xs:text-2xl sm:text-3xl font-bold gradient-text">Galeria</h1>
        </div>
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
          {filteredFolders.map((folder) => (
            <Card 
              key={folder.id} 
              className="card-elevated cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => {
                // Don't navigate if clicking the upload button
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
                    <Folder className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader className="p-3 xs:p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm xs:text-base break-words line-clamp-2 flex-1">{folder.name}</CardTitle>
                    {canManage && (
                      <UploadMediaDialog folderId={folder.id} compact />
                    )}
                  </div>
                  {folder.description && (
                    <p className="text-xs text-muted-foreground break-words line-clamp-2">{folder.description}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 xs:p-4 pt-0">
                {folder.event_date && (
                  <div className="flex items-center gap-1.5 text-xs xs:text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                    <span>{new Date(folder.event_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
