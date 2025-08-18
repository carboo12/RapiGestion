'use client';
import { DesktopNav, MobileNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Loading from '../loading';
import Image from 'next/image';
import { Logo } from '@/components/logo';
import { Bell } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);


  const handleSignOut = useCallback(() => {
    const auth = getAuth(app);
    signOut(auth)
      .then(() => {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente.",
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
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
    if (user) { // Only set up inactivity timer if user is logged in
        let activityTimer: NodeJS.Timeout;

        const resetTimer = () => {
          clearTimeout(activityTimer);
          activityTimer = setTimeout(() => {
             const auth = getAuth(app);
             if (auth.currentUser) {
                signOut(auth).then(() => {
                    toast({
                        title: "Sesión cerrada por inactividad",
                        description: "Tu sesión ha sido cerrada automáticamente.",
                    });
                    router.push('/');
                });
             }
          }, 30 * 60 * 1000); // 30 minutos
        };

        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
          clearTimeout(activityTimer);
          events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }
  }, [user, router, toast]);

  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return null; // Or a loading component, while redirecting
  }


  return (
      <div className="flex h-full w-full">
        <DesktopNav />
        <div className="flex flex-col flex-1 w-full overflow-hidden">
            <header className="flex-shrink-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <Button asChild variant="ghost" className="h-10 gap-2 px-2 text-base font-bold md:hidden">
                  <Link href="/dashboard">
                    <Logo className="size-6 shrink-0 text-primary" />
                    <span className="hidden sm:inline">
                      RapiGestion
                    </span>
                  </Link>
                </Button>
                <div className="flex-1"></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div title={isOnline ? 'En línea' : 'Sin conexión'} className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notificaciones</span>
                    </Button>
                  </div>
                  <UserNav onSignOut={handleSignOut}/>
                </div>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-4 md:p-6 lg:p-8 h-full">
                {children}
              </div>
            </main>
            {isMobile && <MobileNav />}
        </div>
      </div>
  );
}
