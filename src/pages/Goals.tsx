import { useState, useRef, useEffect } from 'react'
import { Plus, Target, Calendar, TrendingUp, CheckCircle2, ChevronDown, Pencil, Trash2, PlusCircle, RotateCcw, History } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import type { Goal, Milestone } from '@/lib/supabase'
import { toast } from 'sonner'

export type GoalCategory = 'year' | 'month' | 'week'
export type GoalType = 'all' | 'personal' | 'career' | 'health' | 'financial'

export function Goals() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentWeek = getWeekNumberInMonth(now)

  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('year')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedWeek, setSelectedWeek] = useState(currentWeek)
  const [selectedType, setSelectedType] = useState<GoalType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogCategory, setDialogCategory] = useState<GoalCategory>('year')
  const [selectedParentGoal, setSelectedParentGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const typeRef = useRef<HTMLSelectElement>(null)
  const yearRef = useRef<HTMLSelectElement>(null)
  const monthRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '' })
  const [showMilestoneForm, setShowMilestoneForm] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([])

  const { user } = useAuth()
  const navigate = useNavigate()

  // Fetch goals from Supabase
  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    fetchGoals()
    fetchCompletedGoals()
  }, [user, navigate])

  const fetchGoals = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      setError('Failed to load goals')
      toast.error('Failed to load goals')
    } else {
      setGoals(data || [])
    }
    setLoading(false)
  }

  const fetchCompletedGoals = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching completed goals:', error)
      toast.error('Failed to load completed goals')
    } else {
      // Ensure month and year are populated from updated_at if missing
      const processedGoals = data ? data.map(goal => {
        const completionDate = new Date(goal.updated_at);
        return {
          ...goal,
          year: goal.year || completionDate.getFullYear(),
          month: goal.month || (completionDate.getMonth() + 1) // getMonth() is 0-indexed
        };
      }) : [];
      setCompletedGoals(processedGoals);
    }
  }

  const years = Array.from(new Set(goals.filter(g => g.category === 'year' || g.category === 'month').map(g => g.year).concat(currentYear))).sort((a, b) => b! - a!)
  const months = [1,2,3,4,5,6,7,8,9,10,11,12]

  // Helper function to get week number within a month (1-4)
  function getWeekNumberInMonth(date: Date): number {
    const dayOfMonth = date.getDate()
    return Math.min(Math.ceil(dayOfMonth / 7), 4)
  }

  // Helper function to get weeks in a month (always 1-4)
  function getWeeksInMonth(year: number, month: number): number[] {
    return [1, 2, 3, 4]
  }

  // Filter goals based on category and parent relationships
  let filteredGoals = goals
  if (selectedCategory === 'year') {
    filteredGoals = goals.filter(goal => 
      goal.category === 'year' && 
      goal.year === selectedYear
    )
  } else if (selectedCategory === 'month') {
    filteredGoals = goals.filter(goal => 
      goal.category === 'month' && 
      goal.year === selectedYear && 
      goal.month === selectedMonth
    )
  } else if (selectedCategory === 'week') {
    filteredGoals = goals.filter(goal => 
      goal.category === 'week' && 
      goal.year === selectedYear && 
      goal.month === selectedMonth &&
      goal.week === selectedWeek
    )
  }

  // Filter by type
  if (selectedType !== 'all') {
    filteredGoals = filteredGoals.filter(goal => goal.type === selectedType)
  }

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Month names for pills
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const handleAddGoal = async () => {
    if (!user) {
      toast.error('You must be logged in to create goals')
      return
    }

    const title = dialogCategory === 'year' ? (titleRef.current?.value?.trim() || '') : selectedParentGoal?.title || ''
    const description = dialogCategory === 'year' ? (descRef.current?.value?.trim() || '') : selectedParentGoal?.description || ''
    const category = dialogCategory
    const type = dialogCategory === 'year' ? (typeRef.current?.value as GoalType) : selectedParentGoal?.type || 'personal'
    const year = selectedYear
    const month = category === 'month' || category === 'week' ? selectedMonth : null
    const week = category === 'week' ? selectedWeek : null
    const targetDate = dateRef.current?.value ? new Date(dateRef.current.value) : new Date()
    
    if (dialogCategory === 'year' && !title) {
      toast.error('Please enter a goal title')
      return
    }

    // Validate parent goal relationship
    if (category === 'month' && !selectedParentGoal) {
      toast.error('Please select a parent year goal')
      return
    }
    if (category === 'week' && !selectedParentGoal) {
      toast.error('Please select a parent month goal')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          title,
          description: description || null,
          category,
          type,
          year,
          month,
          week,
          target_date: targetDate.toISOString(),
          progress: 0,
          status: 'not-started',
          user_id: user.id,
          parent_goal_id: selectedParentGoal?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()

      if (error) {
        console.error('Error adding goal:', error)
        setError('Failed to add goal')
        toast.error('Failed to add goal')
      } else if (data) {
        setGoals([...goals, data[0]])
        toast.success('Goal added successfully')
        setDialogOpen(false)
        setTimeout(() => {
          if (titleRef.current) titleRef.current.value = ''
          if (descRef.current) descRef.current.value = ''
          if (dateRef.current) dateRef.current.value = ''
          setDialogCategory('year')
          setSelectedParentGoal(null)
        }, 100)
      }
    } catch (err) {
      console.error('Error adding goal:', err)
      setError('Failed to add goal')
      toast.error('Failed to add goal')
    } finally {
      setLoading(false)
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    if (titleRef.current) titleRef.current.value = goal.title
    if (descRef.current) descRef.current.value = goal.description || ''
    if (typeRef.current) typeRef.current.value = goal.type
    setDialogCategory(goal.category)
    if (yearRef.current) yearRef.current.value = goal.year?.toString() || ''
    if (monthRef.current) monthRef.current.value = goal.month?.toString() || ''
    if (dateRef.current) dateRef.current.value = new Date(goal.target_date).toISOString().split('T')[0]
    setIsEditing(true)
    setDialogOpen(true)
  }

  const handleUpdateGoal = async () => {
    if (!editingGoal || !user) return

    const title = titleRef.current?.value?.trim() || ''
    const description = descRef.current?.value?.trim() || ''
    const type = typeRef.current?.value as GoalType
    const category = dialogCategory
    const year = category === 'month' ? (yearRef.current ? parseInt(yearRef.current.value) : selectedYear) : 
                category === 'year' ? selectedYear : null
    const month = category === 'month' ? (monthRef.current ? parseInt(monthRef.current.value) : selectedMonth) : null
    const targetDate = dateRef.current?.value ? new Date(dateRef.current.value) : new Date()
    
    if (!title) {
      toast.error('Please enter a goal title')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('goals')
      .update({
          title,
          description,
        type,
          category,
          year,
          month,
          target_date: targetDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', editingGoal.id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Error updating goal:', error)
      setError('Failed to update goal')
      toast.error('Failed to update goal')
    } else if (data) {
      setGoals(goals.map(goal => goal.id === data[0].id ? data[0] : goal))
      toast.success('Goal updated successfully')
      setDialogOpen(false)
      setEditingGoal(null)
      setIsEditing(false)
    }
    setLoading(false)
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!user) return
    if (!window.confirm('Are you sure you want to delete this goal?')) return

    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting goal:', error)
      setError('Failed to delete goal')
      toast.error('Failed to delete goal')
    } else {
      setGoals(goals.filter(goal => goal.id !== goalId))
      setCompletedGoals(completedGoals.filter(goal => goal.id !== goalId))
      toast.success('Goal deleted successfully')
    }
    setLoading(false)
  }

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('goals')
      .update({
        progress,
        status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started',
        updated_at: new Date().toISOString()
      })
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()

    if (error) {
      console.error('Error updating progress:', error)
      setError('Failed to update progress')
      toast.error('Failed to update progress')
    } else if (data) {
      setGoals(goals.map(goal => goal.id === data[0].id ? data[0] : goal))
      toast.success('Progress updated successfully')
    }
    setLoading(false)
  }

  const handleAddMilestone = async (goalId: string) => {
    if (!user || !newMilestone.title.trim() || !newMilestone.dueDate) {
      toast.error('Please fill in all milestone fields')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('milestones')
      .insert([
        {
          goal_id: goalId,
          title: newMilestone.title.trim(),
          due_date: new Date(newMilestone.dueDate).toISOString(),
          completed: false,
          user_id: user.id
        }
      ])
      .select()

    if (error) {
      console.error('Error adding milestone:', error)
      setError('Failed to add milestone')
      toast.error('Failed to add milestone')
    } else if (data) {
      await fetchGoals()
      setNewMilestone({ title: '', dueDate: '' })
      setShowMilestoneForm(null)
      toast.success('Milestone added successfully')
    }
    setLoading(false)
  }

  const handleToggleMilestone = async (goalId: string, milestoneId: string, completed: boolean) => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('milestones')
      .update({
        completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestoneId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating milestone:', error)
      setError('Failed to update milestone')
      toast.error('Failed to update milestone')
    } else {
      await fetchGoals()
      toast.success('Milestone updated successfully')
    }
    setLoading(false)
  }

  const handleDeleteMilestone = async (goalId: string, milestoneId: string) => {
    if (!user) return
    if (!window.confirm('Are you sure you want to delete this milestone?')) return

    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting milestone:', error)
      setError('Failed to delete milestone')
      toast.error('Failed to delete milestone')
    } else {
      await fetchGoals()
      toast.success('Milestone deleted successfully')
    }
    setLoading(false)
  }

  // Helper function to get parent goal
  const getParentGoal = (goal: Goal) => {
    if (!goal.parent_goal_id) return null
    return goals.find(g => g.id === goal.parent_goal_id)
  }

  // Helper function to get child goals
  const getChildGoals = (goal: Goal) => {
    return goals.filter(g => g.parent_goal_id === goal.id)
  }

  // Helper function to calculate progress based on child goals
  const calculateProgressFromChildren = (goal: Goal) => {
    const childGoals = getChildGoals(goal)
    if (childGoals.length === 0) return goal.progress

    const totalProgress = childGoals.reduce((sum, child) => sum + child.progress, 0)
    return Math.round(totalProgress / childGoals.length)
  }

  // Update progress when child goals change
  useEffect(() => {
    const updateParentProgress = async (goal: Goal) => {
      const parentGoal = getParentGoal(goal)
      if (parentGoal) {
        const newProgress = calculateProgressFromChildren(parentGoal)
        if (newProgress !== parentGoal.progress) {
          await handleUpdateProgress(parentGoal.id, newProgress)
        }
      }
    }

    goals.forEach(goal => {
      updateParentProgress(goal)
    })
  }, [goals])

  const handleCompleteGoal = async (goalId: string) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('goals')
        .update({
          progress: 100,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('Error completing goal:', error)
        setError('Failed to complete goal')
        toast.error('Failed to complete goal')
      } else if (data) {
        setGoals(goals.filter(goal => goal.id !== goalId))
        setCompletedGoals([data[0], ...completedGoals])
        toast.success('Goal completed successfully')
      }
    } catch (err) {
      console.error('Error completing goal:', err)
      setError('Failed to complete goal')
      toast.error('Failed to complete goal')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading goals...</div>
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
      className="container mx-auto px-4 py-4 md:px-6 md:py-6 pb-28"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-2">
        <h1 className="text-3xl font-bold">Goals</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Hide History' : 'Show History'}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setSelectedParentGoal(null)
              setDialogCategory('year')
            }
          }}>
          <DialogTrigger asChild>
              <Button type="button" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new goal to achieve your dreams
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={dialogCategory}
                  onChange={(e) => {
                      const newCategory = e.target.value as GoalCategory
                    setDialogCategory(newCategory)
                      setSelectedParentGoal(null)
                      if (titleRef.current) titleRef.current.value = ''
                      if (descRef.current) descRef.current.value = ''
                      if (typeRef.current) typeRef.current.value = 'personal'
                  }}
                >
                  <option value="year">Year</option>
                  <option value="month">Month</option>
                    <option value="week">Week</option>
                </select>
              </div>

                {(dialogCategory === 'month' || dialogCategory === 'week') && (
                  <div className="grid gap-2">
                    <Label>Parent Goal</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={selectedParentGoal?.id || ''}
                      onChange={(e) => {
                        const parentGoal = goals.find(g => g.id === e.target.value)
                        setSelectedParentGoal(parentGoal || null)
                        if (parentGoal) {
                          if (titleRef.current) titleRef.current.value = parentGoal.title
                          if (descRef.current) descRef.current.value = parentGoal.description || ''
                          if (typeRef.current) typeRef.current.value = parentGoal.type
                        } else {
                          if (titleRef.current) titleRef.current.value = ''
                          if (descRef.current) descRef.current.value = ''
                          if (typeRef.current) typeRef.current.value = 'personal'
                        }
                      }}
                >
                      <option value="">Select a parent goal</option>
                      {goals
                        .filter(g => 
                          dialogCategory === 'month' 
                            ? g.category === 'year' && g.year === selectedYear
                            : g.category === 'month' && g.year === selectedYear && g.month === selectedMonth
                        )
                        .map(g => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))
                      }
                </select>
              </div>
                )}

                {dialogCategory === 'year' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="title">Goal Title</Label>
                      <Input id="title" placeholder="Enter goal title" ref={titleRef} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" placeholder="Enter description" ref={descRef} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                <select 
                        id="type"
                        ref={typeRef}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        defaultValue="personal"
                >
                        <option value="personal">Personal</option>
                        <option value="career">Career</option>
                        <option value="health">Health</option>
                        <option value="financial">Financial</option>
                </select>
              </div>
                  </>
                )}

              <div className="grid gap-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input type="date" id="targetDate" ref={dateRef} />
              </div>
                <Button 
                  onClick={handleAddGoal} 
                  className="mt-2 w-full" 
                  variant="default"
                  type="button"
                >
                  Add Goal
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {showHistory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Goals Roadmap</h2>
          {/* Desktop Timeline */}
          <div className="hidden sm:block space-y-12">
            <AnimatePresence>
              {Array.from(new Set(completedGoals.map(g => g.year))).sort((a, b) => b! - a!).map((year, yearIndex) => (
                typeof year !== 'number' || year === null ? null : (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: yearIndex * 0.1 }}
                    className="relative"
                  >
                    {/* Year Timeline */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    <div className="relative pl-6 sm:pl-20">
                      {/* Year Header */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: yearIndex * 0.1 }}
                        className="absolute -left-2 sm:-left-3 top-0 w-16 h-6 rounded-full bg-gray-900 flex items-center justify-center"
                      >
                        <span className="text-white text-sm font-bold">{year}</span>
                      </motion.div>
                      
                      <div className="space-y-8">
                        {Array.from(new Set(completedGoals.filter(g => g.year === year && g.month !== null).map(g => g.month))).sort((a, b) => b! - a!).map((month, monthIndex) => {
                          if (typeof month !== 'number' || month === null) return null

                          const monthGoals = completedGoals.filter(g => g.year === year && g.month === month)
                          if (monthGoals.length === 0) return null

                          return (
                            <motion.div
                              key={`${year}-${month}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: (yearIndex * 0.1) + (monthIndex * 0.1) }}
                              className="relative"
                            >
                              {/* Month Timeline */}
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200" />
                              
                              <div className="relative pl-6 sm:pl-20">
                                {/* Month Header */}
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: (yearIndex * 0.1) + (monthIndex * 0.1) }}
                                  className="absolute -left-2 sm:-left-3 top-0 w-16 h-6 rounded-full bg-gray-700 flex items-center justify-center"
                                >
                                  <span className="text-white text-sm font-bold">{monthNames[month - 1]}</span>
                                </motion.div>

                                <div className="space-y-4">
                                  {monthGoals.map((goal, goalIndex) => (
                                    <motion.div
                                      key={goal.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: (yearIndex * 0.1) + (monthIndex * 0.1) + (goalIndex * 0.1) }}
                                    >
                                      <Card className="bg-gray-50 relative">
                                        {/* Goal Timeline Dot */}
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: "spring", stiffness: 200, damping: 15, delay: (yearIndex * 0.1) + (monthIndex * 0.1) + (goalIndex * 0.1) }}
                                          className="absolute -left-5 sm:-left-10 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500"
                                        />
                                        
                                        <CardHeader>
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <CardTitle className="text-gray-700">{goal.title}</CardTitle>
                                              <CardDescription>{goal.description}</CardDescription>
                                              <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: (yearIndex * 0.1) + (monthIndex * 0.1) + (goalIndex * 0.1) + 0.1 }}
                                                className="mt-2 flex items-center gap-2"
                                              >
                                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold capitalize">
                                                  {goal.category}
                                                </span>
                                                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold capitalize">
                                                  {goal.type}
                                                </span>
                                              </motion.div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                              <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: (yearIndex * 0.1) + (monthIndex * 0.1) + (goalIndex * 0.1) + 0.2 }}
                                                className="text-sm text-muted-foreground"
                                              >
                                                Completed: {new Date(goal.updated_at).toLocaleDateString()}
                                              </motion.div>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/80"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                disabled={loading}
                                                title="Delete goal"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </CardHeader>
                                      </Card>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )
              ))}
            </AnimatePresence>
            {completedGoals.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center text-muted-foreground py-8"
              >
                No completed goals yet
              </motion.div>
            )}
          </div>

          {/* Mobile Timeline */}
          <div className="sm:hidden space-y-6">
            <AnimatePresence>
              {Array.from(new Set(completedGoals.map(g => g.year))).sort((a, b) => b! - a!).map((year, yearIndex) => (
                typeof year !== 'number' || year === null ? null : (
                  <motion.div
                    key={year}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: yearIndex * 0.1 }}
                    className="space-y-4"
                  >
                    {/* Year Header */}
                    <div className="sticky top-0 z-10 bg-background py-2">
                      <h3 className="text-lg font-bold text-gray-900">{year}</h3>
                    </div>
                    
                    {Array.from(new Set(completedGoals.filter(g => g.year === year && g.month !== null).map(g => g.month))).sort((a, b) => b! - a!).map((month, monthIndex) => {
                      if (typeof month !== 'number' || month === null) return null
                      
                      const monthGoals = completedGoals.filter(g => g.year === year && g.month === month)
                      if (monthGoals.length === 0) return null
                      
                      return (
                        <motion.div
                          key={`${year}-${month}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: (yearIndex * 0.1) + (monthIndex * 0.1) }}
                          className="space-y-3"
                        >
                          {/* Month Header */}
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-400" />
                            <h4 className="text-base font-semibold text-gray-700">{monthNames[month - 1]}</h4>
                          </div>
                          
                          <div className="space-y-3 pl-4">
                            {monthGoals.map((goal, goalIndex) => (
                              <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: (yearIndex * 0.1) + (monthIndex * 0.1) + (goalIndex * 0.1) }}
                              >
                                <Card className="bg-gray-50">
                                  <CardHeader className="p-4">
                                    <div className="space-y-2">
                                      <div>
                                        <CardTitle className="text-base text-gray-700">{goal.title}</CardTitle>
                                        <CardDescription className="text-sm">{goal.description}</CardDescription>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-medium capitalize">
                                          {goal.category}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium capitalize">
                                          {goal.type}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Completed: {new Date(goal.updated_at).toLocaleDateString()}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive"
                                          onClick={() => handleDeleteGoal(goal.id)}
                                          disabled={loading}
                                          title="Delete goal"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                </Card>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )
              ))}
            </AnimatePresence>
            {completedGoals.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center text-muted-foreground py-8"
              >
                No completed goals yet
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <button
          className={`px-4 py-2 rounded-full font-semibold transition-colors ${selectedCategory === 'year' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setSelectedCategory('year')}
        >
          Year
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold transition-colors ${selectedCategory === 'month' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setSelectedCategory('month')}
        >
          Month
        </button>
        <button
          className={`px-4 py-2 rounded-full font-semibold transition-colors ${selectedCategory === 'week' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setSelectedCategory('week')}
        >
          Week
        </button>

        {selectedCategory === 'year' && (
          <div className="ml-0 sm:ml-4 relative w-full sm:w-auto">
            <button
              className="flex items-center justify-between w-full gap-2 px-4 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition-all shadow-none border border-gray-200"
              onClick={e => {
                const menu = document.getElementById('year-dropdown')
                if (menu) menu.classList.toggle('hidden')
              }}
              type="button"
            >
              {selectedYear} <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <div id="year-dropdown" className="absolute left-0 right-0 sm:left-auto mt-2 z-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden min-w-[90px]">
              {years.map(y => (
                <button
                  key={y}
                  className={`block w-full text-left px-4 py-1.5 text-sm rounded-lg hover:bg-gray-100 ${selectedYear === y ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                  onClick={() => {
                    setSelectedYear(y!);
                    const menu = document.getElementById('year-dropdown')
                    if (menu) menu.classList.add('hidden')
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCategory === 'month' && (
          <>
            <div className="flex flex-wrap gap-1 ml-0 sm:ml-4">
              {monthNames.map((name, idx) => (
                <button
                  key={name}
                  className={`px-3 py-1 rounded-full font-medium text-sm transition-colors ${selectedMonth === idx + 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setSelectedMonth(idx + 1)}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="ml-0 sm:ml-2 relative w-full sm:w-auto">
              <button
                className="flex items-center justify-between w-full gap-2 px-4 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition-all shadow-none border border-gray-200"
                onClick={e => {
                  const menu = document.getElementById('month-year-dropdown')
                  if (menu) menu.classList.toggle('hidden')
                }}
                type="button"
              >
                {selectedYear} <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <div id="month-year-dropdown" className="absolute left-0 right-0 sm:left-auto mt-2 z-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden min-w-[90px]">
                {years.map(y => (
                  <button
                    key={y}
                    className={`block w-full text-left px-4 py-1.5 text-sm rounded-lg hover:bg-gray-100 ${selectedYear === y ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedYear(y!);
                      const menu = document.getElementById('month-year-dropdown')
                      if (menu) menu.classList.add('hidden')
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedCategory === 'week' && (
          <>
            <div className="flex flex-wrap gap-1 ml-0 sm:ml-4">
              {getWeeksInMonth(selectedYear, selectedMonth).map((week) => (
                <button
                  key={week}
                  className={`px-3 py-1 rounded-full font-medium text-sm transition-colors ${selectedWeek === week ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setSelectedWeek(week)}
                >
                  Week {week}
                </button>
              ))}
            </div>
            <div className="ml-0 sm:ml-2 relative w-full sm:w-auto">
              <button
                className="flex items-center justify-between w-full gap-2 px-4 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition-all shadow-none border border-gray-200"
                onClick={e => {
                  const menu = document.getElementById('week-month-dropdown')
                  if (menu) menu.classList.toggle('hidden')
                }}
                type="button"
              >
                {monthNames[selectedMonth - 1]} <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <div id="week-month-dropdown" className="absolute left-0 right-0 sm:left-auto mt-2 z-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden min-w-[90px]">
                {monthNames.map((name, idx) => (
                  <button
                    key={name}
                    className={`block w-full text-left px-4 py-1.5 text-sm rounded-lg hover:bg-gray-100 ${selectedMonth === idx + 1 ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedMonth(idx + 1);
                      const menu = document.getElementById('week-month-dropdown')
                      if (menu) menu.classList.add('hidden')
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="ml-0 sm:ml-2 relative w-full sm:w-auto">
              <button
                className="flex items-center justify-between w-full gap-2 px-4 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 transition-all shadow-none border border-gray-200"
                onClick={e => {
                  const menu = document.getElementById('week-year-dropdown')
                  if (menu) menu.classList.toggle('hidden')
                }}
                type="button"
              >
                {selectedYear} <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              <div id="week-year-dropdown" className="absolute left-0 right-0 sm:left-auto mt-2 z-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 hidden min-w-[90px]">
                {years.map(y => (
                  <button
                    key={y}
                    className={`block w-full text-left px-4 py-1.5 text-sm rounded-lg hover:bg-gray-100 ${selectedYear === y ? 'font-bold text-gray-900' : 'text-gray-700'}`}
                    onClick={() => {
                      setSelectedYear(y!);
                      const menu = document.getElementById('week-year-dropdown')
                      if (menu) menu.classList.add('hidden')
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as GoalType)} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-auto">All Goals</TabsTrigger>
          <TabsTrigger value="personal" className="flex-1 sm:flex-auto">Personal</TabsTrigger>
          <TabsTrigger value="career" className="flex-1 sm:flex-auto">Career</TabsTrigger>
          <TabsTrigger value="health" className="flex-1 sm:flex-auto">Health</TabsTrigger>
          <TabsTrigger value="financial" className="flex-1 sm:flex-auto">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="space-y-6">
          {filteredGoals.map((goal) => {
            const parentGoal = getParentGoal(goal)
            const childGoals = getChildGoals(goal)
            const progress = calculateProgressFromChildren(goal)

            return (
            <Card key={goal.id}>
              <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                      {parentGoal && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Part of:</span>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm"
                            onClick={() => {
                              if (parentGoal.category === 'year') {
                                setSelectedCategory('year')
                                setSelectedYear(parentGoal.year!)
                              } else if (parentGoal.category === 'month') {
                                setSelectedCategory('month')
                                setSelectedYear(parentGoal.year!)
                                setSelectedMonth(parentGoal.month!)
                              }
                            }}
                          >
                            {parentGoal.title}
                          </Button>
                  </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-green-500 hover:text-green-600"
                          onClick={() => handleCompleteGoal(goal.id)}
                          disabled={loading || goal.status === 'completed'}
                          title="Mark as completed"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => handleEditGoal(goal)}
                          disabled={loading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold capitalize">
                          {goal.category === 'year' ? 'Year' : goal.category === 'month' ? 'Month' : 'Week'}
                  </span>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold capitalize">
                          {goal.type}
                        </span>
                        {childGoals.length > 0 && (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
                            {childGoals.length} {childGoals.length === 1 ? 'sub-goal' : 'sub-goals'}
                          </span>
                        )}
                      </div>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Overall Progress</h4>
                          <p className="text-xs text-muted-foreground">
                            {progress === 100 
                              ? 'Goal completed! 🎉' 
                              : progress > 0 
                                ? `${progress}% completed` 
                                : 'Not started yet'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground capitalize">
                            {goal.status}
                          </span>
                          
                        </div>
                      </div>
                  <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex-1">
                            <Progress value={progress} className="h-2" />
                    </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={progress}
                              onChange={(e) => {
                                const value = parseInt(e.target.value)
                                if (!isNaN(value) && value >= 0 && value <= 100) {
                                  handleUpdateProgress(goal.id, value)
                                }
                              }}
                              className="w-20 h-8 text-center"
                              disabled={childGoals.length > 0}
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateProgress(goal.id, Math.max(0, progress - 10))}
                              disabled={loading || progress <= 0 || childGoals.length > 0}
                            >
                              -10%
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateProgress(goal.id, Math.min(100, progress + 10))}
                              disabled={loading || progress >= 100 || childGoals.length > 0}
                            >
                              +10%
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateProgress(goal.id, 0)}
                            disabled={loading || childGoals.length > 0}
                            title={childGoals.length > 0 ? "Cannot reset progress with sub-goals" : "Reset progress"}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                        </div>
                        {childGoals.length > 0 && (
                          <div className="text-xs text-muted-foreground italic">
                            Progress is calculated from sub-goals
                          </div>
                        )}
                      </div>
                  </div>

                  <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <h4 className="font-medium">Milestones</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMilestoneForm(showMilestoneForm === goal.id ? null : goal.id)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add Milestone
                        </Button>
                      </div>
                      {showMilestoneForm === goal.id && (
                        <div className="flex gap-2 p-2 rounded-lg bg-muted">
                          <Input
                            placeholder="Milestone title"
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                          />
                          <Input
                            type="date"
                            value={newMilestone.dueDate}
                            onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddMilestone(goal.id)}
                            disabled={!newMilestone.title.trim() || !newMilestone.dueDate}
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    <div className="space-y-2">
                      {goal.milestones?.map((milestone: Milestone) => (
                          <div key={milestone.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 rounded-lg bg-muted gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2
                                className={`h-4 w-4 cursor-pointer ${
                                milestone.completed
                                  ? 'text-green-500'
                                  : 'text-muted-foreground'
                              }`}
                                onClick={() => handleToggleMilestone(goal.id, milestone.id, !milestone.completed)}
                            />
                              <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                                {milestone.title}
                              </span>
                          </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                          <div className="text-sm text-muted-foreground">
                            Due: {new Date(milestone.due_date).toLocaleDateString()}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteMilestone(goal.id, milestone.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {goal.status}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
} 