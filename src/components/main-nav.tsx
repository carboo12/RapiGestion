'use client';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Users, Settings, CreditCard, Wallet, Map } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

const navItems = [
  { href: '/dashboard', icon: Wallet, label: 'Cobros' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/credits', icon: CreditCard, label: 'Creditos' },
  { href: '/routes', icon: Map, label: 'Rutas' },
  { href: '/settings', icon: Settings, label: 'Configura...' },
];

export function MainNav() {
  const pathname = usePathname();
  
  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden bottom-nav">
      <ScrollArea className="h-full w-full whitespace-nowrap">
        <div className="flex h-full w-max mx-auto">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  "inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group min-w-[80px]",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>
    </div>
  );
}
