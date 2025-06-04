import { useState, useEffect } from 'react'
import { Plus, Search, Tag, Trash2, Pencil } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  user_id: string
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: '',
    content: '',
  })
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    fetchNotes()
  }, [user, navigate])

  const fetchNotes = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    if (error) {
      setError('Failed to load notes')
      console.error('Supabase fetch notes error:', error)
    } else {
      const fetchedNotes: Note[] = data.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        user_id: note.user_id,
      }))
      setNotes(fetchedNotes)
    }
    setLoading(false)
  }

  const handleCreateNote = async () => {
    if (!newNote.title?.trim()) return
    if (!user) {
      setError('You must be logged in to create notes.')
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          title: newNote.title,
          content: newNote.content || '',
          user_id: user.id,
        },
      ])
      .select()
    if (error) {
      setError('Failed to add note')
      console.error('Supabase insert note error:', error)
    } else if (data && data.length > 0) {
      const addedNote: Note = {
        id: data[0].id,
        title: data[0].title,
        content: data[0].content,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at,
        user_id: data[0].user_id,
      }
      setNotes([addedNote, ...notes])
      setNewNote({ title: '', content: '' })
    } else {
      console.warn('Note inserted, but no data returned.')
      fetchNotes()
    }
    setLoading(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return
    if (!user) {
      setError('You must be logged in to delete notes.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)
    if (error) {
      setError('Failed to delete note')
      console.error('Supabase delete note error:', error)
    } else {
      setNotes(notes.filter(note => note.id !== noteId))
    }
    setLoading(false)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
    })
    setIsEditing(true)
  }

  const handleUpdateNote = async () => {
    if (!editingNote || !newNote.title?.trim()) return
    if (!user) {
      setError('You must be logged in to edit notes.')
      return
    }

    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('notes')
      .update({
        title: newNote.title,
        content: newNote.content || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingNote.id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      setError('Failed to update note')
      console.error('Supabase update note error:', error)
    } else if (data && data.length > 0) {
      const updatedNote: Note = {
        id: data[0].id,
        title: data[0].title,
        content: data[0].content,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at,
        user_id: data[0].user_id,
      }
      setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
      setEditingNote(null)
      setNewNote({ title: '', content: '' })
      setIsEditing(false)
    }
    setLoading(false)
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setNewNote({ title: '', content: '' })
    setIsEditing(false)
  }

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="container mx-auto p-4 pb-28"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Notes</h1>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Note' : 'Create New Note'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update your note' : 'Add a new note to your collection'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newNote.title}
                  onChange={(e) =>
                    setNewNote({ ...newNote, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newNote.content}
                  onChange={(e) =>
                    setNewNote({ ...newNote, content: e.target.value })
                  }
                  className="min-h-[120px] sm:min-h-[200px]"
                />
              </div>
              <div className="flex gap-2">
                {isEditing && (
                  <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={isEditing ? handleUpdateNote : handleCreateNote} 
                  className={isEditing ? 'flex-1' : 'w-full sm:w-auto'}
                >
                  {isEditing ? 'Update Note' : 'Create Note'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="p-2 sm:p-4">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">{note.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Created: {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    {note.updatedAt && note.updatedAt !== note.createdAt &&
                      ` • Updated: ${new Date(note.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => handleEditNote(note)}
                    disabled={loading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="whitespace-pre-wrap text-sm sm:text-base">{note.content}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
