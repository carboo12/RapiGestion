'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Share2, Wallet } from 'lucide-react';
import Loading from '@/app/loading';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Logo } from '@/components/logo';

interface Payment {
  id: string;
  clientId: string;
  creditId: string;
  amount: number;
  paymentDate: Timestamp;
}

interface Client {
    id: string;
    primerNombre: string;
    segundoNombre?: string;
    apellido: string;
    segundoApellido?: string;
}

interface CompanySettings {
    companyName: string;
    slogan?: string;
    ruc: string;
    phone: string;
    address: string;
    defaultCurrency: string;
    exchangeRate: number;
}


// Dummy data for now
const gestorName = 'HENRY YASMIR CONTRERAS ZUNIGA'; // Dummy gestor

export default function ReceiptPage() {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const db = getFirestore(app);
      const fetchReceiptData = async () => {
        setLoading(true);
        try {
            // Fetch company settings
            const settingsDocRef = doc(db, 'settings', 'general');
            const settingsSnap = await getDoc(settingsDocRef);
            if(settingsSnap.exists()) {
                setCompanySettings(settingsSnap.data() as CompanySettings);
            }

            const paymentDocRef = doc(db, 'payments', id);
            const paymentSnap = await getDoc(paymentDocRef);

            if (paymentSnap.exists()) {
                const paymentData = { id: paymentSnap.id, ...paymentSnap.data() } as Payment;
                setPayment(paymentData);

                const clientDocRef = doc(db, 'clients', paymentData.clientId);
                const clientSnap = await getDoc(clientDocRef);
                if (clientSnap.exists()) {
                    setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
                } else {
                    setClient(null);
                }
            } else {
                setPayment(null);
            }
        } catch (error) {
            console.error("Error fetching receipt data:", error);
            setPayment(null);
            setClient(null);
        } finally {
            setLoading(false);
        }
      };
      
      fetchReceiptData();
    }
  }, [id]);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
      if (!timestamp) return 'N/A';
      try {
          return format(timestamp.toDate(), "dd/MM/yyyy, h:mm:ss a", { locale: es });
      } catch (error) {
          return 'Fecha inválida';
      }
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'C$ 0.00';
    return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  const handleAnotherPayment = () => {
    if(payment) {
        router.push(`/credits/${payment.creditId}/payment`);
    }
  }

  if (loading) return <Loading />;
  
  if (!payment || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h2 className="text-2xl font-bold">Recibo no encontrado</h2>
        <p className="text-muted-foreground">El recibo que buscas no existe o fue eliminado.</p>
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

  // Dummy values for receipt details
  const receiptDetails = {
      cuotaDia: 0,
      montoAtrasado: 11395.00,
      diasMora: 94,
      totalPagar: 11395.00,
      montoCancelacion: 11395.00,
      nuevoSaldo: 11295.00,
      concepto: 'ABONO DE CUOTA',
  };

  return (
    <div className="flex flex-col h-full -m-4 md:-m-8">
      <div className="flex flex-col flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
        <header className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6 text-green-600" />
          </Button>
          <h1 className="text-lg font-bold text-green-600">Abono #: {payment.id.substring(0, 5)}</h1>
          <span className="text-xs text-muted-foreground w-10">v 10.1.1</span>
        </header>

        <main className="flex-1 p-4 space-y-4 pb-24">
            <div className="bg-white p-6 rounded-lg shadow-md font-sans">
                <div className="text-center mb-4">
                    <div className="flex justify-center items-center mb-2">
                        <Logo className="w-20 h-20 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-blue-600">{companySettings?.companyName || 'RapiGestion'}</h2>
                    {companySettings?.slogan && <p className="text-sm">{companySettings.slogan}</p>}
                    <p className="text-sm">RUC: {companySettings?.ruc || 'No definido'}</p>
                    <p className="text-sm">Telefono: {companySettings?.phone || 'No definido'}</p>
                    <p className="text-sm">Cobro del Dia #: 1</p>
                </div>

                <div className="border-t border-b border-dashed py-2 mb-4 text-sm">
                    <p>Transaccion: {payment.id.substring(0,5)}</p>
                    <p>Fecha/hora: {formatDate(payment.paymentDate)}</p>
                    <p className="font-bold">CLIENTE: {clientFullName}</p>
                </div>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>CUOTA DIA:</span>
                        <span className="font-semibold">{formatCurrency(receiptDetails.cuotaDia)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>MONTO ATRASADO:</span>
                        <span className="font-semibold">{formatCurrency(receiptDetails.montoAtrasado)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>DIAS MORA:</span>
                        <span className="font-semibold">{receiptDetails.diasMora}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base">
                        <span>TOTAL PAGAR:</span>
                        <span>{formatCurrency(receiptDetails.totalPagar)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>MONTO CANCELACION:</span>
                        <span className="font-semibold">{formatCurrency(receiptDetails.montoCancelacion)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">TOTAL ABONADO:</span>
                        <span className="font-bold text-green-600 text-base">{formatCurrency(payment.amount)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>CONCEPTO:</span>
                        <span className="font-semibold">{receiptDetails.concepto}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="font-bold">NUEVO SALDO:</span>
                        <span className="font-bold text-red-600 text-base">{formatCurrency(receiptDetails.nuevoSaldo)}</span>
                    </div>
                </div>

                <div className="text-center mt-6 border-t pt-2">
                    <p className="text-sm font-bold text-blue-600">{gestorName}</p>
                </div>
            </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-2 border-t shadow-lg-top md:hidden">
          <div className="flex justify-around items-center">
              <Button variant="outline" className="h-14 w-24 flex-shrink-0 rounded-2xl border-2 border-green-500 text-green-600">
                  <Printer className="h-8 w-8" />
              </Button>
              <Button variant="outline" className="h-14 w-24 flex-shrink-0 rounded-2xl border-2 border-blue-500 text-blue-600">
                  <Share2 className="h-8 w-8" />
              </Button>
              <Button onClick={handleAnotherPayment} variant="outline" className="h-14 w-24 flex-shrink-0 rounded-2xl border-2 border-green-500 text-green-600">
                  <Wallet className="h-8 w-8" />
              </Button>
          </div>
      </div>
    </div>
  );
}
