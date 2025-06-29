"use client";

import { useState, useMemo } from "react";
import {
  useCustomers,
  useCustomerSearch,
  useCustomerMutations,
} from "@/lib/hooks/use-customers";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Loading } from "@/components/ui/loading";
import { handleAPIError } from "@/lib/utils/api-utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customer-form";
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconMail,
  IconPhone,
  IconEye,
  IconTrash,
  IconDotsVertical,
  IconCalendar,
  IconNotes,
  IconMapPin,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";
import { Customer, customerAPI } from "@/lib/api";

type SortField = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

export default function CustomersPage() {
  const { customers, isLoading, error, refreshCustomers } = useCustomers();
  const { deleteCustomer } = useCustomerMutations();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  // Use search hook when query is provided
  const { searchResults } = useCustomerSearch(searchQuery);

  // Use search results if query exists, otherwise use all customers
  const displayedCustomers = searchQuery ? searchResults : customers;

  // Sort customers
  const sortedCustomers = useMemo(() => {
    return [...displayedCustomers].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case "name":
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "createdAt":
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [displayedCustomers, sortField, sortOrder]);

  // Handle errors
  if (error) {
    handleAPIError(error, "Failed to load customers");
  }

  const handleAddCustomerSuccess = () => {
    setIsAddSheetOpen(false);
    toast.success("Customer created successfully");
    refreshCustomers();
  };

  const handleAddCustomerCancel = () => {
    setIsAddSheetOpen(false);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const result = await deleteCustomer(customerToDelete.id);
      if (result.success) {
        toast.success("Customer deleted successfully");
        setDeleteDialogOpen(false);
        setCustomerToDelete(null);
      } else {
        handleAPIError(result.error, "Failed to delete customer");
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete customer");
    }
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleAddSampleCustomer = async () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace("T", "_");
      const sampleCustomer = {
        firstName: "Sample",
        lastName: `Customer_${timestamp}`,
        email: `hereitis@debug.com`,
      };

      await customerAPI.create(sampleCustomer);
      toast.success("Sample customer created successfully");
      refreshCustomers();
    } catch (error) {
      handleAPIError(error, "Failed to create sample customer");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === "asc" ? (
            <IconChevronUp className="h-4 w-4" />
          ) : (
            <IconChevronDown className="h-4 w-4" />
          )
        ) : (
          <div className="w-4" />
        )}
      </div>
    </Button>
  );

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loading />
            <p className="mt-4 text-muted-foreground">Loading customers...</p>
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
                        Customers
                      </h1>
                      <p className="text-sm text-muted-foreground">
                        {customers.length} total customers
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Debug: Add Sample Customer Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddSampleCustomer}
                        className="shadow-sm"
                      >
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Sample
                      </Button>

                      {/* Add Customer Dialog */}
                      <Sheet
                        open={isAddSheetOpen}
                        onOpenChange={setIsAddSheetOpen}
                      >
                        <SheetTrigger asChild>
                          <Button size="sm" className="shadow-sm">
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Customer
                          </Button>
                        </SheetTrigger>
                        <SheetContent
                          side="right"
                          className="w-[500px] sm:w-[600px] p-0"
                        >
                          <SheetHeader className="sr-only">
                            <SheetTitle>Add Customer</SheetTitle>
                            <SheetDescription>
                              Create a new customer profile
                            </SheetDescription>
                          </SheetHeader>
                          <div className="h-full flex flex-col">
                            <div className="flex-1 overflow-y-auto p-6">
                              <CustomerForm
                                onSuccess={handleAddCustomerSuccess}
                                onCancel={handleAddCustomerCancel}
                              />
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="px-4 lg:px-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search customers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Customers Table */}
                <div className="px-4 lg:px-6">
                  {sortedCustomers.length === 0 ? (
                    <div className="text-center py-12">
                      <IconUsers className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-medium">
                        No customers found
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "Get started by adding your first customer"}
                      </p>
                      {!searchQuery && (
                        <Button
                          className="mt-4"
                          onClick={() => setIsAddSheetOpen(true)}
                        >
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Customer
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-card shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b">
                            <TableHead>
                              <SortableHeader field="name">
                                Customer
                              </SortableHeader>
                            </TableHead>
                            <TableHead>
                              <SortableHeader field="email">
                                Contact Information
                              </SortableHeader>
                            </TableHead>
                            <TableHead>Recent Activity</TableHead>
                            <TableHead>
                              <SortableHeader field="createdAt">
                                Joined
                              </SortableHeader>
                            </TableHead>
                            <TableHead className="w-[60px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedCustomers.map((customer) => (
                            <TableRow
                              key={customer.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                                    <span className="text-sm font-semibold text-primary">
                                      {getInitials(
                                        customer.firstName,
                                        customer.lastName
                                      )}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-foreground">
                                      {customer.firstName} {customer.lastName}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <a
                                    href={`mailto:${customer.email}`}
                                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors group max-w-fit"
                                  >
                                    <IconMail className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                    <span className="text-sm truncate max-w-[220px] font-medium text-foreground group-hover:text-primary">
                                      {customer.email}
                                    </span>
                                  </a>
                                  {customer.phones &&
                                    customer.phones.length > 0 && (
                                      <>
                                        {customer.phones
                                          .slice(0, 2)
                                          .map((phone, index) => (
                                            <a
                                              key={phone.id || index}
                                              href={`tel:${phone.phoneNumber}`}
                                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors group max-w-fit"
                                            >
                                              <IconPhone className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                              <span className="text-sm truncate max-w-[220px] font-medium text-foreground group-hover:text-primary">
                                                {phone.phoneNumber}
                                                {phone.designation && (
                                                  <span className="text-muted-foreground ml-2 text-xs">
                                                    • {phone.designation}
                                                  </span>
                                                )}
                                              </span>
                                            </a>
                                          ))}
                                        {customer.phones.length > 2 && (
                                          <div className="flex items-center gap-2 px-2 py-1">
                                            <IconPhone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="text-xs text-muted-foreground">
                                              +{customer.phones.length - 2} more
                                              phone
                                              {customer.phones.length - 2 !== 1
                                                ? "s"
                                                : ""}
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  {(() => {
                                    const notesCount =
                                      customer.count?.notes ||
                                      customer.notes?.length ||
                                      0;
                                    const remindersCount =
                                      customer.count?.reminders ||
                                      customer.reminders?.length ||
                                      0;
                                    const phonesCount =
                                      customer.phones?.length || 0;
                                    const hasActivity =
                                      notesCount > 0 ||
                                      remindersCount > 0 ||
                                      phonesCount > 1;

                                    return (
                                      <>
                                        {notesCount > 0 && (
                                          <div className="flex items-center gap-2">
                                            <IconNotes className="h-4 w-4 text-blue-500/70 flex-shrink-0" />
                                            <span className="text-sm text-foreground">
                                              {notesCount} note
                                              {notesCount !== 1 ? "s" : ""}
                                            </span>
                                          </div>
                                        )}
                                        {remindersCount > 0 && (
                                          <div className="flex items-center gap-2">
                                            <IconCalendar className="h-4 w-4 text-amber-500/70 flex-shrink-0" />
                                            <span className="text-sm text-foreground">
                                              {remindersCount} reminder
                                              {remindersCount !== 1 ? "s" : ""}
                                            </span>
                                          </div>
                                        )}
                                        {phonesCount > 1 && (
                                          <div className="flex items-center gap-2">
                                            <IconPhone className="h-4 w-4 text-emerald-500/70 flex-shrink-0" />
                                            <span className="text-sm text-foreground">
                                              {phonesCount} phone numbers
                                            </span>
                                          </div>
                                        )}
                                        {!hasActivity && (
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-muted-foreground/40 rounded-full flex-shrink-0"></div>
                                            <span className="text-xs text-muted-foreground">
                                              Limited activity
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(customer.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-muted"
                                    >
                                      <IconDotsVertical className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-56"
                                  >
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/customers/${customer.id}`}
                                        className="cursor-pointer"
                                      >
                                        <IconEye className="mr-2 h-4 w-4" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/customers/${customer.id}?action=add-phone`}
                                        className="cursor-pointer"
                                      >
                                        <IconPhone className="mr-2 h-4 w-4" />
                                        Add Phone Number
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/customers/${customer.id}?action=add-reminder`}
                                        className="cursor-pointer"
                                      >
                                        <IconCalendar className="mr-2 h-4 w-4" />
                                        Add Reminder
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/customers/${customer.id}?action=add-address`}
                                        className="cursor-pointer"
                                      >
                                        <IconMapPin className="mr-2 h-4 w-4" />
                                        Add Address
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive cursor-pointer"
                                      onClick={() => openDeleteDialog(customer)}
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      Delete Customer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {customerToDelete?.firstName} {customerToDelete?.lastName}
              </span>
              ? This action cannot be undone and will permanently remove all
              associated data including notes, reminders, and contact
              information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  );
}
