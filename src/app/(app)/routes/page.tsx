
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Map, MapPin, Phone, PlusCircle, Navigation, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, query, where, onSnapshot, Timestamp, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";

interface Route {
  id: string;
  collectorId: string;
  collectorName: string;
  collectorAvatar: string;
  date: Timestamp;
  creditIds: string[];
  status: string;
  progress: number;
}

interface RouteStop {
  name: string;
  address: string;
  status: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}


export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setCurrentUser(user);
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data() as User;
                setUserRole(userData.role);
            }
        } else {
            // Handle user not logged in
            setLoading(false);
        }
    });
    
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userRole || !currentUser) return;

    const db = getFirestore(app);
    const routesRef = collection(db, 'routes');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimestamp = Timestamp.fromDate(today);
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

    let q;
    if (userRole === 'Administrador') {
        q = query(routesRef, 
            where('date', '>=', todayTimestamp),
            where('date', '<', tomorrowTimestamp));
    } else if (userRole === 'Gestor de Cobros') {
        q = query(routesRef, 
            where('collectorId', '==', currentUser.uid),
            where('date', '>=', todayTimestamp),
            where('date', '<', tomorrowTimestamp));
    } else {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const unsubscribeRoutes = onSnapshot(q, async (snapshot) => {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map(d => ({id: d.id, ...d.data() as User}));

      const routesList = snapshot.docs.map(d => {
        const routeData = d.data();
        const collector = usersList.find(u => u.id === routeData.collectorId);
        return {
          id: d.id,
          collectorName: collector?.name || 'Desconocido',
          collectorAvatar: collector?.name.split(' ').map(n => n[0]).join('') || '??',
          progress: 0, // TODO: calculate progress
          ...routeData
        } as Route;
      });

      setRoutes(routesList);
      setLoading(false);
    });

    return () => unsubscribeRoutes();

  }, [userRole, currentUser]);


  if(loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-center">
        <h2 className="text-3xl font-bold tracking-tight">Rutas Diarias</h2>
      </div>

      {routes.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No hay rutas asignadas para hoy.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person avatar" />
                  <AvatarFallback>{route.collectorAvatar}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{route.collectorName}</CardTitle>
                  <CardDescription>Gestor de Cobros</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Progreso de la Ruta</span>
                  <span className="text-sm text-muted-foreground">{route.progress}%</span>
                </div>
                <Progress value={route.progress} />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Map className="w-4 h-4 text-muted-foreground" /> {route.creditIds.length} paradas en la ruta</h4>
                {/* Here you would fetch and display the stops (clients) based on route.creditIds */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
       {userRole === 'Administrador' && (
        <Link href="/routes/assign">
          <Button
            className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight"
          >
            <PlusCircle className="h-7 w-7" />
            <span className="text-xs mt-1">Agregar</span>
          </Button>
        </Link>
       )}
    </div>
  )
}
