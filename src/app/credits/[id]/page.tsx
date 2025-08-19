'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Plus, ShieldCheck, DollarSign, List, Edit, Printer, Share2, PlusCircle } from 'lucide-react';
import Loading from '@/app/loading';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
}

interface Credit {
  id: string;
  clientId: string;
  amount: number;
  currency: 'C$' | 'USD';
  interestRate: number;
  term: number; // Plazo en meses
  paymentFrequency: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  numberOfInstallments: number;
  disbursementDate: Timestamp;
  firstPaymentDate: Timestamp;
  status: 'Activo' | 'Pagado' | 'Vencido';
  totalToPay: number;
  balance: number;
  gestorId?: string;
}


interface Guarantee {
    id: string;
    clientId: string;
    articulo: string;
    color: string;
    marca: string;
    numeroDeSerie: string;
    valorEstimado: string;
    createdAt: Timestamp;
}

const GuaranteeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 512 512" fill="currentColor">
        <path d="M464 128H48C21.5 128 0 149.5 0 176v192c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48zm-16 224H64V192h384v160zM128 320h64c8.8 0 16-7.2 16-16s-7.2-16-16-16h-64c-8.8 0-16 7.2-16 16s7.2 16 16 16zm-64-64h192c8.8 0 16-7.2 16-16s-7.2-16-16-16H64c-8.8 0-16 7.2-16 16s7.2 16 16 16zm320-32a32 32 0 110-64 32 32 0 010 64z"/>
    </svg>
)

export default function CreditDetailPage() {
  const [credit, setCredit] = useState<Credit | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isGuaranteeDialogOpen, setIsGuaranteeDialogOpen] = useState(false);
  
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

          const clientDocRef = doc(db, 'clients', creditData.clientId);
          const clientSnap = await getDoc(clientDocRef);
          if (clientSnap.exists()) {
            setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
          } else {
             setClient(null);
          }
          
          const guaranteesQuery = query(collection(db, "guarantees"), where("clientId", "==", creditData.clientId));
          const unsubscribeGuarantees = onSnapshot(guaranteesQuery, (snapshot) => {
              const guaranteesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guarantee));
              setGuarantees(guaranteesList);
          });
          
          // In a real app, you would probably want to unsubscribe from this listener
          // return () => unsubscribeGuarantees();

        } else {
          setCredit(null);
        }
        setLoading(false);
      };
      
      fetchCreditData();
    }
  }, [id]);
  
  const handleGuaranteeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!credit) return;

    const formData = new FormData(e.currentTarget);
    const guaranteeData = {
        clientId: credit.clientId,
        articulo: formData.get('guarantee-item') as string,
        color: formData.get('guarantee-color') as string,
        marca: formData.get('guarantee-brand') as string,
        numeroDeSerie: formData.get('guarantee-serial') as string,
        valorEstimado: formData.get('guarantee-value') as string,
        createdAt: serverTimestamp()
    };

    try {
        const db = getFirestore(app);
        await addDoc(collection(db, 'guarantees'), guaranteeData);
        toast({ title: "Éxito", description: "Garantía agregada correctamente." });
        setIsGuaranteeDialogOpen(false);
    } catch (error) {
        console.error("Error adding guarantee:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la garantía.' });
    }
  }
  
  const formatDate = (timestamp: Timestamp | null | undefined) => {
      if (!timestamp) return 'N/A';
      try {
          return format(timestamp.toDate(), "d/M/yyyy", { locale: es });
      } catch (error) {
          return 'Fecha inválida';
      }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'C$ 0.00';
    return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const handleGoToPayment = () => {
    router.push(`/credits/${id}/payment`);
  }
  
  if (loading) return <Loading />;
  
  if (!credit || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-2xl font-bold">Crédito no encontrado</h2>
        <p className="text-muted-foreground">El crédito que buscas no existe o fue eliminado.</p>
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
    
  const plazoText = `${credit.numberOfInstallments} ${credit.paymentFrequency === 'diario' ? 'DÍAS' : credit.paymentFrequency === 'semanal' ? 'SEMANAS' : credit.paymentFrequency === 'quincenal' ? 'QUINCENAS' : 'MESES'}`;


  return (
    <div className="flex flex-col h-full -m-4 md:-m-8">
      <div className="flex flex-col flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
        <header className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.push('/credits')}>
            <ArrowLeft className="h-6 w-6 text-green-600" />
          </Button>
          <h1 className="text-lg font-bold text-green-600">Detalles del Crédito</h1>
          <span className="text-xs text-muted-foreground w-10">v 10.1.1</span>
        </header>

        <main className="flex-1 p-4 space-y-4 pb-36">
          <Card className="rounded-2xl border-2 border-green-500 shadow-lg">
              <CardContent className="p-4 space-y-2">
                  <div className='text-center'>
                      <span className="text-sm text-gray-500">Cliente:</span>
                      <p className="font-bold text-blue-600 text-lg">{clientFullName}</p>
                  </div>
                  <div className='text-center'>
                      <span className="text-sm text-gray-500">Gestor:</span>
                      <p className="font-bold text-blue-600">{credit.gestorId || 'No asignado'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 text-center text-sm">
                      <div>
                          <span className="text-gray-500">Entrega: </span>
                          <span className="font-semibold text-green-600">{formatDate(credit.disbursementDate)}</span>
                      </div>
                      <div>
                          <span className="text-gray-500">Vence: </span>
                          <span className="font-semibold text-red-500">{formatDate(credit.firstPaymentDate)}</span>
                      </div>
                  </div>
                   <div className="grid grid-cols-2 text-center text-sm">
                      <div>
                          <span className="text-gray-500">Periodicidad: </span>
                          <span className="font-semibold text-blue-600 uppercase">{credit.paymentFrequency}</span>
                      </div>
                      <div>
                          <span className="text-gray-500">Plazo: </span>
                          <span className="font-semibold text-blue-600">{plazoText}</span>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 text-center pt-2">
                      <div>
                          <p className="text-sm text-gray-500">M. Entregado</p>
                          <p className="font-bold text-green-600 text-lg">{formatCurrency(credit.amount)}</p>
                      </div>
                      <div>
                          <p className="text-sm text-gray-500">M. Pagar</p>
                          <p className="font-bold text-blue-600 text-lg">{formatCurrency(credit.totalToPay)}</p>
                      </div>
                  </div>
                  
                  <div className="text-center pt-1">
                      <p className="text-sm text-gray-500">Saldo Total</p>
                      <p className="font-bold text-red-600 text-2xl">{formatCurrency(credit.balance)}</p>
                  </div>
                  
                  <div className="pt-2">
                      <Button onClick={handleGoToPayment} variant="outline" className="w-full rounded-full border-green-500 border-2 text-green-600 h-12 text-lg font-bold">
                          <DollarSign className="mr-2 h-6 w-6"/>
                          Agregar Abono
                      </Button>
                  </div>
              </CardContent>
          </Card>

          <h3 className="text-center font-bold text-blue-600">Lista de Garantías</h3>

          <div className="space-y-3">
              {guarantees.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                      <p>No hay garantías registradas para este cliente.</p>
                  </div>
              ) : (
                  guarantees.map(guarantee => (
                    <Card key={guarantee.id} className="rounded-2xl border-2 border-green-500">
                        <CardContent className="p-3 flex items-center gap-4">
                            <div className="bg-green-500 text-white rounded-full p-2">
                                <GuaranteeIcon className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-blue-600 uppercase">{guarantee.articulo}</p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Marca: </span>
                                    <span className="font-semibold text-blue-600 uppercase">{guarantee.marca}</span>
                                    <span className="text-gray-500"> Color: </span>
                                    <span className="font-semibold text-blue-600 uppercase">{guarantee.color}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-gray-500">Valor Estimado: </span>
                                    <span className="font-bold text-red-500">{formatCurrency(parseFloat(guarantee.valorEstimado))}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                  ))
              )}
          </div>
        </main>
      </div>

        <Dialog open={isGuaranteeDialogOpen} onOpenChange={setIsGuaranteeDialogOpen}>
            <DialogTrigger asChild>
                 <Button className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight">
                    <PlusCircle className="h-7 w-7" />
                    <span className="text-xs mt-1">Garantia</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Agregar Nueva Garantía</DialogTitle>
                    <DialogDescription>Describe el objeto que respaldará el crédito.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6 no-scrollbar">
                <form id="guarantee-form" onSubmit={handleGuaranteeSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="guarantee-item">Artículo</Label>
                        <Input id="guarantee-item" name="guarantee-item" placeholder="Ej: Televisor, Motocicleta" required />
                    </div>
                    <div>
                        <Label htmlFor="guarantee-color">Color</Label>
                        <Input id="guarantee-color" name="guarantee-color" placeholder="Ej: Negro" required />
                    </div>
                    <div>
                        <Label htmlFor="guarantee-brand">Marca</Label>
                        <Input id="guarantee-brand" name="guarantee-brand" placeholder="Ej: Samsung" required />
                    </div>
                    <div>
                        <Label htmlFor="guarantee-serial">Número de Serie</Label>
                        <Input id="guarantee-serial" name="guarantee-serial" placeholder="Ej: 12345XYZ" required />
                    </div>
                    <div>
                        <Label htmlFor="guarantee-value">Valor Estimado (C$)</Label>
                        <Input id="guarantee-value" name="guarantee-value" type="number" required />
                    </div>
                </form>
                </div>
                <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => setIsGuaranteeDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" form="guarantee-form">Guardar Garantía</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
