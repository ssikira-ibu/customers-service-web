"use client"

import { useState } from "react"
import { useAllReminders, useReminderStats, useReminderActions } from "@/lib/hooks/use-reminders"
import { useCustomers } from "@/lib/hooks/use-customers"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Loading } from "@/components/ui/loading"
import { handleAPIError, handleAPISuccess, formatDate, getPriorityColor } from "@/lib/utils/api-utils"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ReminderForm } from "@/components/reminder-form"
import { 
  IconCalendar, 
  IconClock, 
  IconCheck, 
  IconRotate, 
  IconTrash, 
  IconPlus,
  IconSearch,
  IconAlertTriangle,
  IconCircleCheck,
  IconClockHour4,
  IconUser,
  IconMail
} from "@tabler/icons-react"

export default function RemindersPage() {
  const { allReminders, activeReminders, completedReminders, overdueReminders, isLoading } = useAllReminders({ include: 'customer' })
  const { customers } = useCustomers()
  const stats = useReminderStats()
  const { completeReminder, reopenReminder, deleteReminder } = useReminderActions()
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")

  // Filter reminders based on search and filters
  const filteredReminders = allReminders.filter(reminder => {
    const matchesSearch = searchQuery === "" || 
      reminder.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPriority = priorityFilter === "all" || reminder.priority === priorityFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !reminder.completed) ||
      (statusFilter === "completed" && reminder.completed) ||
      (statusFilter === "overdue" && !reminder.completed && new Date(reminder.dueDate) < new Date())

    return matchesSearch && matchesPriority && matchesStatus
  })

  // Handle reminder actions
  const handleCompleteReminder = async (customerId: string, reminderId: string) => {
    const result = await completeReminder(customerId, reminderId)
    
    if (result.success) {
      handleAPISuccess("Reminder marked as completed!")
    } else {
      handleAPIError(result.error, "Failed to complete reminder")
    }
  }

  const handleReopenReminder = async (customerId: string, reminderId: string) => {
    const result = await reopenReminder(customerId, reminderId)
    
    if (result.success) {
      handleAPISuccess("Reminder reopened!")
    } else {
      handleAPIError(result.error, "Failed to reopen reminder")
    }
  }

  const handleDeleteReminder = async (customerId: string, reminderId: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return
    
    const result = await deleteReminder(customerId, reminderId)
    
    if (result.success) {
      handleAPISuccess("Reminder deleted!")
    } else {
      handleAPIError(result.error, "Failed to delete reminder")
    }
  }

  const handleAddReminderSuccess = () => {
    setIsAddDialogOpen(false)
    setSelectedCustomerId("")
    // The reminders will automatically refresh due to SWR
  }

  const handleAddReminderCancel = () => {
    setIsAddDialogOpen(false)
    setSelectedCustomerId("")
  }

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loading />
            <p className="mt-4 text-muted-foreground">Loading reminders...</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {/* Header */}
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
                    <p className="text-muted-foreground">
                      Manage and track all customer reminders
                    </p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="px-4 lg:px-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                        <IconClockHour4 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.active}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                        <IconAlertTriangle className="h-4 w-4 text-red-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <IconCircleCheck className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {stats.completionRate.toFixed(1)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center space-x-2">
                      <div className="relative flex-1 max-w-sm">
                        <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reminders..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Add Reminder Dialog */}
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Reminder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add New Reminder</DialogTitle>
                          <DialogDescription>
                            Create a new reminder for a customer
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Customer Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Select Customer *</label>
                            <Select 
                              value={selectedCustomerId} 
                              onValueChange={setSelectedCustomerId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a customer" />
                              </SelectTrigger>
                              <SelectContent>
                                {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.firstName} {customer.lastName} ({customer.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Reminder Form */}
                          {selectedCustomerId && (
                            <ReminderForm
                              customerId={selectedCustomerId}
                              customerName={customers.find(c => c.id === selectedCustomerId)?.firstName + " " + customers.find(c => c.id === selectedCustomerId)?.lastName || "Customer"}
                              onSuccess={handleAddReminderSuccess}
                              onCancel={handleAddReminderCancel}
                            />
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Reminders List */}
                <div className="px-4 lg:px-6">
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All ({allReminders.length})</TabsTrigger>
                      <TabsTrigger value="active">Active ({activeReminders.length})</TabsTrigger>
                      <TabsTrigger value="overdue">Overdue ({overdueReminders.length})</TabsTrigger>
                      <TabsTrigger value="completed">Completed ({completedReminders.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-6">
                      <RemindersList 
                        reminders={filteredReminders}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                      />
                    </TabsContent>
                    
                    <TabsContent value="active" className="mt-6">
                      <RemindersList 
                        reminders={activeReminders.filter(r => 
                          (searchQuery === "" || 
                           r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
                          (priorityFilter === "all" || r.priority === priorityFilter)
                        )}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                      />
                    </TabsContent>
                    
                    <TabsContent value="overdue" className="mt-6">
                      <RemindersList 
                        reminders={overdueReminders.filter(r => 
                          (searchQuery === "" || 
                           r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
                          (priorityFilter === "all" || r.priority === priorityFilter)
                        )}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                      />
                    </TabsContent>
                    
                    <TabsContent value="completed" className="mt-6">
                      <RemindersList 
                        reminders={completedReminders.filter(r => 
                          (searchQuery === "" || 
                           r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
                          (priorityFilter === "all" || r.priority === priorityFilter)
                        )}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  )
}

// Reminders List Component
function RemindersList({ 
  reminders, 
  onComplete, 
  onReopen, 
  onDelete 
}: {
  reminders: Array<{
    id: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    customerId: string;
    customerName: string;
    customerEmail: string;
  }>
  onComplete: (customerId: string, reminderId: string) => void
  onReopen: (customerId: string, reminderId: string) => void
  onDelete: (customerId: string, reminderId: string) => void
}) {
  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <IconClock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No reminders found</h3>
        <p className="mt-2 text-muted-foreground">
          No reminders match your current filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <ReminderCard
          key={`${reminder.customerId}-${reminder.id}`}
          reminder={reminder}
          onComplete={onComplete}
          onReopen={onReopen}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

// Individual Reminder Card
function ReminderCard({ 
  reminder, 
  onComplete, 
  onReopen, 
  onDelete 
}: {
  reminder: {
    id: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    customerId: string;
    customerName: string;
    customerEmail: string;
  }
  onComplete: (customerId: string, reminderId: string) => void
  onReopen: (customerId: string, reminderId: string) => void
  onDelete: (customerId: string, reminderId: string) => void
}) {
  const isOverdue = !reminder.completed && new Date(reminder.dueDate) < new Date()
  const isDueToday = !reminder.completed && new Date(reminder.dueDate).toDateString() === new Date().toDateString()

  return (
    <Card className={`transition-all hover:shadow-md ${reminder.completed ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {reminder.completed ? (
                  <IconCircleCheck className="h-5 w-5 text-green-500" />
                ) : isOverdue ? (
                  <IconAlertTriangle className="h-5 w-5 text-red-500" />
                ) : isDueToday ? (
                  <IconClock className="h-5 w-5 text-orange-500" />
                ) : (
                  <IconClock className="h-5 w-5 text-muted-foreground" />
                )}
                <h3 className={`font-semibold ${reminder.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {reminder.description}
                </h3>
              </div>
              <Badge 
                variant="outline" 
                className={`${getPriorityColor(reminder.priority)}`}
              >
                {reminder.priority}
              </Badge>
              {reminder.completed && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Completed
                </Badge>
              )}
              {isOverdue && !reminder.completed && (
                <Badge variant="destructive">
                  Overdue
                </Badge>
              )}
              {isDueToday && !reminder.completed && (
                <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:bg-orange-950">
                  Due Today
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconCalendar className="h-4 w-4" />
                <span>Due: {formatDate(reminder.dueDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconUser className="h-4 w-4" />
                <span>{reminder.customerName}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconMail className="h-4 w-4" />
                <span>{reminder.customerEmail}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!reminder.completed ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete(reminder.customerId, reminder.id)}
                className="text-green-600 hover:text-green-700"
              >
                <IconCheck className="h-4 w-4 mr-1" />
                Complete
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReopen(reminder.customerId, reminder.id)}
                className="text-blue-600 hover:text-blue-700"
              >
                <IconRotate className="h-4 w-4 mr-1" />
                Reopen
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(reminder.customerId, reminder.id)}
              className="text-red-600 hover:text-red-700"
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 