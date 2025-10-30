import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGallery } from '@/hooks/useGallery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Loader2, Image, AlertCircle, Edit } from 'lucide-react';
import { UploadMediaDialog } from '@/components/gallery/UploadMediaDialog';
import { EditFolderDialog } from '@/components/gallery/EditFolderDialog';
import { MediaLightbox } from '@/components/gallery/MediaLightbox';
import { useState } from 'react';

export default function GalleryFolder() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const { hasRole, loading: authLoading } = useAuth();
  const { folders } = useGallery();
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  const canManage = hasRole(['admin', 'social_media']);

  const folder = folders.find(f => f.id === folderId);
  const { data: media = [], isLoading } = useGallery().getMediaByFolder(folderId || '');

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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

  if (!folder && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl md:ml-64">
        <Card className="card-elevated">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Pasta não encontrada</h2>
            <Button onClick={() => navigate('/gallery')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Galeria
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl md:ml-64">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/gallery')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">{folder?.name}</h1>
            {folder?.description && (
              <p className="text-muted-foreground">{folder.description}</p>
            )}
            {folder?.event_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Calendar className="w-4 h-4" />
                {new Date(folder.event_date).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {folder && <EditFolderDialog folder={folder} />}
            {folderId && <UploadMediaDialog folderId={folderId} />}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : media.length === 0 ? (
        <Card className="card-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3" />
            <p>Nenhuma mídia nesta pasta ainda</p>
            <p className="text-sm mt-2">Faça upload de fotos ou vídeos para começar!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item, index) => (
            <Card 
              key={item.id} 
              className="card-elevated cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              onClick={() => setSelectedMediaIndex(index)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {item.type.startsWith('image/') ? (
                  <img
                    src={item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedMediaIndex !== null && (
        <MediaLightbox
          media={media}
          currentIndex={selectedMediaIndex}
          onClose={() => setSelectedMediaIndex(null)}
          onNavigate={setSelectedMediaIndex}
        />
      )}
    </div>
  );
}
