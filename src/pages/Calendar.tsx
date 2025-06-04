import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  date: string
  type: 'meeting' | 'task' | 'reminder' | 'other'
  user_id: string
  created_at: string
  updated_at: string
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDayViewOpen, setIsDayViewOpen] = useState(false)

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    date: '',
    type: 'other',
  })

  // Fetch events from Supabase
  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to view events')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) {
        throw error
      }

      setEvents(data || [])
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!newEvent.title?.trim()) {
      console.log('Event title is empty, not inserting.')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to create events')
        return
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([
          {
            title: newEvent.title,
            description: newEvent.description,
            start_time: newEvent.start_time,
            end_time: newEvent.end_time,
            date: newEvent.date,
            type: newEvent.type,
            user_id: user.id,
          }
        ])
        .select()

      if (error) {
        throw error
      }

      if (data) {
        setEvents([...events, data[0]])
        setNewEvent({
          title: '',
          description: '',
          start_time: '',
          end_time: '',
          date: '',
          type: 'other',
        })
        setIsDialogOpen(false)
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError('Failed to create event')
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.date === date)
  }

  const isToday = (dateString: string) => {
    const today = new Date()
    const [y, m, d] = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    return dateString === `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const getEventTypeDot = (type: Event['type']) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-500'
      case 'task':
        return 'bg-green-500'
      case 'reminder':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    setIsDayViewOpen(true)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId)

      if (error) {
        throw error
      }

      // Update local state
      setEvents(events.filter(event => event.id !== eventId))
    } catch (err) {
      console.error('Error deleting event:', err)
      setError('Failed to delete event')
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const adjustedFirstDay = (firstDay === 0 ? 6 : firstDay - 1)
    const days = []
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 sm:h-24 border border-transparent bg-transparent"></div>
      )
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayEvents = getEventsForDate(date)
      const today = isToday(date)
      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(date)}
          className={
            `relative h-20 sm:h-24 rounded-lg border border-neutral-200 bg-white p-2 flex flex-col transition-all duration-200 cursor-pointer ` +
            (today ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : 'hover:bg-muted/40')
          }
        >
          <div className={`font-semibold mb-1 text-xs sm:text-sm md:text-base ${today ? 'text-primary' : ''}`}>{day}</div>
          <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {dayEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="flex items-center gap-1 truncate">
                <span className={`w-2 h-2 rounded-full ${getEventTypeDot(event.type)}`}></span>
                <span className="truncate text-xs text-muted-foreground">{event.title}</span>
              </div>
            ))}
            {dayEvents.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</span>
            )}
          </div>
        </div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-neutral-200 bg-background p-2 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm font-medium text-muted-foreground">
            {dayNames.map(name => <div key={name}>{name}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mt-2">
            {days}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8 pb-28">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Calendar</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new event to your calendar
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEvent.start_time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEvent.end_time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value: Event['type']) =>
                    setNewEvent({ ...newEvent, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateEvent}>Create Event</Button>
            </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="min-w-[320px] sm:min-w-[600px] md:min-w-[800px] px-2 sm:px-0">
          {loading ? (
            <div className="text-center text-gray-400 py-12">Loading events...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-12">{error}</div>
          ) : (
            renderCalendar()
          )}
        </div>
      </div>

      {/* Day View Bottom Sheet */}
      <AnimatePresence>
        {isDayViewOpen && selectedDate && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-lg border border-neutral-200"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{formatDate(selectedDate)}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsDayViewOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No events scheduled for this day
                  </div>
                ) : (
                  getEventsForDate(selectedDate)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time))
                    .map((event) => (
                      <Card key={event.id} className="border-neutral-200">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${getEventTypeDot(event.type)}`}></span>
                              <CardTitle className="text-base">{event.title}</CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <CardDescription className="text-sm">
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </CardDescription>
                        </CardHeader>
                        {event.description && (
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-gray-600">{event.description}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 