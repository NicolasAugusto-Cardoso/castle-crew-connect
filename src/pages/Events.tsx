import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users, Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardThemed, CardThemedContent } from '@/components/ui/themed-card';
import { COLOR_THEMES, getColorTheme, getSectionTheme } from '@/lib/colorThemes';
import { SectionHeading } from '@/components/ui/section-heading';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEvents, useEventMutations, Event } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { EditEventDialog } from '@/components/events/EditEventDialog';
import { cn } from '@/lib/utils';

export default function Events() {
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();
  const { hasRole } = useAuth();
  const { deleteEvent } = useEventMutations();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const canManageEvents = hasRole(['admin', 'volunteer', 'social_media']);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.event_date), day));
  };

  // Get upcoming events
  const upcomingEvents = events.filter(
    (event) => new Date(event.event_date) >= startOfDay(new Date())
  );

  // Get events for selected date or all upcoming
  const displayEvents = selectedDate
    ? getEventsForDay(selectedDate)
    : upcomingEvents;

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    if (isSameDay(day, selectedDate || new Date(0))) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
    }
  };

  const handleEditClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEvent) {
      await deleteEvent.mutateAsync(selectedEvent.id);
      setDeleteDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const EventCard = ({ event, index = 0 }: { event: Event; index?: number }) => {
    const eventDate = new Date(event.event_date);
    const isPast = isBefore(eventDate, startOfDay(new Date()));
    const isFull = event.max_participants && event.registration_count >= event.max_participants;
    const theme = getColorTheme(index);
    const t = COLOR_THEMES[theme];

    return (
      <CardThemed
        colorTheme={theme}
        className={cn('cursor-pointer', isPast && 'opacity-60')}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {event.cover_image_url && (
          <div className="h-32 overflow-hidden rounded-t-xl">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardThemedContent className={cn('p-4', !event.cover_image_url && 'pt-4')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={cn('font-semibold truncate', t.title)}>{event.title}</h3>
              {event.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {event.is_registered && (
                <Badge variant="default" className="text-xs">Inscrito</Badge>
              )}
              {isFull && !event.is_registered && (
                <Badge variant="secondary" className="text-xs">Lotado</Badge>
              )}
              {canManageEvents && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={(e) => handleEditClick(event, e as unknown as React.MouseEvent)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteClick(event, e as unknown as React.MouseEvent)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className={cn('w-4 h-4 flex-shrink-0', t.accent)} />
              <span>
                {format(eventDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className={cn('w-4 h-4 flex-shrink-0', t.accent)} />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className={cn('w-4 h-4 flex-shrink-0', t.accent)} />
              <span>
                {event.registration_count} inscrito{event.registration_count !== 1 ? 's' : ''}
                {event.max_participants && ` / ${event.max_participants} vagas`}
              </span>
            </div>
          </div>
        </CardThemedContent>
      </CardThemed>
    );
  };

  return (
    <div className="space-y-4 pb-20 p-4">
      <div className="flex items-center justify-between">
        <SectionHeading colorTheme={getSectionTheme('events')} as="h1">Eventos</SectionHeading>
        {canManageEvents && (
          <Button onClick={() => setCreateDialogOpen(true)} size="sm" variant="neonBlue">
            <Plus className="w-4 h-4 mr-1" />
            Novo Evento
          </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <Card colorTheme="blue">
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-neon-blue mb-4 drop-shadow-[0_0_10px_hsl(var(--neon-blue)/0.6)]" />
                <p className="text-slate-300">
                  {canManageEvents
                    ? 'Nenhum evento agendado. Crie o primeiro!'
                    : 'Nenhum evento agendado no momento.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event, idx) => (
                <EventCard key={event.id} event={event} index={idx} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card colorTheme="purple">
            <CardContent className="p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="neonPurple" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-semibold capitalize text-neon-purple">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <Button variant="neonPurple" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        'aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-300 relative border border-transparent',
                        isToday(day) && 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/50 font-semibold shadow-[0_0_12px_-7px_hsl(var(--neon-yellow))]',
                        isSelected && 'bg-neon-purple/20 text-neon-purple border-neon-purple/70 shadow-[0_0_16px_-6px_hsl(var(--neon-purple)/0.75)]',
                        !isSelected && hasEvents && 'bg-neon-blue/10 text-neon-blue border-neon-blue/40',
                        !isSelected && !hasEvents && 'hover:bg-neon-blue/10 hover:text-neon-blue hover:border-neon-blue/40'
                      )}
                    >
                      {format(day, 'd')}
                      {hasEvents && !isSelected && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-neon-blue shadow-[0_0_6px_hsl(var(--neon-blue))]" />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events for selected date */}
          <div className="mt-4">
            <h3 className="font-semibold mb-3 text-foreground">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : 'Próximos Eventos'}
            </h3>
            {displayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedDate ? 'Nenhum evento nesta data.' : 'Nenhum evento agendado.'}
              </p>
            ) : (
              <div className="space-y-3">
                {displayEvents.map((event, idx) => (
                  <EventCard key={event.id} event={event} index={idx} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateEventDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      
      {selectedEvent && (
        <EditEventDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen} 
          event={selectedEvent}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o evento "{selectedEvent?.title}"? 
              Esta ação não pode ser desfeita e todas as inscrições serão removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
