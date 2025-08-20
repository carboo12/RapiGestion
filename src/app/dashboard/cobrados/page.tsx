'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot, getDocs, Timestamp, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface Client {
    id: string;
    primerNombre: string;
    apellido: string;
}

interface Payment {
  id: string;
  creditId: string;
  clientId: string;
  clientName: string;
  amount: number;
  paymentDate: Timestamp;
  gestorId?: string;
}

export default function CobradosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    }
    const db = getFirestore(app);
    setLoading(true);

    const loadData = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const q = query(collection(db, 'payments'),
                where("gestorId", "==", currentUser.uid)
            );
            
            const paymentSnapshot = await getDocs(q);
            // Filter payments for today in the client
            const paymentsData = paymentSnapshot.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Omit<Payment, 'clientName'>))
              .filter(p => {
                  const paymentDate = p.paymentDate.toDate();
                  return paymentDate >= today && paymentDate < tomorrow;
              });


            if (paymentsData.length === 0) {
                setPayments([]);
                setLoading(false);
                return;
            }

            const clientsRef = collection(db, 'clients');
            const clientSnapshot = await getDocs(clientsRef);
            const clientMap = new Map(clientSnapshot.docs.map(c => [c.id, c.data() as Client]));

            const enrichedPayments = paymentsData.map(payment => {
                const client = clientMap.get(payment.clientId);
                return {
                    ...payment,
                    clientName: client ? `${client.primerNombre} ${client.apellido}`.trim() : 'Cliente Desconocido',
                };
            });

            setPayments(enrichedPayments);
        } catch(error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    }
    
    loadData();

  }, [currentUser]);


  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Cuotas Aplicadas Hoy</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10 pr-10" />
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
        ) : payments.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No has registrado cobros hoy.</p>
            </div>
        ) : (
            <ul className="space-y-3">
            {payments.map((payment) => (
                <li key={payment.id}>
                    <Link href={`/payments/${payment.id}`} className="flex items-center p-3 bg-card rounded-lg border border-green-200 w-full text-left">
                        <Avatar className="h-10 w-10 bg-primary text-primary-foreground mr-4">
                            <AvatarFallback>{payment.clientName.split(' ').slice(0, 2).map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold text-sm uppercase">{payment.clientName}</p>
                            <p className="text-blue-600 font-bold text-sm">Abono: C$ {(payment.amount || 0).toFixed(2)}</p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </Link>
                </li>
            ))}
            </ul>
        )}
      </div>
    </div>
  );
}
