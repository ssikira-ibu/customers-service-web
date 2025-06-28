"use client"

import { useState } from "react"
import { useCustomerReminders } from "@/lib/hooks/use-customers"
import { handleAPIError, handleAPISuccess } from "@/lib/utils/api-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader, IconPlus } from "@tabler/icons-react"

interface ReminderFormProps {
  customerId: string
  customerName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReminderForm({ customerId, customerName, onSuccess, onCancel }: ReminderFormProps) {
  const { addReminder } = useCustomerReminders(customerId)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.description.trim() || !formData.dueDate) {
        throw new Error("Description and due date are required")
      }

      // Validate due date is in the future
      const dueDate = new Date(formData.dueDate)
      if (dueDate < new Date()) {
        throw new Error("Due date must be in the future")
      }

      const result = await addReminder({
        description: formData.description.trim(),
        dueDate: dueDate.toISOString(),
        priority: formData.priority,
      })
      
      if (result.success) {
        handleAPISuccess("Reminder created successfully!")
        onSuccess?.()
      } else {
        handleAPIError(result.error, "Failed to create reminder")
      }
    } catch (error) {
      handleAPIError(error, "Failed to create reminder")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Add Reminder</h3>
        <p className="text-sm text-muted-foreground">
          Create a new reminder for {customerName}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Call customer to check on service satisfaction"
          rows={3}
          required
        />
      </div>

      {/* Due Date and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: "low" | "medium" | "high") => 
              setFormData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <IconLoader className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <IconPlus className="h-4 w-4 mr-2" />
              Create Reminder
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 