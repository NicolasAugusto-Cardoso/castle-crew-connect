import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Calendar, Loader2, Image, AlertCircle } from 'lucide-react';
import { CreateFolderDialog } from '@/components/gallery/CreateFolderDialog';
import { UploadMediaDialog } from '@/components/gallery/UploadMediaDialog';
import { useNavigate } from 'react-router-dom';

export default function Gallery() {
  const navigate = useNavigate();
  const { hasRole, loading: authLoading } = useAuth();
  const { folders, isLoading } = useGallery();

  const canManage = hasRole(['admin', 'social_media']);

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

      {canManage && (
        <div className="mb-6">
          <CreateFolderDialog />
        </div>
      )}

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
      ) : (
        <div className="grid gap-4 xs:gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Card 
              key={folder.id} 
              className="card-elevated cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => {
                // Don't navigate if clicking the upload button
                if ((e.target as HTMLElement).closest('button')) return;
                navigate(`/gallery/${folder.id}`);
              }}
            >
              <div className="aspect-video overflow-hidden bg-muted">
                {folder.cover_url ? (
                  <img
                    src={folder.cover_url}
                    alt={folder.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg break-words">{folder.name}</CardTitle>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground break-words">{folder.description}</p>
                    )}
                  </div>
                  {canManage && <div className="self-start xs:self-auto"><UploadMediaDialog folderId={folder.id} /></div>}
                </div>
              </CardHeader>
              <CardContent>
                {folder.event_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(folder.event_date).toLocaleDateString('pt-BR')}
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
