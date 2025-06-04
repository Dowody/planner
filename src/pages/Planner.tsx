import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskCard } from '@/components/TaskCard'
import { TaskFormModal } from '@/components/TaskFormModal'
import { useLocalStorage } from '@/lib/storage'
import { Task } from '@/lib/storage'

export function Planner() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', [])

  const addTask = (newTask: Task) => {
    setTasks([...tasks, newTask])
  }

  const toggleTaskComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const filterTasks = (completed: boolean) => {
    return tasks.filter(task => task.completed === completed)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Task Planner</h1>
      <TaskFormModal onAddTask={addTask} />
      
      <Tabs defaultValue="active" className="mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {filterTasks(false).length === 0 ? (
                <p className="text-muted-foreground text-center">No active tasks</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterTasks(false).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggleComplete={toggleTaskComplete}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {filterTasks(true).length === 0 ? (
                <p className="text-muted-foreground text-center">No completed tasks</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterTasks(true).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onToggleComplete={toggleTaskComplete}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
