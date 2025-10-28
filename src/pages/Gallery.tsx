import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, Calendar, Loader2, Image, AlertCircle } from 'lucide-react';
import { CreateFolderDialog } from '@/components/gallery/CreateFolderDialog';
import { UploadMediaDialog } from '@/components/gallery/UploadMediaDialog';

export default function Gallery() {
  const { hasRole } = useAuth();
  const { folders, isLoading } = useGallery();

  const canManage = hasRole(['admin', 'social_media']);

  if (!canManage) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas administradores e social media podem acessar a galeria.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl md:ml-64">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Folder className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold gradient-text">Galeria</h1>
        </div>
        <p className="text-muted-foreground">
          Fotos e vídeos dos eventos e ações do movimento
        </p>
      </div>

      <div className="mb-6">
        <CreateFolderDialog />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : folders.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhuma pasta criada ainda</p>
            <p className="text-sm mt-2">Crie a primeira pasta para organizar fotos e vídeos!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Card key={folder.id} className="card-elevated cursor-pointer hover:scale-105 transition-transform">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{folder.name}</CardTitle>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground">{folder.description}</p>
                    )}
                  </div>
                  <UploadMediaDialog folderId={folder.id} />
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
