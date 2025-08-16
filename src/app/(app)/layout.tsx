'use client';
import { MobileNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { HandCoins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <Button asChild variant="ghost" className="h-10 gap-2 px-2 text-base font-bold">
              <Link href="/dashboard">
                <HandCoins className="size-6 shrink-0 text-primary" />
                <span className="hidden sm:inline">
                  RapiGestion
                </span>
              </Link>
            </Button>
            <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mb-16">
            {children}
        </main>
        {isMobile && <MobileNav />}
      </div>
  );
}
