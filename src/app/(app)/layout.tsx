'use client';
import { MobileNav } from '@/components/main-nav';
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

const CustomLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <circle cx="50" cy="50" r="42" fill="url(#grad1)" />
      <path d="M 30 70 L 30 50 L 40 50 L 40 70 Z" fill="hsl(var(--primary))" />
      <path d="M 45 70 L 45 40 L 55 40 L 55 70 Z" fill="hsl(var(--primary))" />
      <path d="M 60 70 L 60 30 L 70 30 L 70 70 Z" fill="hsl(var(--primary))" />
      <path d="M30 50 C 40 40, 60 40, 70 50 L 75 45 C 80 40, 70 20, 80 25 L 85 20" stroke="hsl(var(--accent))" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: "lightblue", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
  </svg>
);


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

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
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
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

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(activityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router, toast]);

  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return null; // O un componente de carga, mientras redirige
  }


  return (
      <div className="flex flex-col h-screen">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <Button asChild variant="ghost" className="h-10 gap-2 px-2 text-base font-bold">
              <Link href="/dashboard">
                <CustomLogo className="size-6 shrink-0 text-primary" />
                <span className="hidden sm:inline">
                  RapiGestion
                </span>
              </Link>
            </Button>
            <UserNav onSignOut={handleSignOut}/>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mb-16">
            {children}
        </main>
        {isMobile && <MobileNav />}
      </div>
  );
}
