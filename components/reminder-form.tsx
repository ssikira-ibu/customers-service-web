"use client"

import { useState, useMemo } from "react"
import { useCustomers } from "@/lib/hooks/use-customers"
import { customerAPI } from "@/lib/api"
import { handleAPIError, handleAPISuccess } from "@/lib/utils/api-utils"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  IconLoader, 
  IconPlus, 
  IconSearch, 
  IconCalendar, 
  IconClock,
  IconCalendarWeek,
  IconCalendarMonth,
  IconX
} from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ReminderFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  preselectedCustomerId?: string // New prop for preselecting customer
}

export function ReminderForm({ onSuccess, onCancel, preselectedCustomerId }: ReminderFormProps) {
  const { customers } = useCustomers()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || "")
  const [formData, setFormData] = useState({
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high"
  })

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return []
    
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

  // Priority options
  const priorityOptions = [
    { 
      value: "low" as const, 
      label: "Low", 
      color: "bg-blue-500",
      dotClass: "bg-blue-500"
    },
    { 
      value: "medium" as const, 
      label: "Medium", 
      color: "bg-amber-500",
      dotClass: "bg-amber-500"
    },
    { 
      value: "high" as const, 
      label: "High", 
      color: "bg-red-500",
      dotClass: "bg-red-500"
    },
  ]

  // Quick templates
  const templates = [
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

      // Invalidate SWR cache for reminders, analytics, and customer-specific data
      await Promise.all([
        mutate((key) => Array.isArray(key) && key[0] === 'reminders'),
        mutate('reminder-analytics'),
        mutate(`customer/${selectedCustomerId}/reminders`),
      ])
    } catch (error) {
      handleAPIError(error, "Failed to create reminder")
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
            <p className="text-sm text-muted-foreground">Creating reminder...</p>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6 pt-6 pb-2">
        {/* Header */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Create New Reminder</h3>
          <p className="text-sm text-muted-foreground">
            Set up a reminder for your customer
          </p>
        </div>

        <div className="space-y-6">
          {/* Customer Selection - only show if no preselected customer */}
          {!preselectedCustomerId && (
            <div className="space-y-3">
              <Label htmlFor="customer-search" className="text-sm font-medium">Customer *</Label>
              
              {/* Customer search input */}
              {!selectedCustomer && (
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="customer-search"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              
              {/* Customer search results */}
              {searchQuery && filteredCustomers.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-md border bg-popover">
                  <div className="p-2">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(customer.id)
                          setSearchQuery("")
                        }}
                        className="flex w-full items-center gap-3 rounded-sm p-2 text-left hover:bg-accent hover:text-accent-foreground"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {`${customer.firstName} ${customer.lastName}`.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{customer.firstName} {customer.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected customer chip */}
              {selectedCustomer && (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-primary/5 border-primary/20">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedCustomer.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomerId("")}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    <IconX className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Show selected customer info when preselected (read-only) */}
          {preselectedCustomerId && selectedCustomer && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Customer</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-sm">
                    {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedCustomer.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter reminder description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            
            {/* Quick templates */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Quick templates</Label>
              <div className="flex flex-wrap gap-2">
                {templates.slice(0, 4).map((template) => (
                  <Button
                    key={template}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-xs h-7"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-3">
            <Label htmlFor="due-date" className="text-sm font-medium">Due Date *</Label>
            <Input
              id="due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="max-w-xs"
            />
            
            {/* Quick date options */}
            <div className="flex flex-wrap gap-2">
              {quickDateOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateSelect(option.value)}
                  className="text-xs h-7"
                >
                  <option.icon className="h-3 w-3 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Priority</Label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.priority === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData({ ...formData, priority: option.value })}
                  className={`text-xs h-8 ${
                    formData.priority === option.value
                      ? option.color
                      : "hover:bg-muted"
                  }`}
                >
                  <div className={`mr-1.5 h-2 w-2 rounded-full ${option.dotClass}`} />
                  {option.label}
                </Button>
              ))}
            </div>
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
            disabled={isLoading || !selectedCustomerId || !formData.description.trim() || !formData.dueDate}
            className="min-w-[100px]"
            size="sm"
          >
            {isLoading ? (
              <>
                <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <IconPlus className="h-4 w-4 mr-2" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
} 