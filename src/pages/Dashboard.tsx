import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, AlertCircle, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
  user_id: string
  priority: number
  order_index: number
  habit_id: string | null
}

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

interface Goal {
  id: string
  title: string
  description: string
  target_date: string
  progress: number
  created_at: string
  user_id: string
}

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No authenticated user')

      // Fetch tasks, habits, and goals in parallel
      const [tasksRes, habitsRes, goalsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id)
      ])

      if (tasksRes.error) throw tasksRes.error
      if (habitsRes.error) throw habitsRes.error
      if (goalsRes.error) throw goalsRes.error

      setTasks(tasksRes.data || [])
      setHabits(habitsRes.data || [])
      setGoals(goalsRes.data || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const timeOfDay = today.getHours()
  let greeting = 'Good morning'
  if (timeOfDay >= 12 && timeOfDay < 17) {
    greeting = 'Good afternoon'
  } else if (timeOfDay >= 17) {
    greeting = 'Good evening'
  }

  const tasksDueToday = tasks.filter(task => {
    if (task.completed) return false
    const taskDate = new Date(task.due_date || '')
    return taskDate.toDateString() === today.toDateString()
  })

  const completedTasksToday = tasks.filter(task => {
    if (!task.completed) return false
    const completedDate = new Date(task.created_at)
    return completedDate.toDateString() === today.toDateString()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="container mx-auto p-4"
    >
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-8 mb-6 border border-blue-100"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {greeting}
                </h1>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-6 w-6 text-blue-500" />
                  <span className="text-lg">{formattedDate}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-sm text-gray-500">Current Time</div>
                <div className="text-2xl font-semibold text-gray-700">
                  {today.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white/50 backdrop-blur-sm border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    Today's Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-blue-600">{tasksDueToday.length}</span>
                    <span className="text-gray-600">tasks due today</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/50 backdrop-blur-sm border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Completed Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-green-600">{completedTasksToday.length}</span>
                    <span className="text-gray-600">tasks completed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Active Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-orange-600">{habits.length}</span>
              <span className="text-gray-600">habits tracked</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-purple-600">{goals.length}</span>
              <span className="text-gray-600">goals in progress</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Task Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald-600">
                {tasks.length > 0 
                  ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
                  : 0}%
              </span>
              <span className="text-gray-600">completion rate</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
} 