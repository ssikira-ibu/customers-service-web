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
  const [customerFilter, setCustomerFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set())

  // Filter reminders based on search and filters
  const filteredReminders = allReminders.filter(reminder => {
    const matchesSearch = searchQuery === "" || 
      reminder.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customerName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPriority = priorityFilter === "all" || reminder.priority === priorityFilter
    const matchesCustomer = customerFilter === "all" || reminder.customerId === customerFilter

    return matchesSearch && matchesPriority && matchesCustomer
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
    // The reminders will automatically refresh due to SWR
  }

  const handleAddReminderCancel = () => {
    setIsAddDialogOpen(false)
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
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
                      <p className="text-sm text-muted-foreground">
                        {stats.total} total • {stats.active} active • {stats.overdue} overdue
                      </p>
                    </div>
                    
                    {/* Add Reminder Dialog */}
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="shadow-sm">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Reminder
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Add New Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="p-6">
                          <ReminderForm
                            onSuccess={handleAddReminderSuccess}
                            onCancel={handleAddReminderCancel}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="px-4 lg:px-6">
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Total</span>
                      <span className="text-lg font-semibold">{stats.total}</span>
                    </div>
                    
                    <div className="w-px h-6 bg-border"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Active</span>
                      <span className="text-lg font-semibold">{stats.active}</span>
                    </div>
                    
                    <div className="w-px h-6 bg-border"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Overdue</span>
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">{stats.overdue}</span>
                    </div>
                    
                    <div className="w-px h-6 bg-border"></div>
                    
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">Completion</span>
                      <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {stats.completionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="px-4 lg:px-6">
                  <div className="flex flex-col gap-3">
                    {/* Prominent Search Bar */}
                    <div className="relative">
                      <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reminders by description or customer name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-11 text-base border-2 focus:border-primary/50"
                      />
                    </div>
                    
                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Priority:</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setPriorityFilter("all")}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              priorityFilter === "all"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setPriorityFilter("high")}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              priorityFilter === "high"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            High
                          </button>
                          <button
                            onClick={() => setPriorityFilter("medium")}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              priorityFilter === "medium"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            Medium
                          </button>
                          <button
                            onClick={() => setPriorityFilter("low")}
                            className={`px-2 py-1 text-xs rounded-md transition-colors ${
                              priorityFilter === "low"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            Low
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-muted-foreground mr-1">Customer:</span>
                        <Select value={customerFilter} onValueChange={setCustomerFilter}>
                          <SelectTrigger className="h-7 px-2 text-xs border-0 bg-muted hover:bg-muted/80">
                            <SelectValue placeholder="All customers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Customers</SelectItem>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.firstName} {customer.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reminders List */}
                <div className="px-4 lg:px-6">
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-9">
                      <TabsTrigger value="all" className="text-xs font-medium">
                        All ({allReminders.length})
                      </TabsTrigger>
                      <TabsTrigger value="active" className="text-xs font-medium">
                        Active ({activeReminders.length})
                      </TabsTrigger>
                      <TabsTrigger value="overdue" className="text-xs font-medium">
                        Overdue ({overdueReminders.length})
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs font-medium">
                        Completed ({completedReminders.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-4">
                      <RemindersList 
                        reminders={filteredReminders}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                        loadingActions={loadingActions}
                      />
                    </TabsContent>
                    
                    <TabsContent value="active" className="mt-4">
                      <RemindersList 
                        reminders={activeReminders.filter(r => 
                          (searchQuery === "" || 
                           r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
                          (priorityFilter === "all" || r.priority === priorityFilter) &&
                          (customerFilter === "all" || r.customerId === customerFilter)
                        )}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                        loadingActions={loadingActions}
                      />
                    </TabsContent>
                    
                    <TabsContent value="overdue" className="mt-4">
                      <RemindersList 
                        reminders={overdueReminders.filter(r => 
                          (searchQuery === "" || 
                           r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
                          (priorityFilter === "all" || r.priority === priorityFilter) &&
                          (customerFilter === "all" || r.customerId === customerFilter)
                        )}
                        onComplete={handleCompleteReminder}
                        onReopen={handleReopenReminder}
                        onDelete={handleDeleteReminder}
                        loadingActions={loadingActions}
                      />
                    </TabsContent>
                    
                    <TabsContent value="completed" className="mt-4">
                      <RemindersList 
                        reminders={completedReminders.filter(r => 
                          (searchQuery === "" || 
                           r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) &&
                          (priorityFilter === "all" || r.priority === priorityFilter) &&
                          (customerFilter === "all" || r.customerId === customerFilter)
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
    <div className={`group relative rounded-lg border bg-card p-3 transition-all hover:shadow-sm hover:border-border/60 ${
      reminder.completed ? 'opacity-60' : ''
    }`}>
      {/* Priority indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
        reminder.priority === 'high' ? 'bg-red-500' :
        reminder.priority === 'medium' ? 'bg-amber-500' :
        'bg-blue-500'
      }`} />
      
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
              {/* Title and badges */}
              <div className="flex items-start gap-2 mb-1">
                <h3 className={`text-sm font-medium leading-5 flex-1 ${
                  reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                }`}>
                  {reminder.description}
                </h3>
                
                {/* Compact badges */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.priority[reminder.priority]}`}
                  >
                    {reminder.priority}
                  </Badge>
                  
                  {reminder.completed && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.completed}`}
                    >
                      Done
                    </Badge>
                  )}
                  {isOverdue && !reminder.completed && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.overdue}`}
                    >
                      Overdue
                    </Badge>
                  )}
                  {isDueToday && !reminder.completed && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.today}`}
                    >
                      Today
                    </Badge>
                  )}
                </div>
              </div>

              {/* Meta information */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!reminder.completed ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onComplete(reminder.customerId, reminder.id)}
                  disabled={loadingActions.has(`${reminder.customerId}-${reminder.id}-complete`)}
                  className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-50"
                >
                  {loadingActions.has(`${reminder.customerId}-${reminder.id}-complete`) ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  ) : (
                    <IconCheck className="h-3 w-3" />
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReopen(reminder.customerId, reminder.id)}
                  disabled={loadingActions.has(`${reminder.customerId}-${reminder.id}-reopen`)}
                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-50"
                >
                  {loadingActions.has(`${reminder.customerId}-${reminder.id}-reopen`) ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <IconRotate className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(reminder.customerId, reminder.id)}
                disabled={loadingActions.has(`${reminder.customerId}-${reminder.id}-delete`)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
              >
                {loadingActions.has(`${reminder.customerId}-${reminder.id}-delete`) ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <IconTrash className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 