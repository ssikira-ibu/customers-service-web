"use client";

import { useState } from "react";
import { useCustomers, useCustomerSearch } from "@/lib/hooks/use-customers";
import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Loading } from "@/components/ui/loading";
import { handleAPIError } from "@/lib/utils/api-utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CustomerForm } from "@/components/customer-form";
import {
  IconPlus,
  IconSearch,
  IconUsers,
  IconMail,
  IconPhone,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomersPage() {
  const { customers, isLoading, error } = useCustomers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const router = useRouter();

  // Use search hook when query is provided
  const { searchResults } = useCustomerSearch(searchQuery);

  // Use search results if query exists, otherwise use all customers
  const displayedCustomers = searchQuery ? searchResults : customers;

  // Handle errors
  if (error) {
    handleAPIError(error, "Failed to load customers");
  }

  const handleAddCustomerSuccess = () => {
    setIsAddSheetOpen(false);
    // The customers will automatically refresh due to SWR
  };

  const handleAddCustomerCancel = () => {
    setIsAddSheetOpen(false);
  };

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

                {/* Customers List */}
                <div className="px-4 lg:px-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconUsers className="h-5 w-5" />
                        Customer List
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {displayedCustomers.length === 0 ? (
                        <div className="text-center py-8">
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
                        <div className="space-y-4">
                          {displayedCustomers.map((customer) => (
                            <CustomerCard
                              key={customer.id}
                              customer={customer}
                              onView={() =>
                                router.push(`/customers/${customer.id}`)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
}

function CustomerCard({
  customer,
  onView,
}: {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phones?: Array<{ phoneNumber: string; designation: string }>;
    status?: string;
  };
  onView: () => void;
}) {
  return (
    <Link
      href={`/customers/${customer.id}`}
      className="block group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
    >
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group-hover:bg-muted/50">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <IconUsers className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate">
                {customer.firstName} {customer.lastName}
              </h3>
              {customer.status && (
                <Badge variant="outline" className="text-xs">
                  {customer.status}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconMail className="h-3 w-3" />
                <span className="truncate">{customer.email}</span>
              </div>

              {customer.phones && customer.phones.length > 0 && (
                <div className="flex items-center gap-1">
                  <IconPhone className="h-3 w-3" />
                  <span className="truncate">
                    {customer.phones[0].phoneNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              onView();
            }}
            className="h-8 w-8 p-0"
          >
            <IconEye className="h-4 w-4" />
            <span className="sr-only">View customer</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
