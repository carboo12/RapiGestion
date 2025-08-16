'use client';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import {
  Sidebar,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { HandCoins } from 'lucide-react';
import Link from 'next/link';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <Sidebar className='bg-background border-r' collapsible="icon">
          <SidebarHeader>
              <Button asChild variant="ghost" className="h-10 w-full justify-start gap-2 px-2 text-base font-bold">
                <Link href="/dashboard">
                  <HandCoins className="size-6 shrink-0 text-primary" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    RapiGestion
                  </span>
                </Link>
              </Button>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
          <SidebarFooter>
            {/* Can add elements to footer */}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-full">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="md:hidden"/>
                </div>
                <UserNav />
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                {children}
            </main>
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
