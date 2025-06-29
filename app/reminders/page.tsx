"use client"

import { useState } from "react"
import { useAllReminders, useReminderActions } from "@/lib/hooks/use-reminders"
import { useCustomers } from "@/lib/hooks/use-customers"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Loading } from "@/components/ui/loading"
import { handleAPIError, handleAPISuccess } from "@/lib/utils/api-utils"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ReminderForm } from "@/components/reminder-form";
import { ReminderCard } from "@/components/reminder-card";
import {
  IconCalendar,
  IconClock,
  IconPlus,
  IconSearch,
  IconAlertTriangle,
  IconCircleCheck,
} from "@tabler/icons-react";

export default function RemindersPage() {
  const {
    allReminders,
    isLoading,
  } = useAllReminders({ include: "customer" });
  const { completeReminder, reopenReminder, deleteReminder } = useReminderActions();
  const { customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);

  // Compute stats from reminders data
  const stats = {
    total: allReminders.length,
    active: allReminders.filter(r => !r.completed).length,
    overdue: allReminders.filter(r => !r.completed && new Date(r.dueDate) < new Date()).length,
    completed: allReminders.filter(r => r.completed).length
  };

  // Filter reminders based on search and filters
  const filteredReminders = allReminders.filter((reminder) => {
    const matchesSearch =
      searchQuery === "" ||
      reminder.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      priorityFilter === "all" || reminder.priority === priorityFilter;
    const matchesCustomer =
      customerFilter === "all" || reminder.customerId === customerFilter;

    return matchesSearch && matchesPriority && matchesCustomer;
  });

  // Separate filtered reminders into active and completed
  const filteredActiveReminders = filteredReminders.filter((r) => !r.completed);
  const filteredCompletedReminders = filteredReminders.filter(
    (r) => r.completed
  );

  // Smart categorization of filtered reminders
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const recentlyCompleted = new Date(now.getTime() - 48 * 60 * 60 * 1000); // Last 48 hours

  const categorizedReminders = {
    overdue: filteredActiveReminders.filter((r) => new Date(r.dueDate) < today),
    dueToday: filteredActiveReminders.filter((r) => {
      const dueDate = new Date(r.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    }),
    dueTomorrow: filteredActiveReminders.filter((r) => {
      const dueDate = new Date(r.dueDate);
      return (
        dueDate >= tomorrow &&
        dueDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      );
    }),
    thisWeek: filteredActiveReminders.filter((r) => {
      const dueDate = new Date(r.dueDate);
      const dayAfterTomorrow = new Date(
        tomorrow.getTime() + 24 * 60 * 60 * 1000
      );
      return dueDate >= dayAfterTomorrow && dueDate < nextWeek;
    }),
    upcoming: filteredActiveReminders.filter(
      (r) => new Date(r.dueDate) >= nextWeek
    ),
    recentlyCompleted: filteredCompletedReminders.filter((r) => {
      return r.dateCompleted && new Date(r.dateCompleted) >= recentlyCompleted;
    }),
  };

  // Handle reminder actions
  const handleCompleteReminder = async (
    customerId: string,
    reminderId: string
  ) => {
    const actionKey = `${customerId}-${reminderId}-complete`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

    try {
      const result = await completeReminder(customerId, reminderId);

      if (result.success) {
        handleAPISuccess("Reminder marked as completed!");
      } else {
        handleAPIError(result.error, "Failed to complete reminder");
      }
    } catch (error) {
      handleAPIError(error, "Failed to complete reminder");
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleReopenReminder = async (
    customerId: string,
    reminderId: string
  ) => {
    const actionKey = `${customerId}-${reminderId}-reopen`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

    try {
      const result = await reopenReminder(customerId, reminderId);

      if (result.success) {
        handleAPISuccess("Reminder reopened!");
      } else {
        handleAPIError(result.error, "Failed to reopen reminder");
      }
    } catch (error) {
      handleAPIError(error, "Failed to reopen reminder");
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleDeleteReminder = async (
    customerId: string,
    reminderId: string
  ) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    const actionKey = `${customerId}-${reminderId}-delete`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

    try {
      const result = await deleteReminder(customerId, reminderId);

      if (result.success) {
        handleAPISuccess("Reminder deleted!");
      } else {
        handleAPIError(result.error, "Failed to delete reminder");
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete reminder");
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleAddReminderSuccess = () => {
    setIsAddSheetOpen(false);
    // The reminders will automatically refresh due to SWR
  };

  const handleAddReminderCancel = () => {
    setIsAddSheetOpen(false);
  };

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
    );
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
                      <h1 className="text-2xl font-semibold tracking-tight">
                        Reminders
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {stats.total} total • {stats.active} active •{" "}
                        {stats.overdue} overdue
                      </p>
                    </div>

                    {/* Add Reminder Dialog */}
                    <Sheet
                      open={isAddSheetOpen}
                      onOpenChange={setIsAddSheetOpen}
                    >
                      <SheetTrigger asChild>
                        <Button size="sm" className="shadow-sm">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Reminder
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[500px] sm:w-[600px] p-0"
                      >
                        <SheetHeader className="sr-only">
                          <SheetTitle>Add Reminder</SheetTitle>
                          <SheetDescription>
                            Create a new reminder
                          </SheetDescription>
                        </SheetHeader>
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

                {/* Actionable Widgets */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Overdue Widget */}
                    {categorizedReminders.overdue.length > 0 && (
                      <Card
                        className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
                        onClick={() => {
                          const element =
                            document.getElementById("needs-attention");
                          element?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        <CardContent className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <IconAlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-red-700 dark:text-red-400">
                                {categorizedReminders.overdue.length} Overdue
                              </div>
                              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                                Needs immediate attention
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Due Today Widget */}
                    {categorizedReminders.dueToday.length > 0 && (
                      <Card
                        className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
                        onClick={() => {
                          const element =
                            document.getElementById("needs-attention");
                          element?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        <CardContent className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <IconClock className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                {categorizedReminders.dueToday.length} Due Today
                              </div>
                              <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                                Complete by end of day
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* This Week Widget */}
                    {(categorizedReminders.dueTomorrow.length > 0 ||
                      categorizedReminders.thisWeek.length > 0) && (
                      <Card
                        className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
                        onClick={() => {
                          const element = document.getElementById("upcoming");
                          element?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        <CardContent className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <IconCalendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                {categorizedReminders.dueTomorrow.length +
                                  categorizedReminders.thisWeek.length}{" "}
                                This Week
                              </div>
                              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                                Plan ahead
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Add Widget */}
                    <Card
                      className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
                      onClick={() => setIsAddSheetOpen(true)}
                    >
                      <CardContent className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <IconPlus className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-green-700 dark:text-green-400">
                              Quick Add
                            </div>
                            <p className="text-xs text-green-600/70 dark:text-green-400/70">
                              Create new reminder
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                        <span className="text-xs font-medium text-muted-foreground mr-1">
                          Priority:
                        </span>
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
                        <span className="text-xs font-medium text-muted-foreground mr-1">
                          Customer:
                        </span>
                        <Select
                          value={customerFilter}
                          onValueChange={setCustomerFilter}
                        >
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

                {/* Smart Priority-Based Sections */}
                <div className="px-4 lg:px-6 space-y-8">
                  {/* NEEDS ATTENTION Section */}
                  {(categorizedReminders.overdue.length > 0 ||
                    categorizedReminders.dueToday.length > 0) && (
                    <div id="needs-attention">
                      <div className="flex items-center gap-2 mb-4">
                        <IconAlertTriangle className="h-5 w-5 text-red-600" />
                        <h2 className="text-lg font-semibold text-foreground">
                          Needs Attention
                        </h2>
                        <Badge variant="destructive" className="text-xs">
                          {categorizedReminders.overdue.length +
                            categorizedReminders.dueToday.length}
                        </Badge>
                      </div>

                      {/* Overdue */}
                      {categorizedReminders.overdue.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Overdue ({categorizedReminders.overdue.length})
                          </h3>
                          <RemindersList
                            reminders={categorizedReminders.overdue}
                            onComplete={handleCompleteReminder}
                            onReopen={handleReopenReminder}
                            onDelete={handleDeleteReminder}
                            loadingActions={loadingActions}
                          />
                        </div>
                      )}

                      {/* Due Today */}
                      {categorizedReminders.dueToday.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            Due Today ({categorizedReminders.dueToday.length})
                          </h3>
                          <RemindersList
                            reminders={categorizedReminders.dueToday}
                            onComplete={handleCompleteReminder}
                            onReopen={handleReopenReminder}
                            onDelete={handleDeleteReminder}
                            loadingActions={loadingActions}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPCOMING Section */}
                  {(categorizedReminders.dueTomorrow.length > 0 ||
                    categorizedReminders.thisWeek.length > 0 ||
                    categorizedReminders.upcoming.length > 0) && (
                    <div id="upcoming">
                      <div className="flex items-center gap-2 mb-4">
                        <IconCalendar className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-foreground">
                          Upcoming
                        </h2>
                        <Badge variant="secondary" className="text-xs">
                          {categorizedReminders.dueTomorrow.length +
                            categorizedReminders.thisWeek.length +
                            categorizedReminders.upcoming.length}
                        </Badge>
                      </div>

                      {/* Tomorrow */}
                      {categorizedReminders.dueTomorrow.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Tomorrow ({categorizedReminders.dueTomorrow.length})
                          </h3>
                          <RemindersList
                            reminders={categorizedReminders.dueTomorrow}
                            onComplete={handleCompleteReminder}
                            onReopen={handleReopenReminder}
                            onDelete={handleDeleteReminder}
                            loadingActions={loadingActions}
                          />
                        </div>
                      )}

                      {/* This Week */}
                      {categorizedReminders.thisWeek.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            This Week ({categorizedReminders.thisWeek.length})
                          </h3>
                          <RemindersList
                            reminders={categorizedReminders.thisWeek}
                            onComplete={handleCompleteReminder}
                            onReopen={handleReopenReminder}
                            onDelete={handleDeleteReminder}
                            loadingActions={loadingActions}
                          />
                        </div>
                      )}

                      {/* Later */}
                      {categorizedReminders.upcoming.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                            Later ({categorizedReminders.upcoming.length})
                          </h3>
                          <RemindersList
                            reminders={categorizedReminders.upcoming}
                            onComplete={handleCompleteReminder}
                            onReopen={handleReopenReminder}
                            onDelete={handleDeleteReminder}
                            loadingActions={loadingActions}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* RECENTLY COMPLETED Section */}
                  {categorizedReminders.recentlyCompleted.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <IconCircleCheck className="h-5 w-5 text-green-600" />
                          <h2 className="text-lg font-semibold text-foreground">
                            Recently Completed
                          </h2>
                          <Badge variant="outline" className="text-xs">
                            {categorizedReminders.recentlyCompleted.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCompleted(!showCompleted)}
                          className="text-xs"
                        >
                          {showCompleted ? "Hide" : "Show"} All Completed
                        </Button>
                      </div>

                      {showCompleted ? (
                        <RemindersList
                          reminders={filteredCompletedReminders}
                          onComplete={handleCompleteReminder}
                          onReopen={handleReopenReminder}
                          onDelete={handleDeleteReminder}
                          loadingActions={loadingActions}
                        />
                      ) : (
                        <RemindersList
                          reminders={categorizedReminders.recentlyCompleted}
                          onComplete={handleCompleteReminder}
                          onReopen={handleReopenReminder}
                          onDelete={handleDeleteReminder}
                          loadingActions={loadingActions}
                        />
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {categorizedReminders.overdue.length === 0 &&
                    categorizedReminders.dueToday.length === 0 &&
                    categorizedReminders.dueTomorrow.length === 0 &&
                    categorizedReminders.thisWeek.length === 0 &&
                    categorizedReminders.upcoming.length === 0 && (
                      <div className="text-center py-12">
                        <IconCalendar className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">
                          All caught up!
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          No active reminders. Great job staying on top of
                          things!
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setIsAddSheetOpen(true)}
                        >
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add New Reminder
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
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

 