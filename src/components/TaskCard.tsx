import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Task } from '@/lib/storage'
import { CheckIcon, TrashIcon } from 'lucide-react'

interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggleComplete, onDelete }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'border-l-4 border-red-500'
      case 'medium': return 'border-l-4 border-yellow-500'
      case 'low': return 'border-l-4 border-green-500'
      default: return ''
    }
  }

  return (
    <Card className={`relative ${getPriorityColor()}`}>
      <CardHeader>
        <CardTitle className={task.completed ? 'line-through text-muted-foreground' : ''}>
          {task.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        {task.dueDate && (
          <div className="text-xs text-muted-foreground mt-2">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant={task.completed ? 'secondary' : 'default'} 
          size="sm" 
          onClick={() => onToggleComplete(task.id)}
        >
          <CheckIcon className="mr-2 size-4" />
          {task.completed ? 'Completed' : 'Mark Complete'}
        </Button>
        <Button 
          variant="destructive" 
          size="icon" 
          onClick={() => onDelete(task.id)}
        >
          <TrashIcon className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
