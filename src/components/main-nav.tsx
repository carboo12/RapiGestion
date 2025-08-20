
'use client';
import { usePathname } from 'next/navigation';
import { Wallet, Users, CreditCard, Map, Settings, FileText, ShieldQuestion, List } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Logo } from './logo';

interface NavProps {
  userRole: string | null;
}

const allNavItems = [
  { href: '/dashboard', icon: Wallet, label: 'Cobros', roles: ['Administrador', 'Gestor de Cobros'] },
  { href: '/clients', icon: Users, label: 'Clientes', roles: ['Administrador', 'Gestor de Cobros'] },
  { href: '/credits', icon: CreditCard, label: 'Creditos', roles: ['Administrador', 'Gestor de Cobros'] },
  { href: '/routes', icon: Map, label: 'Rutas', roles: ['Administrador', 'Gestor de Cobros'] },
  { href: '/payments/list', icon: List, label: 'Pagos', roles: ['Administrador'] },
  { href: '/reports', icon: FileText, label: 'Reportes', roles: ['Administrador'] },
  { href: '/actions', icon: ShieldQuestion, label: 'Acciones', roles: ['Administrador'] },
  { href: '/users', icon: Users, label: 'Usuarios', roles: ['Administrador'] },
  { href: '/settings', icon: Settings, label: 'Ajustes', roles: ['Administrador'] },
];

export function DesktopNav({ userRole }: NavProps) {
  const pathname = usePathname();
  
  const navItems = allNavItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <nav className="hidden md:flex flex-col h-full w-64 border-r bg-background">
      <div className="flex items-center h-16 border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-primary" />
          <span>RapiGestion</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
             let isActive = pathname.startsWith(item.href);
             if (item.href === '/dashboard') {
                isActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
             }
             if (item.href === '/clients' && (pathname.startsWith('/credits/new') || pathname.startsWith('/credits/') && pathname.split('/').length > 2)) {
                isActive = false;
             }


            return (
              <Link
                href={item.href}
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )}
          )}
        </div>
      </div>
    </nav>
  )
}


export function MobileNav({ userRole }: NavProps) {
  const pathname = usePathname();

  const navItems = allNavItems.filter(item => userRole && item.roles.includes(userRole));

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden bottom-nav">
      <ScrollArea className="h-full w-full whitespace-nowrap">
        <div className="flex h-full w-max items-center">
            {navItems.map((item) => {
              let isActive = pathname.startsWith(item.href);
              if (item.href === '/dashboard') {
                 isActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
              }
               if (item.href === '/clients' && (pathname.startsWith('/credits/new') || pathname.startsWith('/credits/') && pathname.split('/').length > 2)) {
                isActive = false;
             }

              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={cn(
                    "inline-flex h-full flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group min-w-[80px]",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            })}
        </div>
        <ScrollBar orientation="horizontal" className="h-0" />
      </ScrollArea>
    </div>
  );
}

    
