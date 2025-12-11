import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEvents, Event } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { CreateEventDialog } from '@/components/events/CreateEventDialog';
import { cn } from '@/lib/utils';

export default function Events() {
  const navigate = useNavigate();
  const { events, isLoading } = useEvents();
  const { hasRole } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canManageEvents = hasRole(['admin', 'volunteer']);

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

  const EventCard = ({ event }: { event: Event }) => {
    const eventDate = new Date(event.event_date);
    const isPast = isBefore(eventDate, startOfDay(new Date()));
    const isFull = event.max_participants && event.registration_count >= event.max_participants;

    return (
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isPast && 'opacity-60'
        )}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {event.cover_image_url && (
          <div className="h-32 overflow-hidden rounded-t-lg">
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className={cn('p-4', !event.cover_image_url && 'pt-4')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
              {event.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {event.is_registered && (
                <Badge variant="default" className="text-xs">Inscrito</Badge>
              )}
              {isFull && !event.is_registered && (
                <Badge variant="secondary" className="text-xs">Lotado</Badge>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {format(eventDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>
                {event.registration_count} inscrito{event.registration_count !== 1 ? 's' : ''}
                {event.max_participants && ` / ${event.max_participants} vagas`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 pb-20 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
        {canManageEvents && (
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
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
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {canManageEvents
                    ? 'Nenhum evento agendado. Crie o primeiro!'
                    : 'Nenhum evento agendado no momento.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-lg font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
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
                        'aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative',
                        isToday(day) && 'bg-primary/10 font-semibold',
                        isSelected && 'bg-primary text-primary-foreground',
                        !isSelected && hasEvents && 'bg-accent',
                        !isSelected && !hasEvents && 'hover:bg-muted'
                      )}
                    >
                      {format(day, 'd')}
                      {hasEvents && !isSelected && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
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
                {displayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <CreateEventDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
