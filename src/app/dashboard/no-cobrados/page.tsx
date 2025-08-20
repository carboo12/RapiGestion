'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, onSnapshot, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Client {
    id: string;
    primerNombre: string;
    apellido: string;
}

interface PendingCredit {
  id: string;
  clientId: string;
  clientName: string;
  balance: number;
  status: 'Activo' | 'Vencido';
  firstPaymentDate: Timestamp;
}

const getStatusClasses = (credit: PendingCredit) => {
  const isOverdue = credit.firstPaymentDate && new Date(credit.firstPaymentDate.toDate()) < new Date();
  
  switch (credit.status) {
    case 'Vencido':
      return {
        border: 'border-red-500',
        avatar: 'bg-red-500',
        arrow: 'text-red-500',
      };
    case 'Activo':
      if (isOverdue) {
          return {
            border: 'border-yellow-500',
            avatar: 'bg-yellow-500',
            arrow: 'text-yellow-500',
          };
      }
      return {
        border: 'border-green-500',
        avatar: 'bg-green-500',
        arrow: 'text-green-500',
      };
    default:
      return {
        border: 'border-gray-300',
        avatar: 'bg-gray-500',
        arrow: 'text-gray-400',
      };
  }
};

export default function NoCobradosPage() {
  const [pendingCredits, setPendingCredits] = useState<PendingCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setCurrentUser(user);
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserRole(userDocSnap.data().role);
            } else {
                setUserRole(null);
                setLoading(false);
            }
        } else {
            setCurrentUser(null);
            setUserRole(null);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
        if (!userRole) setLoading(false);
        return;
    }

    setLoading(true);
    const db = getFirestore(app);

    const fetchPendingCredits = async () => {
        try {
            const clientsRef = collection(db, 'clients');
            const clientSnapshot = await getDocs(clientsRef);
            const clientMap = new Map(clientSnapshot.docs.map(c => [c.id, c.data() as Client]));

            let creditQuery = query(collection(db, 'credits'), where("status", "in", ["Activo", "Vencido"]));
            
            const creditSnapshot = await getDocs(creditQuery);
            const creditsData = creditSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<PendingCredit, 'clientName'>));

            const enrichedCredits = creditsData.map(credit => {
                const client = clientMap.get(credit.clientId);
                return {
                    ...credit,
                    clientName: client ? `${client.primerNombre} ${client.apellido}`.trim() : 'Cliente Desconocido',
                };
            });

            setPendingCredits(enrichedCredits);

        } catch(error) {
            console.error("Error processing pending credits:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchPendingCredits();

  }, [userRole, currentUser]);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-semibold text-primary">Pendiente de Cobro</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10 pr-10 rounded-full" />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">
        {loading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : pendingCredits.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-muted-foreground">
                  {userRole === 'Gestor de Cobros' ? 'No tienes créditos pendientes en tu ruta de hoy.' : 'No hay créditos pendientes de cobro.'}
                </p>
            </div>
        ) : (
            <ul className="space-y-3">
            {pendingCredits.map((credit) => {
                const classes = getStatusClasses(credit);
                const initials = credit.clientName.split(' ').map(n => n[0]).slice(0,2).join('');

                return (
                <li key={credit.id}>
                    <Link href={`/credits/${credit.id}/payment`} className={`flex items-center p-3 bg-card rounded-lg border-2 ${classes.border} w-full text-left`}>
                        <Avatar className={`h-10 w-10 text-white mr-4 ${classes.avatar}`}>
                        <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                        <p className="font-semibold text-sm uppercase">{credit.clientName}</p>
                        <p className="text-blue-600 font-bold text-sm">Cancelación: C$ {((credit.balance || 0).toFixed(2))}</p>
                        </div>
                        <div className={`flex items-center justify-center h-6 w-6 rounded-full border-2 ${classes.border}`}>
                        <ChevronRight className={`h-5 w-5 ${classes.arrow}`} />
                        </div>
                    </Link>
                </li>
                )
            })}
            </ul>
        )}
      </div>
    </div>
  );
}
