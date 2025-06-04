import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Note } from '@/lib/storage'
import { SaveIcon, PlusIcon } from 'lucide-react'

interface NoteEditorProps {
  notes: Note[]
  onSaveNote: (note: Note) => void
  onDeleteNote: (id: string) => void
}

export function NoteEditor({ notes, onSaveNote, onDeleteNote }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const handleSave = () => {
    if (!title.trim()) return

    const noteData: Note = editingNoteId
      ? {
          ...notes.find(n => n.id === editingNoteId)!,
          title,
          content,
          updatedAt: new Date().toISOString()
        }
      : {
          id: uuidv4(),
          title,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

    onSaveNote(noteData)
    resetForm()
  }

  const handleEdit = (note: Note) => {
    setTitle(note.title)
    setContent(note.content)
    setEditingNoteId(note.id)
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setEditingNoteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSave} disabled={!title.trim()}>
          <SaveIcon className="mr-2 size-4" /> {editingNoteId ? 'Update' : 'Create'}
        </Button>
        {editingNoteId && (
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
        )}
      </div>
      <Textarea
        placeholder="Write your note here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[200px]"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <Card key={note.id}>
            <CardHeader>
              <CardTitle>{note.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => handleEdit(note)}>
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDeleteNote(note.id)}>
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
