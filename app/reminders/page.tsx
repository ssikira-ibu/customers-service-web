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
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())

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
    const actionKey = `${customerId}-${reminderId}-complete`
    setLoadingActions(prev => new Set(prev).add(actionKey))
    
    try {
      const result = await completeReminder(customerId, reminderId)
      
      if (result.success) {
        handleAPISuccess("Reminder marked as completed!")
      } else {
        handleAPIError(result.error, "Failed to complete reminder")
      }
    } catch (error) {
      handleAPIError(error, "Failed to complete reminder")
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  const handleReopenReminder = async (customerId: string, reminderId: string) => {
    const actionKey = `${customerId}-${reminderId}-reopen`
    setLoadingActions(prev => new Set(prev).add(actionKey))
    
    try {
      const result = await reopenReminder(customerId, reminderId)
      
      if (result.success) {
        handleAPISuccess("Reminder reopened!")
      } else {
        handleAPIError(result.error, "Failed to reopen reminder")
      }
    } catch (error) {
      handleAPIError(error, "Failed to reopen reminder")
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  const handleDeleteReminder = async (customerId: string, reminderId: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return
    
    const actionKey = `${customerId}-${reminderId}-delete`
    setLoadingActions(prev => new Set(prev).add(actionKey))
    
    try {
      const result = await deleteReminder(customerId, reminderId)
      
      if (result.success) {
        handleAPISuccess("Reminder deleted!")
      } else {
        handleAPIError(result.error, "Failed to delete reminder")
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete reminder")
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
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
                        loadingActions={loadingActions}
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
                        loadingActions={loadingActions}
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
                        loadingActions={loadingActions}
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
                        loadingActions={loadingActions}
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
  onDelete,
  loadingActions
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
  loadingActions: Set<string>
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
    <div className="space-y-2">
      {reminders.map((reminder) => (
        <ReminderCard
          key={`${reminder.customerId}-${reminder.id}`}
          reminder={reminder}
          onComplete={onComplete}
          onReopen={onReopen}
          onDelete={onDelete}
          loadingActions={loadingActions}
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
  onDelete,
  loadingActions
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
  loadingActions: Set<string>
}) {
  const isOverdue = !reminder.completed && new Date(reminder.dueDate) < new Date()
  const isDueToday = !reminder.completed && new Date(reminder.dueDate).toDateString() === new Date().toDateString()

  // Modern badge design system
  const badgeStyles = {
    // Priority badges
    priority: {
      high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
      medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
      low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50'
    },
    // Status badges
    status: {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
      overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
      today: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50'
    }
  }

  return (
    <div className={`group relative rounded-lg border bg-card p-4 transition-all hover:shadow-sm hover:border-border/60 ${
      reminder.completed ? 'opacity-60' : ''
    }`}>
      {/* Status indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gradient-to-b from-transparent via-border to-transparent" />
      
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {reminder.completed ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <IconCircleCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          ) : isOverdue ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <IconAlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
            </div>
          ) : isDueToday ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <IconClock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <IconClock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className={`text-sm font-medium leading-5 mb-2 ${
                reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {reminder.description}
              </h3>
              
              {/* Badges row */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {/* Priority badge */}
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2 py-0.5 h-5 font-medium border ${badgeStyles.priority[reminder.priority]}`}
                >
                  {reminder.priority}
                </Badge>

                {/* Status badges */}
                {reminder.completed && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 h-5 font-medium border ${badgeStyles.status.completed}`}
                  >
                    Done
                  </Badge>
                )}
                {isOverdue && !reminder.completed && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 h-5 font-medium border ${badgeStyles.status.overdue}`}
                  >
                    Overdue
                  </Badge>
                )}
                {isDueToday && !reminder.completed && (
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 h-5 font-medium border ${badgeStyles.status.today}`}
                  >
                    Today
                  </Badge>
                )}
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <IconCalendar className="h-3 w-3" />
                  <span>{formatDate(reminder.dueDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IconUser className="h-3 w-3" />
                  <span className="truncate">{reminder.customerName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <IconMail className="h-3 w-3" />
                  <span className="truncate">{reminder.customerEmail}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {!reminder.completed ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onComplete(reminder.customerId, reminder.id)}
                  disabled={loadingActions.has(`${reminder.customerId}-${reminder.id}-complete`)}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-50"
                >
                  {loadingActions.has(`${reminder.customerId}-${reminder.id}-complete`) ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  ) : (
                    <IconCheck className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReopen(reminder.customerId, reminder.id)}
                  disabled={loadingActions.has(`${reminder.customerId}-${reminder.id}-reopen`)}
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50"
                >
                  {loadingActions.has(`${reminder.customerId}-${reminder.id}-reopen`) ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <IconRotate className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(reminder.customerId, reminder.id)}
                disabled={loadingActions.has(`${reminder.customerId}-${reminder.id}-delete`)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
              >
                {loadingActions.has(`${reminder.customerId}-${reminder.id}-delete`) ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <IconTrash className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 