"use client"

import { useCustomers } from "@/lib/hooks"
import { DataTable } from "@/components/data-table"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Loading } from "@/components/ui/loading"
import { handleAPIError } from "@/lib/utils/api-utils"
import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function DashboardPage() {
  const { customers, isLoading, error, refreshCustomers } = useCustomers()

  // Handle errors
  useEffect(() => {
    if (error) {
      handleAPIError(error, "Failed to load customers")
    }
  }, [error])

  // Transform customers data to match the data table schema
  const transformedData = customers.map((customer, index) => ({
    id: index + 1, // Use index for drag and drop functionality
    header: `${customer.firstName} ${customer.lastName}`,
    type: "Customer",
    status: "Active", // You might want to add a status field to your customer model
    target: customer.email,
    limit: customer.phones?.[0]?.phoneNumber || "No phone",
    reviewer: customer.notes?.[0]?.note || "No notes",
  }))

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loading />
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
                <DataTable data={transformedData} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  )
}
