
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { MapIcon, MapPin, Phone, PlusCircle, Navigation, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User as FirebaseAuthUser } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, query, where, onSnapshot, Timestamp, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";

interface RouteStop {
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientLocation?: string | null;
  status: 'pending' | 'paid' | 'unpaid';
}

interface Route {
  id: string;
  collectorId: string;
  collectorName: string;
  collectorAvatar: string;
  date: Timestamp;
  creditIds: string[];
  status: string;
  progress: number;
  stops: RouteStop[];
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Client {
    id: string;
    primerNombre: string;
    apellido: string;
    direccion: string;
    phone: string;
    location?: string | null;
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
            } else {
                setLoading(false); // User profile doesn't exist
            }
        } else {
            setLoading(false); // No user logged in
        }
    });
    
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
        if (!userRole) setLoading(false);
        return;
    }

    const db = getFirestore(app);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTimestamp = Timestamp.fromDate(today);
    const tomorrowTimestamp = Timestamp.fromDate(tomorrow);

    let q;
    if (userRole === 'Administrador') {
        q = query(collection(db, 'routes'), 
            where('date', '>=', todayTimestamp),
            where('date', '<', tomorrowTimestamp));
    } else if (userRole === 'Gestor de Cobros') {
        q = query(collection(db, 'routes'), 
            where('collectorId', '==', currentUser.uid),
            where('date', '>=', todayTimestamp),
            where('date', '<', tomorrowTimestamp));
    } else {
        setLoading(false);
        setRoutes([]);
        return;
    }
    
    setLoading(true);
    const unsubscribeRoutes = onSnapshot(q, async (snapshot) => {
      try {
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const userMap = new Map(usersSnapshot.docs.map(d => [d.id, d.data() as User]));

        const allClientIds = new Set<string>();
        snapshot.docs.forEach(d => {
            const creditIds = d.data().creditIds as string[];
            // In a real app, we'd get clientId from the credit doc, here we assume creditId is clientId
            creditIds.forEach(id => allClientIds.add(id));
        });

        const clientMap = new Map<string, Client>();
        if (allClientIds.size > 0) {
            const clientIdsArr = Array.from(allClientIds);
             const clientPromises = [];
             for (let i = 0; i < clientIdsArr.length; i += 30) {
                 const chunk = clientIdsArr.slice(i, i + 30);
                 // Firestore `in` query limit is 30.
                 // We query credits to get client ids. For now, assuming creditId is clientId.
                 const clientsQuery = query(collection(db, 'clients'), where('__name__', 'in', chunk));
                 clientPromises.push(getDocs(clientsQuery));
             }
             const clientSnapshots = await Promise.all(clientPromises);
             clientSnapshots.forEach(snap => snap.forEach(doc => clientMap.set(doc.id, { id: doc.id, ...doc.data() } as Client)));
        }


        const routesListPromises = snapshot.docs.map(async d => {
          const routeData = d.data();
          const collector = userMap.get(routeData.collectorId);
          
          const creditIds = routeData.creditIds as string[];
          const stops: RouteStop[] = [];

          for(const creditId of creditIds) {
              const creditDoc = await getDoc(doc(db, 'credits', creditId));
              if(creditDoc.exists()){
                const clientId = creditDoc.data().clientId;
                const client = clientMap.get(clientId);
                if (client) {
                   stops.push({
                       clientId: client.id,
                       clientName: `${client.primerNombre} ${client.apellido}`.trim(),
                       clientAddress: client.direccion,
                       clientPhone: client.phone,
                       clientLocation: client.location,
                       status: 'pending' // This needs real logic based on payments
                   });
                }
              }
          }
          
          return {
            id: d.id,
            collectorName: collector?.name || 'Desconocido',
            collectorAvatar: collector?.name.split(' ').map(n => n[0]).join('') || '??',
            progress: 0, // TODO: calculate progress
            ...routeData,
            stops,
          } as Route;
        });

        const routesList = await Promise.all(routesListPromises);
        setRoutes(routesList);
      } catch (error) {
        console.error("Error processing routes:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
        console.error("Error fetching routes:", error);
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
                  <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="avatar person" />
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
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><MapIcon className="w-4 h-4 text-muted-foreground" /> {route.stops.length} paradas en la ruta</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                 {route.stops.map(stop => (
                    <div key={stop.clientId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex-1">
                            <p className="text-sm font-medium">{stop.clientName}</p>
                            <p className="text-xs text-muted-foreground">{stop.clientAddress}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button asChild variant="outline" size="icon" className="h-8 w-8">
                                <a href={`tel:${stop.clientPhone}`}>
                                    <Phone className="w-4 h-4"/>
                                </a>
                            </Button>
                             <Button asChild variant="outline" size="icon" className="h-8 w-8" disabled={!stop.clientLocation}>
                                <a href={`https://www.google.com/maps/search/?api=1&query=${stop.clientLocation?.replace(/Lat: |Lon: /g, '')}`} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="w-4 h-4"/>
                                </a>
                            </Button>
                        </div>
                    </div>
                 ))}
                </div>
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
