'use client';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, HandCoins, Users, MapPin, Settings, CreditCard } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/credits', icon: CreditCard, label: 'Credits' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/routes', icon: MapPin, label: 'Routes' },
  { href: '/settings', icon: Settings, label: 'Configuration' },
];

export function MainNav() {
  const pathname = usePathname();
  
  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')}
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
