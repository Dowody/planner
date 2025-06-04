import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/lib/storage'
import { PlusIcon } from 'lucide-react'

interface TaskFormModalProps {
  onAddTask: (task: Task) => void
}

export function TaskFormModal({ onAddTask }: TaskFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [dueDate, setDueDate] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) return

    const newTask: Task = {
      id: uuidv4(),
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      completed: false,
      createdAt: new Date().toISOString()
    }

    onAddTask(newTask)
    resetForm()
    setIsOpen(false)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setDueDate('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 size-4" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Select value={priority} onValueChange={(val: Task['priority']) => setPriority(val)}>
              <SelectTrigger className="col-span-2">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="col-span-2"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Task</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
