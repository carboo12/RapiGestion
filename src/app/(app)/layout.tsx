
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
import { Bell, MapPinned } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  title: string;
  description: string;
  link: string;
  read: boolean;
  createdAt: any;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

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
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
        }

        // Subscribe to notifications
        const notificationsQuery = query(collection(db, `users/${user.uid}/notifications`), where('read', '==', false));
        const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
          const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
          setNotifications(newNotifications);
          setUnreadCount(newNotifications.length);
        });
        setLoading(false);

        // In a real app, you would want to return this unsubscribe function
        // return () => unsubscribeNotifications();

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

  const handleNotificationClick = async (notification: Notification) => {
      const db = getFirestore(app);
      if (user) {
          const notifDocRef = doc(db, `users/${user.uid}/notifications`, notification.id);
          await updateDoc(notifDocRef, { read: true });
          router.push(notification.link);
      }
  }

  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return null; // Or a loading component, while redirecting
  }


  return (
      <div className="flex h-full w-full">
        <DesktopNav userRole={userRole} />
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
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{unreadCount}</Badge>
                                )}
                                <span className="sr-only">Notificaciones</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0">
                            <div className="p-4">
                               <h4 className="font-medium text-sm">Notificaciones</h4>
                            </div>
                            <Separator />
                             {notifications.length > 0 ? (
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.map(notif => (
                                        <button key={notif.id} onClick={() => handleNotificationClick(notif)} className="w-full text-left p-4 hover:bg-accent transition-colors border-b">
                                            <div className="flex items-start gap-3">
                                               <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                                                    <MapPinned className="h-5 w-5"/>
                                               </div>
                                               <div>
                                                    <p className="font-semibold text-sm">{notif.title}</p>
                                                    <p className="text-xs text-muted-foreground">{notif.description}</p>
                                               </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                             ) : (
                                <p className="text-center text-sm text-muted-foreground p-8">No tienes notificaciones nuevas.</p>
                             )}
                        </PopoverContent>
                    </Popover>

                  </div>
                  <UserNav onSignOut={handleSignOut}/>
                </div>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-4 md:p-6 lg:p-8 h-full">
                {children}
              </div>
            </main>
            {isMobile && <MobileNav userRole={userRole} />}
        </div>
      </div>
  );
}

    