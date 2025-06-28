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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ReminderForm } from "@/components/reminder-form"
import { ReminderCard } from "@/components/reminder-card"
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
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
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
    setIsAddSheetOpen(false)
    // The reminders will automatically refresh due to SWR
  }

  const handleAddReminderCancel = () => {
    setIsAddSheetOpen(false)
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
                    <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
                      <SheetTrigger asChild>
                        <Button size="sm" className="shadow-sm">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Reminder
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-y-auto p-6">
                            <ReminderForm
                              onSuccess={handleAddReminderSuccess}
                              onCancel={handleAddReminderCancel}
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
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
          showCustomerInfo={true}
        />
      ))}
    </div>
  )
}

 