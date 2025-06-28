"use client"

import { useState } from "react"
import { useCustomerNotes } from "@/lib/hooks/use-customers"
import { handleAPIError, handleAPISuccess } from "@/lib/utils/api-utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  IconLoader, 
  IconPlus
} from "@tabler/icons-react"

interface NoteFormProps {
  customerId: string
  noteId?: string // For editing existing notes
  initialNote?: string // Initial note content for editing
  onSuccess?: () => void
  onCancel?: () => void
}

export function NoteForm({ customerId, noteId, initialNote, onSuccess, onCancel }: NoteFormProps) {
  const { addNote, updateNote } = useCustomerNotes(customerId)
  const [isLoading, setIsLoading] = useState(false)
  const [note, setNote] = useState(initialNote || "")
  
  const isEditing = !!noteId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!note.trim()) {
        throw new Error("Note content is required")
      }

      let result
      if (isEditing && noteId) {
        result = await updateNote(noteId, note.trim())
        if (result.success) {
          handleAPISuccess("Note updated successfully!")
        } else {
          handleAPIError(result.error, "Failed to update note")
        }
      } else {
        result = await addNote(note.trim())
        if (result.success) {
          handleAPISuccess("Note added successfully!")
        } else {
          handleAPIError(result.error, "Failed to add note")
        }
      }
      
      if (result.success) {
        if (!isEditing) setNote("")
        onSuccess?.()
      }
    } catch (error) {
      handleAPIError(error, isEditing ? "Failed to update note" : "Failed to add note")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <IconLoader className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">{isEditing ? "Updating note..." : "Adding note..."}</p>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6 pt-6 pb-2">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{isEditing ? "Edit Note" : "Add Note"}</h3>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update your note about this customer" : "Add a note about this customer"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Note Content */}
          <div className="space-y-3">
            <Label htmlFor="note" className="text-sm font-medium">Note *</Label>
            <Textarea
              id="note"
              placeholder="Enter your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {note.length}/1000 characters
            </p>
          </div>
        </div>
      </div>

      {/* Fixed bottom section */}
      <div className="border-t bg-background py-4">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !note.trim() || note.length > 1000}
            className="min-w-[100px]"
            size="sm"
          >
            {isLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <IconPlus className="h-4 w-4 mr-2" />
                {isEditing ? "Update Note" : "Add Note"}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}