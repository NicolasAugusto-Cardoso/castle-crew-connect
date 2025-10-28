import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Folder, Calendar } from 'lucide-react';
import { GalleryFolder } from '@/types';

const mockFolders: GalleryFolder[] = [
  {
    id: '1',
    name: 'Ação Unimar - Out/2024',
    description: 'Ação evangelística realizada na Universidade de Marília',
    thumbnail: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600',
    date: '2024-10-15',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Culto Jovem - Set/2024',
    description: 'Encontro de jovens com louvor e palavra',
    thumbnail: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600',
    date: '2024-09-20',
    createdAt: new Date().toISOString(),
  },
];

export default function Gallery() {
  const { hasRole } = useAuth();
  const [folders] = useState<GalleryFolder[]>(mockFolders);

  useEffect(() => {
    if (!hasRole(['admin', 'social_media'])) {
      window.location.href = '/';
    }
  }, [hasRole]);

  if (!hasRole(['admin', 'social_media'])) {
    return null;
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

      <Button className="w-full mb-6 h-14 btn-gradient text-base">
        <Plus className="w-5 h-5 mr-2" />
        Nova Pasta
      </Button>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card key={folder.id} className="card-elevated cursor-pointer hover:scale-105 transition-transform">
            <div className="aspect-video overflow-hidden">
              <img
                src={folder.thumbnail}
                alt={folder.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{folder.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{folder.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(folder.date).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
