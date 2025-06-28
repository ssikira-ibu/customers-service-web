'use client';

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"
import { signOut } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { IconLogout, IconPlus, IconSearch, IconUser } from "@tabler/icons-react"

export function SiteHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1 h-8 w-8" />
        <Separator orientation="vertical" className="h-4" />
        <h1 className="text-sm font-medium text-foreground">Customer Management</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <IconSearch className="h-3.5 w-3.5 mr-1.5" />
            Search
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <IconPlus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
              <IconUser className="h-2.5 w-2.5" />
            </div>
            <span className="hidden sm:inline">
              {user?.displayName || user?.email?.split('@')[0]}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <IconLogout className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
