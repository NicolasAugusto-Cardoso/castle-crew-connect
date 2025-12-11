import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { EditEventDialog } from '@/components/events/EditEventDialog';
import { cn } from '@/lib/utils';

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const {
    eventDetailsQuery,
    registrationsQuery,
    registerForEvent,
    cancelRegistration,
    deleteEvent,
    checkIn,
    undoCheckIn,
  } = useEvents();

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: event, isLoading: eventLoading } = eventDetailsQuery(eventId || '');
  const { data: registrations, isLoading: registrationsLoading } = registrationsQuery(eventId || '');

  const canManageEvents = hasRole(['admin', 'volunteer']);
  const canDelete = hasRole(['admin']);

  if (eventLoading) {
    return (
      <div className="space-y-4 pb-20">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-4 pb-20">
        <Button variant="ghost" onClick={() => navigate('/events')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Evento não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const isPast = isBefore(eventDate, startOfDay(new Date()));
  const isFull = event.max_participants && event.registration_count >= event.max_participants;

  const handleRegister = () => {
    if (eventId) {
      registerForEvent.mutate(eventId);
    }
  };

  const handleCancelRegistration = () => {
    if (eventId) {
      cancelRegistration.mutate(eventId);
    }
  };

  const handleDelete = () => {
    if (eventId) {
      deleteEvent.mutate(eventId, {
        onSuccess: () => navigate('/events'),
      });
    }
  };

  const handleCheckIn = (registrationId: string) => {
    if (eventId) {
      checkIn.mutate({ eventId, registrationId });
    }
  };

  const handleUndoCheckIn = (registrationId: string) => {
    if (eventId) {
      undoCheckIn.mutate({ eventId, registrationId });
    }
  };

  const checkedInCount = registrations?.filter((r) => r.checked_in).length || 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/events')} className="p-0">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        {canManageEvents && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)}>
              <Edit className="w-4 h-4" />
            </Button>
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todas as inscrições serão removidas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      {/* Cover Image */}
      {event.cover_image_url && (
        <div className="h-48 overflow-hidden rounded-lg">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Event Info */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
            <div className="flex flex-col items-end gap-1">
              {event.is_registered && (
                <Badge variant="default">Inscrito</Badge>
              )}
              {isPast && (
                <Badge variant="secondary">Encerrado</Badge>
              )}
            </div>
          </div>

          {event.description && (
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{format(eventDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(eventDate, 'HH:mm', { locale: ptBR })}
                {endDate && ` - ${format(endDate, 'HH:mm', { locale: ptBR })}`}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>
                {event.registration_count} inscrito{event.registration_count !== 1 ? 's' : ''}
                {event.max_participants && ` / ${event.max_participants} vagas`}
              </span>
            </div>
          </div>

          {/* Registration Button */}
          {!isPast && (
            <div className="pt-2">
              {event.is_registered ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Cancelar Inscrição
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar inscrição?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Você pode se inscrever novamente depois, se houver vagas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelRegistration}>
                        Cancelar Inscrição
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : isFull ? (
                <Button disabled className="w-full">
                  Evento Lotado
                </Button>
              ) : (
                <Button onClick={handleRegister} className="w-full" disabled={registerForEvent.isPending}>
                  {registerForEvent.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registrations & Check-in (for admins/volunteers) */}
      {canManageEvents && (
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registrations">
              Inscritos ({event.registration_count})
            </TabsTrigger>
            <TabsTrigger value="checkin">
              Check-in ({checkedInCount}/{event.registration_count})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lista de Inscritos</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {registrationsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : !registrations?.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum inscrito ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={registration.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {registration.profiles?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {registration.profiles?.name || 'Usuário'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(registration.registered_at), "dd/MM 'às' HH:mm")}
                          </p>
                        </div>
                        {registration.checked_in && (
                          <Badge variant="secondary" className="text-xs">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Presente
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkin" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Check-in de Presença</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {registrationsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : !registrations?.length ? (
                  <p className="text-sm text-muted-foreground">Nenhum inscrito para check-in.</p>
                ) : (
                  <div className="space-y-2">
                    {registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg transition-colors',
                          registration.checked_in ? 'bg-primary/10' : 'bg-muted/50'
                        )}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={registration.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {registration.profiles?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {registration.profiles?.name || 'Usuário'}
                          </p>
                          {registration.checked_in && registration.checked_in_at && (
                            <p className="text-xs text-muted-foreground">
                              Check-in: {format(new Date(registration.checked_in_at), "HH:mm")}
                            </p>
                          )}
                        </div>
                        {registration.checked_in ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoCheckIn(registration.id)}
                            disabled={undoCheckIn.isPending}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Desfazer
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCheckIn(registration.id)}
                            disabled={checkIn.isPending}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Check-in
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {event && (
        <EditEventDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          event={event}
        />
      )}
    </div>
  );
}
