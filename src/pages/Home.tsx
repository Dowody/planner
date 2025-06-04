import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CheckSquare,
  Calendar,
  BookOpen,
  Target,
  BarChart2,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Goal,
  ListChecks,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

// For real tasks integration
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
  description: string | null
  target_date: string
  progress: number
  created_at: string
  user_id: string
  status: 'not-started' | 'in-progress' | 'completed'
  category?: 'year' | 'month' | 'week'
  year?: number | null
  month?: number | null
  week?: number | null
}

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

// New interface for weekly goals overview
interface WeeklyGoalOverview {
  id: string;
  title: string;
  description: string | null;
  status: string; // Assuming status is a string like 'not-started', 'in-progress', 'completed'
}

export function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoalOverview[]>([])
  const [weeklyGoalsLoading, setWeeklyGoalsLoading] = useState(true)
  const [weeklyGoalsError, setWeeklyGoalsError] = useState<string | null>(null)

  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
    fetchWeeklyGoals()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get authenticated user (already available from context, but keeping this for fetch logic)
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!authUser) throw new Error('No authenticated user')

      // Fetch all data in parallel
      const [tasksRes, habitsRes, goalsRes, notesRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', authUser.id),
        supabase.from('habits').select('*').eq('user_id', authUser.id),
        supabase.from('goals').select('*').eq('user_id', authUser.id),
        supabase.from('notes').select('*').eq('user_id', authUser.id)
      ])

      if (tasksRes.error) throw tasksRes.error
      if (habitsRes.error) throw habitsRes.error
      if (goalsRes.error) throw goalsRes.error
      if (notesRes.error) throw notesRes.error

      setTasks(tasksRes.data || [])
      setHabits(habitsRes.data || [])
      setGoals(goalsRes.data || [])
      setNotes(notesRes.data || [])
    } catch (err) {
      console.error('Error fetching home data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get the current week number within the month (1-4)
  function getWeekNumberInMonth(date: Date): number {
    const dayOfMonth = date.getDate()
    return Math.min(Math.ceil(dayOfMonth / 7), 4)
  }

  const fetchWeeklyGoals = async () => {
    setWeeklyGoalsLoading(true)
    setWeeklyGoalsError(null)

    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!authUser) throw new Error('No authenticated user')

      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1 // getMonth() is 0-indexed
      const currentWeek = getWeekNumberInMonth(now)

      const { data, error } = await supabase
        .from('goals')
        .select('id, title, description, status') // Select only necessary fields
        .eq('user_id', authUser.id)
        .eq('category', 'week')
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .eq('week', currentWeek)
        .neq('status', 'completed') // Exclude completed goals
        .order('created_at', { ascending: true })

      if (error) throw error

      setWeeklyGoals(data || [])
    } catch (err) {
      console.error('Error fetching weekly goals:', err)
      setWeeklyGoalsError(err instanceof Error ? err.message : 'Failed to load weekly goals')
    } finally {
      setWeeklyGoalsLoading(false)
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

  // Calculate stats
  const stats = {
    tasksCompleted: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
    habitsStreak: Math.max(0, ...habits.map(h => h.streak)),
    goalsProgress: goals.length > 0 
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
      : 0,
    notesCount: notes.length,
    eventsToday: tasksDueToday.length,
    completedGoals: goals.filter(g => g.status === 'completed').length,
    totalHabits: habits.length,
    overdueTasks: tasks.filter(task => {
      if (task.completed || !task.due_date) return false;
      const taskDueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return taskDueDate < today;
    }).length
  }

  const quickLinks = [
    {
      title: 'Tasks',
      description: 'Manage your tasks',
      icon: CheckSquare,
      href: '/tasks',
      color: 'text-blue-500',
    },
    {
      title: 'Calendar',
      description: 'View your schedule',
      icon: Calendar,
      href: '/calendar',
      color: 'text-green-500',
    },
    {
      title: 'Notes',
      description: 'Access your notes',
      icon: BookOpen,
      href: '/notes',
      color: 'text-purple-500',
    },
    {
      title: 'Habits',
      description: 'Track your habits',
      icon: Target,
      href: '/habits',
      color: 'text-orange-500',
    },
    {
      title: 'Goals',
      description: 'Monitor your goals',
      icon: Target,
      href: '/goals',
      color: 'text-red-500',
    },
    {
      title: 'Analytics',
      description: 'View your progress',
      icon: BarChart2,
      href: '/analytics',
      color: 'text-indigo-500',
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  }

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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto px-4 py-6 md:py-8 pb-28"
    >
      {/* Ultra-minimal Premium Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center justify-center text-center mb-14"
      >
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight"
        >
          {greeting}, {user?.email?.split('@')[0] || 'Guest'}!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="text-lg text-gray-600 mb-8"
        >
          {formattedDate}
        </motion.p>

        {/* Plan Goals Button */}
        <div className='flex flex-row gap-4'>
        <motion.div variants={itemVariants}>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => navigate('/goals')}
          >
            <Goal className="mr-2 h-5 w-5" />
            Plan Your Goals
          </Button>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Button 
            variant="default" 
            size="lg"
            onClick={() => navigate('/tasks')}
          >
            <ListChecks className="mr-2 h-5 w-5" />
            Plan Your Day
          </Button>
        </motion.div>
        </div>
        
      </motion.div>

      {/* Weekly Goals Overview */}
      <motion.div variants={itemVariants} className="mb-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">This Week's Focus</h2>

        {weeklyGoalsLoading ? (
          <div className="text-center text-gray-500">Loading weekly goals...</div>
        ) : weeklyGoalsError ? (
          <div className="text-center text-red-500">{weeklyGoalsError}</div>
        ) : weeklyGoals.length === 0 ? (
          <div className="text-center text-gray-500">No goals planned for this week.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weeklyGoals.map((goal) => (
              <Card key={goal.id} className="flex flex-col">
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${goal.status === 'completed' ? 'bg-green-100 text-green-800' : goal.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {goal.status}
                  </span>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600">{goal.description || 'No description'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Stats Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Progress</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.tasksCompleted}/{stats.totalTasks}
              </motion.div>
              <Progress
                value={(stats.tasksCompleted / stats.totalTasks) * 100}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Habits Streak</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.habitsStreak} days
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Current streak
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.goalsProgress}%
              </motion.div>
              <Progress value={stats.goalsProgress} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.notesCount}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Total notes
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.eventsToday}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Events scheduled
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.completedGoals}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Total completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold"
              >
                {stats.totalHabits}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Habits tracked
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl md:text-2xl font-bold text-destructive"
              >
                {stats.overdueTasks}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks past due date
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.h2
        variants={itemVariants}
        className="text-lg md:text-xl font-semibold mb-4"
      >
        Quick Links
      </motion.h2>

      <motion.div
        variants={containerVariants}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {quickLinks.map((link, i) => (
          <motion.div key={link.title} variants={itemVariants}>
            <Link
              to={link.href}
              className="block rounded-xl border border-muted bg-white hover:bg-muted/40 transition-colors p-6 text-center group"
            >
              <div className="flex justify-center mb-2">
                <link.icon className={`h-8 w-8 ${link.color} mb-1`} />
              </div>
              <div className="font-semibold text-lg mb-1 group-hover:underline">
                {link.title}
              </div>
              <div className="text-muted-foreground text-sm">
                {link.description}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
