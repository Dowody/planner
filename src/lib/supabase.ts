import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type Task = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  created_at: string
  updated_at: string
  user_id: string
  priority: number
  order_index: number
}

export type Habit = {
  id: string
  title: string
  description: string | null
  frequency: string
  streak: number
  created_at: string
  updated_at: string
  user_id: string
  last_completed_at: string | null
}

export type HabitCompletion = {
  id: string
  habit_id: string
  completed_at: string
  user_id: string
}

export type Goal = {
  id: string
  title: string
  description: string | null
  category: 'year' | 'month' | 'week'
  type: 'personal' | 'career' | 'health' | 'financial'
  year: number | null
  month: number | null
  week: number | null
  target_date: string
  progress: number
  status: 'not-started' | 'in-progress' | 'completed'
  created_at: string
  updated_at: string
  user_id: string
  parent_goal_id: string | null
  milestones: Milestone[]
}

export type Milestone = {
  id: string
  goal_id: string
  title: string
  completed: boolean
  due_date: string
  created_at: string
  updated_at: string
  user_id: string
}

export type Note = {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
  user_id: string
} 