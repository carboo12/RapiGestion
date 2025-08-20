
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2, Eye } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { getFirestore, collection, onSnapshot, query, Timestamp, where, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface Payment {
  id: string;
  clientId: string;
  creditId: string;
  amount: number;
  paymentDate: Timestamp;
  gestorId: string;
  gestorName: string;
  clientName?: string;
}

interface Client {
    id: string;
    primerNombre: string;
    apellido: string;
}

interface User {
  role: string;
}

export default function PaymentsListPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientMap, setClientMap] = useState<Map<string, Client>>(new Map());
  const [filters, setFilters] = useState({
    clientName: '',
    startDate: '',
    endDate: '',
  });
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserRole((userDocSnap.data() as User).role);
        } else {
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const db = getFirestore(app);
    const clientsCollection = collection(db, 'clients');
    
    const unsubClients = onSnapshot(clientsCollection, (snapshot) => {
        const newClientMap = new Map();
        snapshot.forEach(doc => newClientMap.set(doc.id, { id: doc.id, ...doc.data() }));
        setClientMap(newClientMap);
    }, (error) => {
        console.error("Error fetching clients:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los clientes.' });
    });

    if (!currentUser || userRole === null) {
      if (userRole === null && currentUser) {
        // Still waiting for role
      } else {
        setLoading(false);
      }
      return;
    }
    
    setLoading(true);
    let paymentsQuery;
    if (userRole === 'Administrador') {
      paymentsQuery = query(collection(db, 'payments'));
    } else {
      paymentsQuery = query(collection(db, 'payments'), where("gestorId", "==", currentUser.uid));
    }

    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(paymentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching payments:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los pagos.' });
      setLoading(false);
    });

    return () => {
        unsubClients();
        unsubPayments();
    };
  }, [toast, currentUser, userRole]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const formatCurrency = (amount: number) => {
    return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const filteredPayments = useMemo(() => {
    let result = payments.map(p => ({...p, clientName: clientMap.get(p.clientId) ? `${clientMap.get(p.clientId)?.primerNombre} ${clientMap.get(p.clientId)?.apellido}`.trim() : 'Cliente Desconocido' }));

    if (filters.clientName) {
      result = result.filter(p => 
        p.clientName?.toLowerCase().includes(filters.clientName.toLowerCase())
      );
    }
    if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0,0,0,0);
        result = result.filter(p => p.paymentDate.toDate() >= start);
    }
    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23,59,59,999);
        result = result.filter(p => p.paymentDate.toDate() <= end);
    }

    return result.sort((a,b) => b.paymentDate.toDate().getTime() - a.paymentDate.toDate().getTime());
  }, [payments, clientMap, filters]);
  
  const totalRecovered = useMemo(() => {
    return filteredPayments.reduce((acc, payment) => acc + payment.amount, 0);
  }, [filteredPayments]);


  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), "dd/MM/yyyy, h:mm:ss a", { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Historial de Pagos</h2>
        <p className="text-muted-foreground">
          Un registro de todos los abonos y pagos realizados en el sistema.
        </p>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Filtrar Pagos</CardTitle>
            <CardDescription>Busca por cliente o filtra por un rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input name="clientName" value={filters.clientName} onChange={handleFilterChange} placeholder="Buscar por nombre de cliente..." className="pl-10" />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <Label htmlFor="startDate" className="text-sm font-medium">Fecha de Inicio</Label>
                        <Input id="startDate" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
                    </div>
                    <span className="text-muted-foreground hidden sm:inline">-</span>
                    <div className="w-full sm:w-auto">
                        <Label htmlFor="endDate" className="text-sm font-medium">Fecha de Fin</Label>
                        <Input id="endDate" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange}/>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle>Lista de Pagos</CardTitle>
              <div className="text-sm font-semibold">
                  Total Recuperado: <span className="text-green-600">{formatCurrency(totalRecovered)}</span>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha de Pago</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Recibo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                            {payment.clientName}
                        </TableCell>
                        <TableCell>
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                            {formatCurrency(payment.amount)}
                        </Badge>
                        </TableCell>
                        <TableCell>{formatTimestamp(payment.paymentDate)}</TableCell>
                        <TableCell>{payment.gestorName || 'No disponible'}</TableCell>
                        <TableCell>
                            <Button asChild variant="ghost" size="icon">
                                <Link href={`/payments/${payment.id}`}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
