import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, CheckCircle2, Circle, Clock, Calendar, GripVertical, Check, RotateCcw, Pencil, Trash2 } from 'lucide-react'
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
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

// Simplified Task interface
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

function SortableTaskCard({ task, onStatusChange, onEdit, onDelete }: {
  task: Task
  onStatusChange: (id: string, completed: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task.title)
  const [editedDescription, setEditedDescription] = useState(task.description || '')
  const [editedDueDate, setEditedDueDate] = useState(task.due_date || '')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

      if (error) throw error
      onDelete(task.id)
    } catch (err) {
      console.error('Error deleting task:', err)
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)

      if (error) throw error
      onStatusChange(task.id, !task.completed)
    } catch (err) {
      console.error('Error updating task status:', err)
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleSave = () => {
    // Implement the save logic
  }

  const handleCancel = () => {
    // Implement the cancel logic
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`group relative ${task.completed ? 'opacity-60' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`relative overflow-hidden transition-all duration-200 ${
        isHovered ? 'shadow-md' : ''
      } ${task.completed ? 'bg-gray-50' : 'bg-white'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 rounded-full border-2 transition-all ${
                task.completed
                  ? 'border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={handleStatusChange}
            >
              {task.completed && (
                <Check className="h-3 w-3 text-white" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Task title"
                    className="font-medium"
                  />
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="min-h-[100px]"
                  />
                  <Input
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-gray-900 ${
                        task.completed ? 'line-through text-gray-500' : ''
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`mt-1 text-sm text-gray-500 ${
                          task.completed ? 'line-through' : ''
                        }`}>
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {new Date(task.due_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {task.completed ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={handleStatusChange}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Undo
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => setIsEditing(true)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: null,
    due_date: null,
    completed: false,
    priority: 0,
    order_index: 0,
  })
  const [quickTask, setQuickTask] = useState('')
  const [quickDescription, setQuickDescription] = useState('')
  const [showQuickDescription, setShowQuickDescription] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [recentlyCompleted, setRecentlyCompleted] = useState<string[]>([])
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch tasks and habits from Supabase
  useEffect(() => {
    fetchData()

    // Subscribe to changes in tasks table (optional, for real-time updates)
    // const taskSubscription = supabase
    //   .from('tasks')
    //   .on('*', payload => {
    //     console.log('Change received!', payload)
    //     // Handle inserts, updates, deletes here to keep state in sync
    //     fetchData(); // Simple refetch for now
    //   })
    //   .subscribe()

    // return () => { supabase.removeSubscription(taskSubscription) }

  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    // Fetch authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Supabase getUser error:', userError);
      setError('Failed to get user information.');
      setLoading(false);
      // Decide how to handle user fetching error (e.g., redirect to auth if unexpected)
      return;
    }

    if (!user) {
      setError('You must be logged in to view tasks.')
      setLoading(false)
      // Redirect to login if not authenticated (AuthGuard should handle this, but good fallback)
      return
    }

    console.log('Fetching data for user:', user.id);

    // Fetch tasks and habits in parallel
    const [tasksRes, habitsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ])

    if (tasksRes.error) {
      console.error('Supabase fetch tasks error:', tasksRes.error);
      setError('Failed to load tasks: ' + tasksRes.error.message);
      setLoading(false);
      return;
    }
    if (habitsRes.error) {
      console.error('Supabase fetch habits error:', habitsRes.error);
      setError('Failed to load habits: ' + habitsRes.error.message);
      setLoading(false);
      return;
    }

    console.log('Tasks fetched:', tasksRes.data?.length);
    console.log('Habits fetched:', habitsRes.data?.length);

    setTasks(tasksRes.data || [])
    setHabits(habitsRes.data || [])
    setLoading(false)
  }

  // Merge habit-tasks with normal tasks (habit-tasks first)
  // Filter out tasks that are completed unless showCompleted is true, AND not recently completed for animation
  const allTasks = useMemo(() => {
    const combinedTasks = [
      ...tasks
    ];
    // Apply filtering logic to both regular tasks and habit tasks
    return combinedTasks.filter(task => 
      showCompleted || !task.completed || recentlyCompleted.includes(task.id)
    );
  }, [tasks, showCompleted, recentlyCompleted]); // Recalculate when dependencies change

  // Optional: Sort tasks by order_index if available, then created_at for habit-tasks
  // This requires fetching order_index and handling it in insert/drag-end
  const sortedTasks = useMemo(() => allTasks.sort((a, b) => {
    // Prioritize explicit order_index if available
    if (a.order_index !== undefined && b.order_index !== undefined) {
      return a.order_index - b.order_index;
    }
    // Fallback to created_at for habit-tasks or if order_index is not used consistently
    // Note: This sorting might need refinement based on how you manage order_index
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }), [allTasks]); // Recalculate when allTasks change

  // Log the final list of tasks being prepared for rendering
  console.log('Filtered tasks before render:', sortedTasks.filter(task => 
     showCompleted || !task.completed || recentlyCompleted.includes(task.id)
  ));

  const filteredTasks = sortedTasks.filter(task => 
     showCompleted || !task.completed || recentlyCompleted.includes(task.id)
  );

  const handleCreateTask = async () => {
    if (!newTask.title?.trim()) {
      console.log('Task title is empty, not inserting.');
      return;
    }

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to create tasks.');
      console.error('No authenticated user to create task.');
      return;
    }

    console.log('Attempting to insert task for user:', user.id, newTask);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.due_date,
            completed: false,
            user_id: user.id, // Include the user_id
            priority: newTask.priority, // Include other fields if needed
            order_index: newTask.order_index, // Include other fields if needed
            habit_id: newTask.habit_id,
          }
        ])
        .select('*')

      if (error) {
        setError('Failed to add task: ' + error.message);
        console.error('Supabase insert error:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Task inserted successfully:', data[0]);
        // Update local state with the new task returned from Supabase
        // Supabase insert returns the full row, including generated fields like id and timestamps
        setTasks([data[0], ...tasks]);

        // Reset form and close dialog
        setNewTask({ title: '', description: null, due_date: null, completed: false, priority: 0, order_index: 0, habit_id: null });
        setIsDialogOpen(false);
      } else {
        // Handle case where insert is successful but no data is returned (e.g., due to RLS on SELECT)
         console.warn('Task inserted, but no data returned.');
         // You might want to refetch data here or rely on real-time subscription
         fetchData();
      }

    } catch (err) {
      console.error('An unexpected error occurred during task insert:', err);
      setError('An unexpected error occurred.');
    }
  };

  const handleEditTask = (task: Task) => {
    setNewTask({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      completed: task.completed,
      priority: task.priority,
      order_index: task.order_index,
      habit_id: task.habit_id,
      // user_id should not be set here for editing
      // id is implicitly used via the eq filter in the update call
    })
    setIsEditing(true)
    setEditingTaskId(task.id)
    setIsDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setIsEditing(false)
      setEditingTaskId(null)
      // Reset newTask state when closing dialog
      setNewTask({ title: '', description: null, due_date: null, completed: false, priority: 0, order_index: 0, habit_id: null });
    }
  }

  const handleStatusChange = async (taskId: string, newCompleted: boolean) => {
    // Determine if it's a habit task or regular task
    const isHabitTask = taskId.startsWith('habit-');

    // Find the actual task/habit object
    const taskToUpdate = isHabitTask 
      ? tasks.find(t => t.id === taskId) 
      : tasks.find(t => t.id === taskId);

    if (!taskToUpdate) {
        console.error('Task or habit not found for status change:', taskId);
        return;
    }

    // Get authenticated user (needed for RLS check on update)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setError('You must be logged in to update tasks.');
        console.error('No authenticated user to update task status.');
        return;
    }

    if (isHabitTask) {
      // Extract habit id and handle habit completion logic
      // The actual habit ID is the UUID after the 'habit-' prefix
      const habitId = taskId.split('-')[1];

      console.log('Attempting to find habit with extracted ID part:', habitId);
      console.log('Current habits state:', habits);
      const habit = habits.find(h => {
        console.log('Comparing habit.id (' + h.id + ') with extracted habitId (' + habitId + ')');
        return h.id.startsWith(habitId);
      });

      if (!habit) {
        console.error('Habit not found for habit task:', habitId);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const lastCompleted = habit.last_completed_at;
      const isConsecutive =
        lastCompleted &&
        new Date(today).getTime() - new Date(lastCompleted).getTime() === 24 * 60 * 60 * 1000;

      const newStreak = isConsecutive ? habit.streak + 1 : 1;
      const newLastCompletedAt = today;

      // Insert into habit_completions table
      const { error: completionError } = await supabase
        .from('habit_completions')
        .insert([{ habit_id: habit.id, user_id: user.id }]); // Ensure user_id is included

      if (completionError) {
        setError('Failed to log habit completion: ' + completionError.message);
        console.error('Supabase habit completion error:', completionError);
        // Decide if you want to stop here or proceed with habit update despite logging error
        // return;
      }

      // Update the habit record
      const { data: updatedHabitData, error: habitUpdateError } = await supabase
        .from('habits')
        .update({
          streak: newStreak,
          last_completed_at: newLastCompletedAt,
          // Do NOT update user_id here
        })
        .eq('id', habit.id)
        .select('*');

      if (habitUpdateError) {
        setError('Failed to update habit streak: ' + habitUpdateError.message);
        console.error('Supabase habit update error:', habitUpdateError);
        return;
      }

      // Update local habits state with the returned data
      if (updatedHabitData && updatedHabitData.length > 0) {
         // Update the main habits state
         setHabits(prevHabits => {
            console.log('Habits state before update in handler:', prevHabits);
            const updatedHabit = updatedHabitData[0];
            console.log('Updating habit in state:', updatedHabit);
            return prevHabits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
         });

         // Also trigger the animation state for immediate visual removal if hiding completed
         if (newCompleted && !showCompleted) {
           setRecentlyCompleted(ids => [...ids, taskId]);
           setTimeout(() => {
             setRecentlyCompleted(ids => ids.filter(id => id !== taskId));
           }, 400);
         }

      } else {
         console.warn('Habit updated, but no data returned.', habit.id);
         // Optionally refetch habits or handle state update based on input
         fetchData(); // Simple refetch
      }

    } else {
      // Normal task logic
      console.log('Handling normal task status change for task:', taskId, 'newCompleted:', newCompleted);
      
      // Find the task in the current state to check for habit_id
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        console.error('Task not found in state for status change:', taskId);
        return;
      }

      const { data: updatedTaskData, error } = await supabase
        .from('tasks')
        .update({ completed: newCompleted })
        .eq('id', taskId)
        .eq('user_id', user.id) // Ensure user can only update their own tasks
        .select('*'); // Select the updated task

      if (error) {
        setError('Failed to update task: ' + error.message);
        console.error('Supabase update task error:', error);
        return;
      }

      // Update local tasks state with the returned data
      if (updatedTaskData && updatedTaskData.length > 0) {
        setTasks(tasks.map((task) =>
          task.id === taskId ? updatedTaskData[0] : task
        ));
      } else {
         console.warn('Task updated, but no data returned.', taskId);
         // Optionally refetch tasks or handle state update based on input
         fetchData(); // Simple refetch
      }

      // --- Habit Completion Logic (for tasks linked to habits) ---
      if (task.habit_id && newCompleted) { // Only run habit logic when completing the task
          console.log('Task is linked to habit. Triggering habit completion logic for habit ID:', task.habit_id);
          // Find the corresponding habit
          const habit = habits.find(h => h.id === task.habit_id);

          if (!habit) {
              console.error('Habit not found for linked task:', task.habit_id);
              // Decide how to handle this - maybe show an error or just log?
              return; // Stop if habit not found
          }

          const today = new Date().toISOString().split('T')[0];
          const lastCompleted = habit.last_completed_at;
          const isConsecutive =
            lastCompleted &&
            new Date(today).getTime() - new Date(lastCompleted).getTime() === 24 * 60 * 60 * 1000;

          const newStreak = isConsecutive ? habit.streak + 1 : 1;
          const newLastCompletedAt = today;

          // Insert into habit_completions table
          const { error: completionError } = await supabase
            .from('habit_completions')
            .insert([{ habit_id: habit.id, user_id: user.id }]); // Ensure user_id is included

          if (completionError) {
            setError('Failed to log habit completion: ' + completionError.message);
            console.error('Supabase habit completion error:', completionError);
            // Decide if you want to stop here or proceed with habit update despite logging error
            // return;
          }

          // Update the habit record
          const { data: updatedHabitData, error: habitUpdateError } = await supabase
            .from('habits')
            .update({
              streak: newStreak,
              last_completed_at: newLastCompletedAt,
            })
            .eq('id', habit.id)
            .select('*');

          if (habitUpdateError) {
            setError('Failed to update habit streak: ' + habitUpdateError.message);
            console.error('Supabase habit update error:', habitUpdateError);
            return;
          }

          // Update local habits state with the returned data
          if (updatedHabitData && updatedHabitData.length > 0) {
             setHabits(habits.map(h => h.id === habit.id ? updatedHabitData[0] : h));
          } else {
             console.warn('Habit updated, but no data returned.', habit.id);
             // Optionally refetch habits or handle state update based on input
             fetchData(); // Simple refetch
          }
      }

      // Handle the recently completed animation state for normal task
      if (newCompleted && !showCompleted) {
        setRecentlyCompleted(ids => [...ids, taskId])
        setTimeout(() => {
          setRecentlyCompleted(ids => ids.filter(id => id !== taskId))
        }, 400)
      }
    }
  }

  const handleDeleteTask = async (taskId: string) => {
     if (!window.confirm('Delete this task?')) return;

      // Get authenticated user (needed for RLS check on delete)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
          setError('You must be logged in to delete tasks.');
          console.error('No authenticated user to delete task.');
          return;
      }

     const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id); // Ensure user can only delete their own tasks

     if (error) {
        setError('Failed to delete task: ' + error.message);
        console.error('Supabase delete task error:', error);
        return;
     }

     // Update local state
     setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const activeId = String(active.id); // Convert to string
      const overId = String(over.id); // Convert to string
      const oldIndex = sortedTasks.findIndex((item) => item.id === activeId) // Use string ID
      const newIndex = sortedTasks.findIndex((item) => item.id === overId) // Use string ID

      // Ensure both are regular tasks before reordering
      const taskIds = tasks.map(t => t.id);
      if (!taskIds.includes(activeId) || !taskIds.includes(overId)) { // Use string IDs
         console.warn('Can only reorder regular tasks.');
         return;
      }

      if (oldIndex === -1 || newIndex === -1) return

      // Perform reordering on the 'tasks' state (which only contains regular tasks)
      const reordered = arrayMove(tasks, 
         tasks.findIndex((item) => item.id === activeId), // Use string ID
         tasks.findIndex((item) => item.id === overId) // Use string ID
      );

      setTasks(reordered)

      // Update order_index in Supabase for persistent ordering
      // Note: This is a simple sequential update. For large lists, consider batching or a different strategy.
      // Ensure user_id is included in the update filter for RLS
      const updates = reordered.map((task, index) => 
         supabase.from('tasks')
         .update({ order_index: index })
         .eq('id', task.id)
         // .eq('user_id', user.id) // Need user ID here - would require fetching user in handleDragEnd or passing down
      );

      // Execute updates
      const updateResults = await Promise.all(updates);

      // Check for errors in updates
      updateResults.forEach(result => {
         if (result.error) {
            console.error('Failed to update task order:', result.error);
            setError('Failed to save task order.');
         }
      });

      // Optional: Refetch data after drag end to ensure state consistency
      // fetchData();

    }
  }

  const handleQuickTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTask.trim()) return

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to create quick tasks.');
      console.error('No authenticated user to create quick task.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: quickTask,
            description: quickDescription.trim() || null,
            due_date: null,
            completed: false,
            user_id: user.id,
            priority: 0,
            order_index: 0,
            habit_id: null,
          }
        ])
        .select('*')

      if (error) {
        setError('Failed to add quick task: ' + error.message);
        console.error('Supabase quick task insert error:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Quick task inserted successfully:', data[0]);
        setTasks([data[0], ...tasks]);
        setQuickTask('');
        setQuickDescription('');
        setShowQuickDescription(false);
      } else {
        console.warn('Quick task inserted, but no data returned.');
        fetchData();
      }

    } catch (err) {
      console.error('An unexpected error occurred during quick task insert:', err);
      setError('An unexpected error occurred.');
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!showQuickDescription) {
        setShowQuickDescription(true)
        // Focus the description field after it appears
        setTimeout(() => {
          descriptionRef.current?.focus()
        }, 0)
      }
    }
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleQuickTaskSubmit(e)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="container mx-auto px-2 py-2 sm:px-4 sm:py-4 pb-32"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Tasks</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-full">
            <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              <DialogDescription>
                  {isEditing ? 'Update your task details' : 'Add a new task to your list'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                    value={newTask.title || ''}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="What needs to be done?"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Add details..."
                />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date (optional)</Label>
                <Input
                    id="due_date"
                  type="date"
                    value={newTask.due_date || ''}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="priority">Priority (optional)</Label>
                   <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={newTask.priority || 0}
                     onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                   />
              </div>
                <Button onClick={handleCreateTask}>
                  {isEditing ? 'Update Task' : 'Create Task'}
                </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <form onSubmit={handleQuickTaskSubmit} className="mb-6">
        <Card className="border-dashed border-2 border-gray-200 hover:border-gray-300 transition-colors">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Circle className="h-6 w-6 text-gray-300" />
                <Input
                  placeholder="Enter task name..."
                  value={quickTask}
                  onChange={(e) => setQuickTask(e.target.value)}
                  className="border-0 p-0 h-10 text-base font-medium placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={handleTitleKeyDown}
                />
              </div>
              {showQuickDescription && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pl-8"
                >
                  <Textarea
                    ref={descriptionRef}
                    placeholder="Add a description (optional)..."
                    value={quickDescription}
                    onChange={(e) => setQuickDescription(e.target.value)}
                    className="border-0 p-0 text-sm placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                    rows={2}
                    onKeyDown={handleDescriptionKeyDown}
                  />
                </motion.div>
              )}
            </div>
          </CardHeader>
        </Card>
      </form>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading tasks...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No tasks yet. Add your first task!</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 sm:space-y-3">
              <AnimatePresence initial={false}>
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    layout
                  >
                    <SortableTaskCard
                      task={task}
                      onStatusChange={handleStatusChange}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
      </div>
          </SortableContext>
        </DndContext>
      )}
    </motion.div>
  )
} 