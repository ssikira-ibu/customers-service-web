"use client"

import * as React from "react"
import {
  IconCalendar,
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBell,
  IconMapPin,
  IconPhone,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
    {
      title: "Reminders",
      url: "/reminders",
      icon: IconBell,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: IconFileDescription,
    },
  ],
  navClouds: [
    {
      title: "Customer Management",
      icon: IconUsers,
      isActive: true,
      url: "/customers",
      items: [
        {
          title: "All Customers",
          url: "/customers",
        },
        {
          title: "Add Customer",
          url: "/customers/new",
        },
        {
          title: "Search Customers",
          url: "/customers/search",
        },
      ],
    },
    {
      title: "Communication",
      icon: IconPhone,
      url: "/communication",
      items: [
        {
          title: "Phone Numbers",
          url: "/communication/phones",
        },
        {
          title: "Addresses",
          url: "/communication/addresses",
        },
        {
          title: "Notes",
          url: "/communication/notes",
        },
      ],
    },
    {
      title: "Scheduling",
      icon: IconCalendar,
      url: "/scheduling",
      items: [
        {
          title: "Active Reminders",
          url: "/scheduling/reminders",
        },
        {
          title: "Completed Tasks",
          url: "/scheduling/completed",
        },
        {
          title: "Calendar View",
          url: "/scheduling/calendar",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Customer Database",
      url: "/customers",
      icon: IconUsers,
    },
    {
      name: "Analytics Reports",
      url: "/reports",
      icon: IconFileDescription,
    },
    {
      name: "Location Data",
      url: "/locations",
      icon: IconMapPin,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  
  const userData = {
    name: user?.displayName || "User",
    email: user?.email || "user@example.com",
    avatar: user?.photoURL || "/avatars/default.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Customer Service</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
