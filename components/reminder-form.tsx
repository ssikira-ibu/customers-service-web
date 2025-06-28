"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useCustomers } from "@/lib/hooks/use-customers"
import { customerAPI } from "@/lib/api"
import { handleAPIError, handleAPISuccess } from "@/lib/utils/api-utils"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  IconLoader, 
  IconPlus, 
  IconSearch, 
  IconCalendar, 
  IconClock,
  IconUser,
  IconAlertCircle,
  IconClockHour4,
  IconCalendarTime,
  IconCalendarWeek,
  IconCalendarMonth
} from "@tabler/icons-react"

interface ReminderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReminderForm({ onSuccess, onCancel }: ReminderFormProps) {
  const { customers } = useCustomers()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [formData, setFormData] = useState({
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high"
  })

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers.slice(0, 5) // Show first 5 by default
    
    return customers.filter(customer => 
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
  }, [customers, searchQuery])

  // Get selected customer details
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  // Quick date options
  const quickDateOptions = [
    { label: "Today", value: "today", icon: IconCalendar },
    { label: "Tomorrow", value: "tomorrow", icon: IconClock },
    { label: "Next Week", value: "next-week", icon: IconCalendarWeek },
    { label: "Next Month", value: "next-month", icon: IconCalendarMonth },
  ]

  // Priority options with visual indicators
  const priorityOptions = [
    { 
      value: "low", 
      label: "Low", 
      color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50",
      icon: "🔵"
    },
    { 
      value: "medium", 
      label: "Medium", 
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
      icon: "🟡"
    },
    { 
      value: "high", 
      label: "High", 
      color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
      icon: "🔴"
    },
  ]

  // Quick reminder templates
  const reminderTemplates = [
    "Follow up on service satisfaction",
    "Schedule next appointment",
    "Send invoice reminder",
    "Check on project status",
    "Birthday wishes",
    "Holiday greeting"
  ]

  const handleQuickDateSelect = (option: string) => {
    const now = new Date()
    let targetDate = new Date()

    switch (option) {
      case "today":
        targetDate = now
        break
      case "tomorrow":
        targetDate.setDate(now.getDate() + 1)
        break
      case "next-week":
        targetDate.setDate(now.getDate() + 7)
        break
      case "next-month":
        targetDate.setMonth(now.getMonth() + 1)
        break
    }

    const dateString = targetDate.toISOString().split('T')[0]
    setFormData(prev => ({ ...prev, dueDate: dateString }))
  }

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({ ...prev, description: template }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!selectedCustomerId) {
        throw new Error("Please select a customer")
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required")
      }
      if (!formData.dueDate) {
        throw new Error("Due date is required")
      }

      // Create due date with default time
      const dueDateTime = new Date(`${formData.dueDate}T09:00`)
      
      // Validate due date is in the future
      if (dueDateTime < new Date()) {
        throw new Error("Due date must be in the future")
      }

      const result = await customerAPI.addReminder(selectedCustomerId, {
        description: formData.description.trim(),
        dueDate: dueDateTime.toISOString(),
        priority: formData.priority,
      })
      
      // API call successful
      handleAPISuccess("Reminder created successfully!")
      // Reset form
      setFormData({
        description: "",
        dueDate: "",
        priority: "medium"
      })
      setSelectedCustomerId("")
      setSearchQuery("")
      // Close dialog
      onSuccess?.()

      // Invalidate SWR cache for reminders and analytics
      await Promise.all([
        mutate((key) => Array.isArray(key) && key[0] === 'reminders'),
        mutate('reminder-analytics'),
      ])
    } catch (error) {
      handleAPIError(error, "Failed to create reminder")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 relative animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center space-y-2">
            <IconLoader className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Creating reminder...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <IconClock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Create New Reminder</h3>
        <p className="text-sm text-muted-foreground">
          Set up a reminder for your customer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Customer <span className="text-red-500">*</span>
          </Label>
          
          {selectedCustomer ? (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <IconUser className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {filteredCustomers.length > 0 && (
                <Card className="border shadow-sm">
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(customer.id)
                            setSearchQuery("")
                          }}
                          className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                              <IconUser className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{customer.firstName} {customer.lastName}</p>
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Description <span className="text-red-500">*</span>
          </Label>
          
          {/* Quick Templates */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick templates:</p>
            <div className="flex flex-wrap gap-2">
              {reminderTemplates.map((template) => (
                <Badge
                  key={template}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors text-xs"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {template}
                </Badge>
              ))}
            </div>
          </div>
          
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter reminder description..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Due Date */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Due Date <span className="text-red-500">*</span>
          </Label>
          
          {/* Quick Date Options */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Quick options:</p>
            <div className="flex flex-wrap gap-2">
              {quickDateOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateSelect(option.value)}
                    className="h-8 text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Priority</Label>
          <div className="grid grid-cols-3 gap-2">
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, priority: option.value as "low" | "medium" | "high" }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.priority === option.value
                    ? `${option.color} border-current`
                    : 'border-border hover:border-border/60'
                }`}
              >
                <div className="text-center space-y-1">
                  <div className="text-lg">{option.icon}</div>
                  <div className="text-xs font-medium">{option.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !selectedCustomerId || !formData.description.trim() || !formData.dueDate}
            className="min-w-[120px] relative"
          >
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
    </div>
  )
} 