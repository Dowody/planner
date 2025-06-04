import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Calendar, Trash2, Clock } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Habit {
  id: string
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly'
  streak: number
  created_at: string
  last_completed_at?: string
  user_id?: string
}

export function Habits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    title: '',
    description: '',
    frequency: 'daily',
  })

  // Fetch habits from Supabase
  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError('Failed to load habits')
      setLoading(false)
      return
    }
    setHabits(data || [])
    setLoading(false)
  }

  const handleCreateHabit = async () => {
    if (!newHabit.title?.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to create a habit.')
      return
    }
    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          title: newHabit.title,
          description: newHabit.description,
          frequency: newHabit.frequency,
          streak: 0,
          user_id: user.id,
        }
      ])
      .select()
    if (error) {
      setError('Failed to add habit')
      return
    }
    if (data) setHabits([data[0], ...habits])
   
    // Also create a corresponding task for this habit in the tasks table
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .insert([
        {
          title: `${newHabit.title}`,
          description: newHabit.description || '(Habit related task)',
          due_date: null, // Or set a relevant due date based on frequency?
          completed: false,
          user_id: user.id,
          priority: 0,
          order_index: 0,
          habit_id: data[0].id,
        }
      ])
      .select();

    if (taskError) {
      console.error('Failed to create task for habit:', taskError);
      // Decide how to handle this error - maybe show a warning but don't block habit creation?
    }

    setNewHabit({ title: '', description: '', frequency: 'daily' })
  }

  const handleCompleteHabit = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    const lastCompleted = habit.last_completed_at
    const isConsecutive =
      lastCompleted &&
      new Date(today).getTime() - new Date(lastCompleted).getTime() === 24 * 60 * 60 * 1000
    const updatedHabit = {
      ...habit,
      streak: isConsecutive ? habit.streak + 1 : 1,
      last_completed_at: today,
    }
    const { error } = await supabase
      .from('habits')
      .update({
        streak: updatedHabit.streak,
        last_completed_at: updatedHabit.last_completed_at,
      })
      .eq('id', habitId)
    if (error) {
      setError('Failed to update habit')
      return
    }
    setHabits(habits.map(h => h.id === habitId ? updatedHabit : h))
  }

  const handleDeleteHabit = async (habitId: string) => {
    if (!window.confirm('Delete this habit?')) return
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
    if (error) {
      setError('Failed to delete habit')
      return
    }
    setHabits(habits.filter(h => h.id !== habitId))
  }

  const getStreakEmoji = (streak: number) => {
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '✨'
    return '⭐'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="container mx-auto p-4 pb-28"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Habits</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
              <DialogDescription>
                Start tracking a new habit
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newHabit.title}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newHabit.description}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newHabit.frequency}
                  onValueChange={(value: Habit['frequency']) =>
                    setNewHabit({ ...newHabit, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateHabit}>Create Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading habits...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : habits.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No habits yet. Add your first habit!</div>
      ) : (
        <AnimatePresence>
          <div className="grid gap-4">
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        
                        <CardTitle>{habit.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getStreakEmoji(habit.streak)} {habit.streak} day streak
                        </span>
                        <button
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete habit"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <CardDescription>{habit.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                        </div>
                        {habit.last_completed_at && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Last completed: {new Date(habit.last_completed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  )
} 