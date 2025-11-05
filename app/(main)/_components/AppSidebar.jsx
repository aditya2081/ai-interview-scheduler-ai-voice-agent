"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboardIcon, Calendar, List, CreditCard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

// Define sidebar options locally to avoid import issues
const SideBarOptions = [
  {
    name: 'Dashboard',
    icon: LayoutDashboardIcon,
    path: '/dashboard'
  },
  {
    name: 'Schedule Interview',
    icon: Calendar,
    path: '/scheduled-interview'
  },
  {
    name: 'All Interview',
    icon: List,
    path: '/dashboard/all-interview'
  },
  {
    name: 'Billing',
    icon: CreditCard,
    path: '/billing'
  },
]

export function AppSidebar() {

  const path=usePathname()
  console.log(path);
  return (
    <Sidebar>
      <SidebarHeader className='flex flex-col items-center pt-0 space-y-1'>
        <Image 
          src={'/logo1.png'} 
          alt="logo" 
          width={200}
          height={100}
          className="w-[150px]"
        />
        <Button className='w-full mt-1' asChild>
          <Link href="/dashboard/create-interview">
            <Plus />
            Create New Interview
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {SideBarOptions.map((option, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild className={`p-5 ${path == option.path && 'bg-blue-50'}`}>
                    <Link href={option.path}>
                      <option.icon className="mr-2 h-4 w-4" />
                      <span className={`text-[16px] ${path == option.path && 'text-primary'}`}>
                        {option.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">
          © 2025 Team-AA4
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}