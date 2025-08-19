'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore, Timestamp, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Loading from '@/app/loading';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { getAuth } from 'firebase/auth';

interface Client {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
  direccion: string;
}

interface Credit {
  id: string;
  clientId: string;
  balance: number;
  status: 'Activo' | 'Pagado' | 'Vencido';
  paymentFrequency: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  firstPaymentDate: Timestamp;
  disbursementDate: Timestamp;
  installmentAmount: number;
}

const ApplyPaymentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 14.252V16.69a1.16 1.16 0 01-1.16 1.16H4.16A1.16 1.16 0 013 16.69V7.31A1.16 1.16 0 014.16 6.15h8.68a1.16 1.16 0 011.16 1.16v2.442a.75.75 0 001.5 0V7.31a2.66 2.66 0 00-2.66-2.66H4.16a2.66 2.66 0 00-2.66 2.66v9.38a2.66 2.66 0 002.66 2.66h8.68a2.66 2.66 0 002.66-2.66V14.25a.75.75 0 00-1.5 0v.002z"></path><path d="M21.64 9.69a.74.74 0 00-1.05 0l-5.65 5.65a.75.75 0 001.06 1.06l5.64-5.65a.75.75 0 000-1.06zm-2.07 3.9L14.7 8.7a1.69 1.69 0 012.39 0l4.88 4.88a1.69 1.69 0 010 2.39L17.1 20.84a1.69 1.69 0 01-2.39 0l-4.88-4.88a1.69 1.69 0 010-2.39l.7-.7a.75.75 0 10-1.06-1.06l-.7.7a3.19 3.19 0 000 4.51l4.88 4.88a3.19 3.19 0 004.51 0l4.88-4.88a3.19 3.19 0 000-4.51l-4.88-4.88a.75.75 0 00-1.06 1.06l4.88 4.88a1.69 1.69 0 010 2.39l-4.88 4.88a1.69 1.69 0 01-2.39 0l-4.88-4.88a1.69 1.69 0 010-2.39l4.88-4.88a.19.19 0 000-.27.19.19 0 00-.27 0l-4.88 4.88a1.69 1.69 0 000 2.39l.7.7a.75.75 0 101.06-1.06z"></path>
    </svg>
)

export default function PaymentPage() {
  const [credit, setCredit] = useState<Credit | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [overdueDays, setOverdueDays] = useState(0);
  const [overdueInstallments, setOverdueInstallments] = useState(0);

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const db = getFirestore(app);

      const fetchCreditData = async () => {
        setLoading(true);
        const creditDocRef = doc(db, 'credits', id);
        const creditSnap = await getDoc(creditDocRef);

        if (creditSnap.exists()) {
          const creditData = { id: creditSnap.id, ...creditSnap.data() } as Credit;
          setCredit(creditData);
          setNewBalance(creditData.balance);

          const clientDocRef = doc(db, 'clients', creditData.clientId);
          const clientSnap = await getDoc(clientDocRef);
          if (clientSnap.exists()) {
            setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
          } else {
            setClient(null);
          }
        } else {
          setCredit(null);
        }
        setLoading(false);
      };
      
      fetchCreditData();
    }
  }, [id]);

  useEffect(() => {
    if (credit) {
      const amount = parseFloat(paymentAmount);
      if (!isNaN(amount) && amount > 0) {
        setNewBalance(credit.balance - amount);
      } else {
        setNewBalance(credit.balance);
      }
    }
  }, [paymentAmount, credit]);

  useEffect(() => {
    if (credit) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let expectedPayments = 0;
        let nextDueDate = credit.firstPaymentDate.toDate();

        while (nextDueDate <= today) {
            expectedPayments++;
            switch (credit.paymentFrequency) {
                case 'diario': nextDueDate.setDate(nextDueDate.getDate() + 1); break;
                case 'semanal': nextDueDate.setDate(nextDueDate.getDate() + 7); break;
                case 'quincenal': nextDueDate.setDate(nextDueDate.getDate() + 15); break;
                case 'mensual': nextDueDate.setMonth(nextDueDate.getMonth() + 1); break;
            }
        }

        const daysDiff = Math.floor((today.getTime() - credit.firstPaymentDate.toDate().getTime()) / (1000 * 3600 * 24));

        setOverdueDays(daysDiff > 0 ? daysDiff : 0);
        
        // This is a simplification. A real implementation would need to track actual payments made.
        setOverdueInstallments(expectedPayments > 0 ? expectedPayments - 1 : 0);
    }
  }, [credit]);


  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'C$ 0.00';
    return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  const handleApplyPayment = async () => {
    const auth = getAuth(app);
    const gestor = auth.currentUser;

    const amount = parseFloat(paymentAmount);
    if (!credit || !client || isNaN(amount) || amount <= 0 || !gestor) {
        toast({ variant: 'destructive', title: 'Error', description: 'Por favor, ingrese un monto válido o inicie sesión.' });
        return;
    }
    if (amount > credit.balance) {
        toast({ variant: 'destructive', title: 'Error', description: 'El abono no puede ser mayor que el saldo.' });
        return;
    }
    setIsSaving(true);
    const db = getFirestore(app);
    const creditRef = doc(db, 'credits', credit.id);
    const updatedBalance = credit.balance - amount;
    const updatedStatus = updatedBalance <= 0 ? 'Pagado' : credit.status;

    try {
        await updateDoc(creditRef, {
            balance: updatedBalance,
            status: updatedStatus,
        });

        const paymentRef = await addDoc(collection(db, 'payments'), {
          creditId: credit.id,
          clientId: credit.clientId,
          amount: amount,
          paymentDate: serverTimestamp(),
          gestorId: gestor.uid,
          gestorName: gestor.displayName || gestor.email,
        });

        // Notify Admins
        const usersRef = collection(db, 'users');
        const qAdmins = query(usersRef, where("role", "==", "Administrador"));
        const adminSnapshot = await getDocs(qAdmins);
        const clientFullName = `${client.primerNombre} ${client.apellido}`.trim();

        for (const adminDoc of adminSnapshot.docs) {
            const adminId = adminDoc.id;
            await addDoc(collection(db, `users/${adminId}/notifications`), {
                title: 'Nuevo Abono Registrado',
                description: `El gestor ${gestor.email} registró un abono de ${formatCurrency(amount)} para ${clientFullName}.`,
                link: `/payments/${paymentRef.id}`,
                read: false,
                createdAt: serverTimestamp()
            });
        }


        toast({ title: 'Éxito', description: 'El abono ha sido aplicado correctamente.' });
        router.push(`/payments/${paymentRef.id}`);
    } catch (error) {
        console.error("Error applying payment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aplicar el abono.' });
    } finally {
        setIsSaving(false);
    }
  }

  if (loading) return <Loading />;
  
  if (!credit || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-2xl font-bold">Crédito no encontrado</h2>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const clientFullName = [client.primerNombre, client.segundoNombre, client.apellido, client.segundoApellido]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();
    
  const amountToGetUpToDate = (overdueInstallments * credit.installmentAmount);


  return (
    <div className="flex flex-col h-full -m-4 md:-m-8">
      <div className="flex flex-col flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
        <header className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6 text-green-600" />
          </Button>
          <h1 className="text-lg font-bold text-green-600">Credito#: {credit.id.substring(0, 4)}</h1>
          <span className="text-xs text-muted-foreground w-10">v 10.1.1</span>
        </header>

        <main className="flex-1 p-4 space-y-4">
            <Card className="rounded-2xl border-2 border-green-500">
                <CardContent className="p-4 text-center">
                    <p className="font-bold text-blue-600">{clientFullName}</p>
                    <p className="text-sm text-gray-500">{client.direccion}</p>
                    <p className="text-sm mt-1">
                        <span className="text-red-500">Días de atraso: {overdueDays}</span>
                        <span className="ml-2 text-red-500">Cuotas atrasadas: {overdueInstallments}</span>
                    </p>
                </CardContent>
            </Card>

             <Card className="rounded-2xl border-2 border-green-500">
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Cuota:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(credit.installmentAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-green-600">Ponerse al dia:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(amountToGetUpToDate)}</span>
                    </div>
                    
                    <Input 
                        placeholder="Ingresar abono..." 
                        className="h-12 text-center text-lg rounded-full border-2 border-blue-500 focus-visible:ring-blue-500"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                    />

                    <div className="flex justify-between items-center">
                        <span className="font-medium">Nuevo Saldo:</span>
                        <span className="font-bold text-red-500">{formatCurrency(newBalance)}</span>
                    </div>

                    <Button onClick={handleApplyPayment} disabled={isSaving} className="w-full h-12 rounded-full bg-green-500 hover:bg-green-600 text-lg font-bold">
                        <ApplyPaymentIcon className="w-6 h-6 mr-2" />
                        Aplicar Cuota
                    </Button>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}

    