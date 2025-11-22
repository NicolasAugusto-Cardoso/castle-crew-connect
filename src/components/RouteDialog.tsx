import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CollaboratorRouteMap } from './CollaboratorRouteMap';

interface RouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboratorLat: number;
  collaboratorLng: number;
  collaboratorName: string;
}

export function RouteDialog({
  open,
  onOpenChange,
  collaboratorLat,
  collaboratorLng,
  collaboratorName,
}: RouteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Rota até {collaboratorName}</DialogTitle>
          <DialogDescription>
            Veja como chegar até o colaborador
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 w-full h-[calc(80vh-100px)]">
          <CollaboratorRouteMap 
            collaboratorLat={collaboratorLat}
            collaboratorLng={collaboratorLng}
            collaboratorName={collaboratorName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
