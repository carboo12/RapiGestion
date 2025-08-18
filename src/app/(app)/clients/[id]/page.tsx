'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Handshake, ShieldCheck, List, PlusCircle } from 'lucide-react';
import Loading from '@/app/loading';
import { Separator } from '@/components/ui/separator';

interface Client {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
}

export default function ClientExpedientePage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCreditsCount, setActiveCreditsCount] = useState(0);
  const [paidCreditsCount, setPaidCreditsCount] = useState(0);

  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const fetchClientData = async () => {
        setLoading(true);
        const db = getFirestore(app);
        
        // Fetch client details
        const clientDoc = doc(db, 'clients', id);
        const clientSnap = await getDoc(clientDoc);

        if (clientSnap.exists()) {
          setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
        } else {
          console.error("No such client!");
          setClient(null);
        }

        // Fetch client credits to calculate counts
        const creditsQuery = query(collection(db, "credits"), where("clientId", "==", id));
        const creditsSnapshot = await getDocs(creditsQuery);
        
        let activeCount = 0;
        let paidCount = 0;
        creditsSnapshot.forEach((creditDoc) => {
            const creditData = creditDoc.data();
            if (creditData.status === 'Activo') {
                activeCount++;
            } else if (creditData.status === 'Pagado') {
                paidCount++;
            }
        });

        setActiveCreditsCount(activeCount);
        setPaidCreditsCount(paidCount);

        setLoading(false);
      };
      fetchClientData();
    }
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Cliente no encontrado</h2>
        <p className="text-muted-foreground">El cliente que buscas no existe o fue eliminado.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const fullName = [client.primerNombre, client.segundoNombre, client.apellido, client.segundoApellido]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expediente del Cliente</h1>
          <p className="text-muted-foreground">Gestiona las garantías, referencias y créditos del cliente.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">{fullName}</CardTitle>
          <div className="flex items-center gap-4 text-sm pt-2">
            <span className="font-semibold text-green-600">Créditos Activos: {activeCreditsCount}</span>
            <span className="text-muted-foreground">Ciclos: {paidCreditsCount}</span>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline" className="w-full justify-start h-12">
            <Handshake className="mr-3 h-5 w-5 text-primary" />
            <span>Agregar Referencia</span>
          </Button>
           <Button variant="outline" className="w-full justify-start h-12">
            <ShieldCheck className="mr-3 h-5 w-5 text-primary" />
            <span>Agregar Garantía</span>
          </Button>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Referencias</CardTitle>
                    <Button variant="ghost" size="icon">
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
                <CardDescription>Personas que dan fe del cliente.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    <p>No hay referencias que mostrar.</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Garantías</CardTitle>
                     <Button variant="ghost" size="icon">
                        <List className="h-5 w-5"/>
                    </Button>
                </div>
                <CardDescription>Objetos que respaldan los créditos.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    <p>No hay garantías que mostrar.</p>
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
