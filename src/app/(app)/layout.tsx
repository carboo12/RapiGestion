'use client';
import { MobileNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { HandCoins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = useCallback(() => {
    const auth = getAuth(app);
    signOut(auth)
      .then(() => {
        toast({
          title: "Sesión cerrada",
          description: "Tu sesión ha sido cerrada por inactividad.",
        });
        router.push('/');
      })
      .catch((error) => {
        console.error("Error al cerrar sesión: ", error);
        toast({
          title: "Error",
          description: "No se pudo cerrar la sesión.",
          variant: "destructive",
        })
      });
  }, [router, toast]);


  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(handleSignOut, 30 * 60 * 1000); // 30 minutos
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const resetActivityTracker = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, resetActivityTracker);
    });

    resetTimer(); // Iniciar el temporizador al cargar el componente

    return () => {
      clearTimeout(activityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetActivityTracker);
      });
    };
  }, [handleSignOut]);


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
