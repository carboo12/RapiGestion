'use client';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, HandCoins, Users, MapPin, Settings, CreditCard } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel de Control' },
  { href: '/credits', icon: CreditCard, label: 'Créditos' },
  { href: '/clients', icon: Users, label: 'Clientes' },
  { href: '/routes', icon: MapPin, label: 'Rutas' },
  { href: '/settings', icon: Settings, label: 'Configuración' },
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
