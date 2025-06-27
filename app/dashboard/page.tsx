"use client"

import { useCustomers } from "@/lib/hooks"
import { DataTable } from "@/components/data-table"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Loading } from "@/components/ui/loading"
import { handleAPIError } from "@/lib/utils/api-utils"
import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { healthAPI } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { customers, isLoading: customersLoading, error, refreshCustomers } = useCustomers()
  const [healthStatus, setHealthStatus] = useState<string>("Checking...")

  // Test API connection only when authenticated
  useEffect(() => {
    if (!user) return
    
    const testConnection = async () => {
      try {
        const health = await healthAPI.check()
        setHealthStatus(`API Connected: ${health.status}`)
        console.log("API Health Check:", health)
      } catch (error) {
        setHealthStatus(`API Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error("API Health Check Failed:", error)
      }
    }
    
    testConnection()
  }, [user])

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
    )
  }

  // Show loading while customers are being fetched
  if (customersLoading) {
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
                  {/* API Status Debug */}
                  <div className="px-4 lg:px-6">
                    <div className="text-sm text-muted-foreground">
                      API Status: {healthStatus}
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loading />
                      <p className="mt-4 text-muted-foreground">Loading customers...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
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
                {/* API Status Debug */}
                <div className="px-4 lg:px-6">
                  <div className="text-sm text-muted-foreground">
                    API Status: {healthStatus}
                  </div>
                </div>
                <DataTable data={transformedData} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  )
}
