'use client';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getFirestore, collection, onSnapshot, getDocs, Timestamp, query, where, doc, getDoc } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronRight, SlidersHorizontal, User, Search, Loader2, PlusCircle } from "lucide-react"
import packageJson from "../../../package.json";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';


interface Client {
    id: string;
    primerNombre: string;
    apellido: string;
}

interface UserData {
  role: string;
}

interface Credit {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: 'C$' | 'USD';
  interestRate: number;
  term: number; // Plazo en meses
  paymentFrequency: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  numberOfInstallments: number; // Número de cuotas
  disbursementDate: Timestamp;
  firstPaymentDate: Timestamp;
  status: 'Activo' | 'Pagado' | 'Vencido';
}

const CreditItem = ({ credit, onClick }: { credit: Credit, onClick: (creditId: string) => void }) => {
    const formatDate = (timestamp: Timestamp | null) => {
        if (!timestamp) return 'N/A';
        try {
            return format(timestamp.toDate(), "P", { locale: es });
        } catch (error) {
            console.error("Error formatting date:", timestamp);
            return 'Fecha inválida';
        }
    }

    const getStatusStyles = () => {
        const isOverdue = credit.firstPaymentDate && new Date(credit.firstPaymentDate.toDate()) < new Date();
        
        switch (credit.status) {
            case 'Pagado':
                return {
                    container: 'border-green-500 hover:bg-green-50',
                    iconContainer: 'bg-green-500',
                    arrowContainer: 'border-green-500',
                    arrowIcon: 'text-green-500',
                    dateClass: 'text-green-600',
                    statusText: 'Pagado'
                };
            case 'Vencido':
                return {
                    container: 'border-red-500 hover:bg-red-50',
                    iconContainer: 'bg-red-500',
                    arrowContainer: 'border-red-500',
                    arrowIcon: 'text-red-500',
                    dateClass: 'text-red-500',
                    statusText: 'Vencido'
                };
            case 'Activo':
                if (isOverdue) {
                     return {
                        container: 'border-yellow-500 hover:bg-yellow-50',
                        iconContainer: 'bg-yellow-500',
                        arrowContainer: 'border-yellow-500',
                        arrowIcon: 'text-yellow-500',
                        dateClass: 'text-yellow-600',
                        statusText: 'Atrasado'
                    };
                }
                return {
                    container: 'border-sky-500 hover:bg-sky-50',
                    iconContainer: 'bg-sky-500',
                    arrowContainer: 'border-sky-500',
                    arrowIcon: 'text-sky-500',
                    dateClass: 'text-primary',
                    statusText: 'Activo'
                };
            default:
                return {
                    container: 'border-gray-300 hover:bg-gray-50',
                    iconContainer: 'bg-gray-400',
                    arrowContainer: 'border-gray-300',
                    arrowIcon: 'text-gray-400',
                    dateClass: 'text-primary',
                    statusText: 'Desconocido'
                };
        }
    };
    
    const styles = getStatusStyles();

    return (
        <li className="list-none">
            <button 
              onClick={() => onClick(credit.id)}
              className={`w-full flex items-center p-3 bg-card rounded-lg border-2 cursor-pointer transition-colors text-left ${styles.container}`}
            >
                <div className={`flex-shrink-0 h-11 w-11 rounded-full flex items-center justify-center mr-4 ${styles.iconContainer}`}>
                    <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate uppercase">{credit.clientName}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                        <span>Entregado: <span className="font-semibold text-green-600">{formatDate(credit.disbursementDate)}</span></span>
                        <span className="ml-2">Vence: <span className={`font-semibold ${styles.dateClass}`}>{formatDate(credit.firstPaymentDate)}</span></span>
                    </div>
                </div>
                 <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 ml-2 ${styles.arrowContainer}`}>
                    <ChevronRight className={`h-5 w-5 ${styles.arrowIcon}`} />
                </div>
            </button>
        </li>
    );
};


export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const { toast } = useToast();
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
        if(!userRole) setLoading(false);
        return;
    }

    setLoading(true);
    const db = getFirestore(app);

    const loadData = async () => {
        try {
            const allCreditsData = await getDocs(collection(db, 'credits'));
            let finalCreditsData = allCreditsData.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Credit, 'clientName'>));
            
            const clientsRef = collection(db, 'clients');
            const clientSnapshot = await getDocs(clientsRef);
            const clientMap = new Map(clientSnapshot.docs.map(c => [c.id, c.data() as Client]));

            const enrichedCredits = finalCreditsData.map(credit => {
                const client = clientMap.get(credit.clientId);
                return {
                    ...credit,
                    clientName: client ? `${client.primerNombre} ${client.apellido}`.trim() : 'Cliente Desconocido',
                };
            });

            setCredits(enrichedCredits);
        } catch (error) {
            console.error("Error fetching credits:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudieron cargar los créditos.",
            });
        } finally {
            setLoading(false);
        }
    };
    
    loadData();

  }, [userRole, currentUser, toast]);
  
  const handleCreditClick = (creditId: string) => {
    router.push(`/credits/${creditId}`);
  };

  return (
    <div className="relative h-full flex flex-col">
       <header className="flex items-center justify-between p-4">
         <h1 className="text-lg font-bold text-green-600">Créditos</h1>
         <span className="text-xs text-muted-foreground">v {packageJson.version}</span>
      </header>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar Crédito..." className="pl-10 pr-10 rounded-full bg-white border-gray-300" />
           <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

       {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar">
            {credits.length > 0 ? (
                <ul className="space-y-3">
                    {credits.map(credit => (
                        <CreditItem key={credit.id} credit={credit} onClick={handleCreditClick}/>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">
                      {userRole === 'Gestor de Cobros' ? 'No tienes créditos asignados para hoy.' : 'No hay créditos registrados.'}
                    </p>
                </div>
            )}
        </main>
      )}

      {userRole === 'Administrador' && (
        <Link href="/clients">
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
