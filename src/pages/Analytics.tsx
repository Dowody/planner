import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts'
import { CheckCircle2, TrendingUp, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const COLORS = ['#6366f1', '#22d3ee', '#f59e42', '#10b981', '#f43f5e']

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

export function Analytics() {
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
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  // --- Task completion per day (last 14 days) ---
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (13 - i))
    return d
  })
  const taskStats = days.map((d) => {
    const dateStr = d.toISOString().split('T')[0]
    const completed = tasks.filter(t => t.completed && t.created_at.slice(0, 10) === dateStr).length
    return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), completed }
  })

  // --- Habit streaks ---
  const habitStreaks = habits.map(h => ({ name: h.title, streak: h.streak }))

  // --- Goal progress ---
  const goalProgress = goals.length > 0 ? goals.map(g => ({ name: g.title, progress: g.progress || 0 })) : []

  // --- Fun stats ---
  const bestDay = taskStats.reduce((max, d) => d.completed > max.completed ? d : max, { completed: 0, date: '' })
  const longestStreak = Math.max(0, ...habits.map(h => h.streak))
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading analytics...</div>
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
      className="container mx-auto p-4 pb-28"
    >
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Task Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tasks Completed (Last 2 Weeks)</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStats}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Habit Streaks Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Habit Streaks</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitStreaks} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="streak" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Goal Progress Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-56 flex items-center justify-center">
            {goalProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalProgress}
                    dataKey="progress"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                  >
                    {goalProgress.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 text-sm">No goals yet</div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Fun Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-green-500" /> Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{completionRate}%</div>
            <div className="text-xs text-gray-500">{completedTasks} of {totalTasks} tasks completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" /> Best Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{bestDay.completed}</div>
            <div className="text-xs text-gray-500">Most tasks completed on {bestDay.date}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" /> Longest Habit Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">{longestStreak} days</div>
            <div className="text-xs text-gray-500">Keep it up!</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
} 