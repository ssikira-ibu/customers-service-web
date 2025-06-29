"use client"

import { useCustomers } from "@/lib/hooks"
import { useCustomerMutations } from "@/lib/hooks/use-customers";
import { useAllReminders, useReminderStats } from "@/lib/hooks/use-reminders";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Loading } from "@/components/ui/loading";
import { handleAPIError } from "@/lib/utils/api-utils";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { healthAPI } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconUsers,
  IconBell,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconNote,
  IconCalendar,
  IconArrowRight,
  IconPlus,
  IconUserPlus,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { customers, isLoading: customersLoading, error } = useCustomers();
  const { createCustomer } = useCustomerMutations();
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const router = useRouter();

  // Use existing reminder hooks
  const { activeReminders, isLoading: remindersLoading } = useAllReminders({
    include: "customer",
  });

  const { completionRate } = useReminderStats();

  // Test API connection only when authenticated
  useEffect(() => {
    if (!user) return;

    const testConnection = async () => {
      try {
        await healthAPI.check();
        setHealthStatus(`Connected`);
      } catch (error) {
        setHealthStatus(`Disconnected`);
        console.error("API Health Check Failed:", error);
      }
    };

    testConnection();
  }, [user]);

  // Handle errors
  useEffect(() => {
    if (error) {
      handleAPIError(error, "Failed to load dashboard data");
    }
  }, [error]);

  // Get recent customers (last 5)
  const recentCustomers = customers.slice(0, 5);

  // Get recent notes from all customers
  const allNotes = customers
    .flatMap(
      (customer) =>
        customer.notes?.map((note) => ({
          ...note,
          customerName: `${customer.firstName} ${customer.lastName}`,
        })) || []
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  // Get priority reminders (high priority + overdue, limited to 5)
  const priorityReminders = [...activeReminders]
    .filter(
      (reminder) =>
        reminder.priority === "high" || new Date(reminder.dueDate) < new Date()
    )
    .slice(0, 5);

  // Function to create a sample customer
  const createSampleCustomer = async () => {
    setIsCreatingSample(true);

    try {
      // Generate random sample data
      const firstNames = [
        "John",
        "Jane",
        "Michael",
        "Sarah",
        "David",
        "Emily",
        "Chris",
        "Amanda",
        "Robert",
        "Lisa",
      ];
      const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
      ];
      const domains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "example.com",
      ];

      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;

      // Generate random phone number
      const phoneNumber = `(${Math.floor(Math.random() * 900) + 100}) ${
        Math.floor(Math.random() * 900) + 100
      }-${Math.floor(Math.random() * 9000) + 1000}`;

      const sampleCustomer = {
        firstName,
        lastName,
        email,
        phones: [
          {
            phoneNumber,
            designation: "mobile",
          },
        ],
        addresses: [
          {
            addressLine1: `${Math.floor(Math.random() * 9999) + 1} Main Street`,
            city: "Sample City",
            stateProvince: "CA",
            postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
            country: "United States",
            addressType: "home",
          },
        ],
      };

      const result = await createCustomer(sampleCustomer);

      if (result.success) {
        toast.success(
          `Sample customer "${firstName} ${lastName}" created successfully!`
        );
      } else {
        toast.error(
          `Failed to create sample customer: ${
            result.error?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error creating sample customer:", error);
      toast.error("Failed to create sample customer");
    } finally {
      setIsCreatingSample(false);
    }
  };

  // Show loading while authentication is in progress
  if (authLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loading />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
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
                        Dashboard
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {customers.length} customers • {activeReminders.length}{" "}
                        active reminders • {healthStatus}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="shadow-sm"
                        onClick={createSampleCustomer}
                        disabled={isCreatingSample}
                      >
                        <IconUserPlus className="mr-2 h-4 w-4" />
                        {isCreatingSample ? "Creating..." : "Create Sample"}
                      </Button>

                      <Button
                        size="sm"
                        className="shadow-sm"
                        onClick={() => router.push("/customers")}
                      >
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="px-4 lg:px-6">
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Customers
                      </span>
                      <span className="text-lg font-semibold">
                        {customers.length}
                      </span>
                    </div>

                    <div className="w-px h-6 bg-border"></div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Active
                      </span>
                      <span className="text-lg font-semibold">
                        {activeReminders.length}
                      </span>
                    </div>

                    <div className="w-px h-6 bg-border"></div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Overdue
                      </span>
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {
                          activeReminders.filter(
                            (r) => new Date(r.dueDate) < new Date()
                          ).length
                        }
                      </span>
                    </div>

                    <div className="w-px h-6 bg-border"></div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Completion
                      </span>
                      <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {Math.round(completionRate * 100)}%
                      </span>
                    </div>

                    <div className="w-px h-6 bg-border"></div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          healthStatus === "Connected"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm font-medium text-muted-foreground">
                        API
                      </span>
                      <span className="text-lg font-semibold">
                        {healthStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="px-4 lg:px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Urgent Tasks */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">
                          Urgent Tasks
                        </h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push("/reminders")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          View all
                          <IconArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>

                      {remindersLoading ? (
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse rounded-lg border bg-card p-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-5 w-5 bg-muted rounded-full mt-0.5" />
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-muted rounded w-3/4" />
                                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : priorityReminders.length > 0 ? (
                        <div className="space-y-2">
                          {priorityReminders.map((reminder) => (
                            <UrgentTaskCard
                              key={reminder.id}
                              reminder={reminder}
                              onClick={() => router.push("/reminders")}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <IconCircleCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                          <h3 className="mt-4 text-lg font-semibold">
                            No urgent tasks
                          </h3>
                          <p className="mt-2 text-muted-foreground">
                            All caught up! No high-priority or overdue
                            reminders.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold tracking-tight">
                        Recent Activity
                      </h2>

                      {customersLoading ? (
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse flex items-center gap-3 p-2"
                            >
                              <div className="h-8 w-8 bg-muted rounded-full" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted/60 rounded w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Recent Customers */}
                          {recentCustomers.slice(0, 3).map((customer) => (
                            <div
                              key={customer.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => router.push("/customers")}
                            >
                              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                  {customer.firstName?.[0]}
                                  {customer.lastName?.[0]}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                  {customer.firstName} {customer.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Added{" "}
                                  {formatDistanceToNow(
                                    new Date(customer.createdAt),
                                    { addSuffix: true }
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Recent Notes */}
                          {allNotes.slice(0, 2).map((note) => (
                            <div
                              key={note.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => router.push("/customers")}
                            >
                              <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <IconNote className="h-4 w-4 text-green-700 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  Note for {note.customerName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(note.createdAt),
                                    { addSuffix: true }
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}

                          {recentCustomers.length === 0 &&
                            allNotes.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <IconClock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm">No recent activity</p>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 lg:px-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold tracking-tight">
                      Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Button
                        variant="outline"
                        className="h-16 flex flex-col gap-2 text-left"
                        onClick={() => router.push("/customers")}
                      >
                        <div className="flex items-center gap-2">
                          <IconUsers className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Manage Customers
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          View and edit customer records
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 flex flex-col gap-2 text-left"
                        onClick={() => router.push("/reminders")}
                      >
                        <div className="flex items-center gap-2">
                          <IconBell className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            All Reminders
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Complete tasks and follow up
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 flex flex-col gap-2 text-left"
                        onClick={() => router.push("/customers")}
                      >
                        <div className="flex items-center gap-2">
                          <IconPlus className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Add Customer
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Create new customer record
                        </span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-16 flex flex-col gap-2 text-left"
                        onClick={createSampleCustomer}
                        disabled={isCreatingSample}
                      >
                        <div className="flex items-center gap-2">
                          <IconUserPlus className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {isCreatingSample
                              ? "Creating..."
                              : "Sample Customer"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Generate test customer data
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
}

function UrgentTaskCard({ 
  reminder, 
  onClick 
}: {
  reminder: {
    id: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    customer?: {
      firstName: string;
      lastName: string;
    };
  };
  onClick: () => void;
}) {
  const isOverdue = new Date(reminder.dueDate) < new Date()
  const isDueToday = new Date(reminder.dueDate).toDateString() === new Date().toDateString()

  const badgeStyles = {
    priority: {
      high: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
      medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50',
      low: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50'
    },
    status: {
      overdue: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50',
      today: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50'
    }
  }

  return (
    <div 
      className="group relative rounded-lg border bg-card p-3 transition-all hover:shadow-sm hover:border-border/60 cursor-pointer"
      onClick={onClick}
    >
      {/* Priority indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
        reminder.priority === 'high' ? 'bg-red-500' :
        reminder.priority === 'medium' ? 'bg-amber-500' :
        'bg-blue-500'
      }`} />
      
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isOverdue ? (
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
                <h3 className="text-sm font-medium leading-5 flex-1 text-foreground">
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
                  
                  {isOverdue && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0 h-5 font-medium border ${badgeStyles.status.overdue}`}
                    >
                      Overdue
                    </Badge>
                  )}
                  {isDueToday && !isOverdue && (
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
                  <span>Due {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}</span>
                </div>
                {reminder.customer && (
                  <div className="flex items-center gap-1">
                    <IconUsers className="h-3 w-3" />
                    <span className="truncate">{reminder.customer.firstName} {reminder.customer.lastName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
