'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Handshake, ShieldCheck, List, PlusCircle, User, Phone, Home, BadgePercent, Building, FileText, MapPin } from 'lucide-react';
import Loading from '@/app/loading';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface Client {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
}

interface Reference {
    id: string;
    clientId: string;
    name: string;
    phone: string;
    address: string;
    relationship: string;
    createdAt: Timestamp;
}

interface Guarantee {
    id: string;
    clientId: string;
    type: string;
    value: string;
    details: string;
    createdAt: Timestamp;
}

export default function ClientExpedientePage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCreditsCount, setActiveCreditsCount] = useState(0);
  const [paidCreditsCount, setPaidCreditsCount] = useState(0);

  const [references, setReferences] = useState<Reference[]>([]);
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);

  const [isRefDialogOpen, setIsRefDialogOpen] = useState(false);
  const [isGuaranteeDialogOpen, setIsGuaranteeDialogOpen] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const db = getFirestore(app);

      const fetchClientData = async () => {
        setLoading(true);
        // Fetch client details
        const clientDoc = doc(db, 'clients', id);
        const clientSnap = await getDoc(clientDoc);

        if (clientSnap.exists()) {
          setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
        } else {
          console.error("No such client!");
          setClient(null);
        }
        setLoading(false);
      };
      
      fetchClientData();

      // Listen for Credits
      const creditsQuery = query(collection(db, "credits"), where("clientId", "==", id));
      const unsubscribeCredits = onSnapshot(creditsQuery, (snapshot) => {
        let activeCount = 0;
        let paidCount = 0;
        snapshot.forEach((creditDoc) => {
            const creditData = creditDoc.data();
            if (creditData.status === 'Activo') activeCount++;
            else if (creditData.status === 'Pagado') paidCount++;
        });
        setActiveCreditsCount(activeCount);
        setPaidCreditsCount(paidCount);
      });
      
      // Listen for References
      const referencesQuery = query(collection(db, "references"), where("clientId", "==", id));
      const unsubscribeReferences = onSnapshot(referencesQuery, (snapshot) => {
          const refsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reference));
          setReferences(refsList);
      });

      // Listen for Guarantees
      const guaranteesQuery = query(collection(db, "guarantees"), where("clientId", "==", id));
      const unsubscribeGuarantees = onSnapshot(guaranteesQuery, (snapshot) => {
          const guaranteesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guarantee));
          setGuarantees(guaranteesList);
      });


      return () => {
        unsubscribeCredits();
        unsubscribeReferences();
        unsubscribeGuarantees();
      }
    }
  }, [id]);

  const handleReferenceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const refData = {
        clientId: id,
        name: formData.get('ref-name') as string,
        phone: formData.get('ref-phone') as string,
        address: formData.get('ref-address') as string,
        relationship: formData.get('ref-relationship') as string,
        createdAt: serverTimestamp()
    };
    
    try {
        const db = getFirestore(app);
        await addDoc(collection(db, 'references'), refData);
        toast({ title: "Éxito", description: "Referencia agregada correctamente." });
        setIsRefDialogOpen(false);
    } catch (error) {
        console.error("Error adding reference:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la referencia.' });
    }
  }

  const handleGuaranteeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const guaranteeData = {
        clientId: id,
        type: formData.get('guarantee-type') as string,
        value: formData.get('guarantee-value') as string,
        details: formData.get('guarantee-details') as string,
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
          <Dialog open={isRefDialogOpen} onOpenChange={setIsRefDialogOpen}>
            <DialogTrigger asChild>
               <Button variant="outline" className="w-full justify-start h-12">
                <Handshake className="mr-3 h-5 w-5 text-primary" />
                <span>Agregar Referencia</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Referencia</DialogTitle>
                <DialogDescription>Completa los datos de la persona que servirá como referencia.</DialogDescription>
              </DialogHeader>
              <form id="ref-form" onSubmit={handleReferenceSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="ref-name">Nombre Completo</Label>
                  <Input id="ref-name" name="ref-name" required />
                </div>
                 <div>
                  <Label htmlFor="ref-phone">Teléfono</Label>
                  <Input id="ref-phone" name="ref-phone" required />
                </div>
                 <div>
                  <Label htmlFor="ref-address">Dirección</Label>
                  <Input id="ref-address" name="ref-address" required />
                </div>
                 <div>
                  <Label htmlFor="ref-relationship">Parentesco</Label>
                  <Input id="ref-relationship" name="ref-relationship" required />
                </div>
              </form>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsRefDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" form="ref-form">Guardar Referencia</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isGuaranteeDialogOpen} onOpenChange={setIsGuaranteeDialogOpen}>
             <DialogTrigger asChild>
               <Button variant="outline" className="w-full justify-start h-12">
                <ShieldCheck className="mr-3 h-5 w-5 text-primary" />
                <span>Agregar Garantía</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Garantía</DialogTitle>
                <DialogDescription>Describe el objeto que respaldará el crédito.</DialogDescription>
              </DialogHeader>
              <form id="guarantee-form" onSubmit={handleGuaranteeSubmit} className="space-y-4">
                 <div>
                  <Label htmlFor="guarantee-type">Tipo de Garantía</Label>
                  <Input id="guarantee-type" name="guarantee-type" placeholder="Ej: Televisor, Motocicleta, Terreno" required />
                </div>
                 <div>
                  <Label htmlFor="guarantee-value">Valor Estimado (C$)</Label>
                  <Input id="guarantee-value" name="guarantee-value" type="number" required />
                </div>
                <div>
                  <Label htmlFor="guarantee-details">Detalles u Observaciones</Label>
                  <Textarea id="guarantee-details" name="guarantee-details" placeholder="Ej: TV Samsung 42 pulgadas, Modelo X, en buen estado." required />
                </div>
              </form>
               <DialogFooter>
                <Button variant="ghost" onClick={() => setIsGuaranteeDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" form="guarantee-form">Guardar Garantía</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Referencias</CardTitle>
                <CardDescription>Personas que dan fe del cliente.</CardDescription>
            </CardHeader>
            <CardContent>
               {references.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                      <p>No hay referencias que mostrar.</p>
                  </div>
               ) : (
                <ul className="space-y-4">
                  {references.map(ref => (
                    <li key={ref.id} className="p-4 border rounded-lg space-y-2">
                       <p className="font-semibold text-primary">{ref.name}</p>
                       <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4"/> {ref.phone}</p>
                       <p className="text-sm flex items-center gap-2"><Home className="h-4 w-4"/> {ref.address}</p>
                       <p className="text-sm flex items-center gap-2"><User className="h-4 w-4"/> {ref.relationship}</p>
                    </li>
                  ))}
                </ul>
               )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Garantías</CardTitle>
                <CardDescription>Objetos que respaldan los créditos.</CardDescription>
            </CardHeader>
            <CardContent>
                {guarantees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No hay garantías que mostrar.</p>
                    </div>
                ) : (
                  <ul className="space-y-4">
                    {guarantees.map(guarantee => (
                        <li key={guarantee.id} className="p-4 border rounded-lg space-y-2">
                            <p className="font-semibold text-primary">{guarantee.type}</p>
                            <p className="text-sm font-bold text-green-600">Valor: C$ {guarantee.value}</p>
                            <p className="text-sm text-muted-foreground">{guarantee.details}</p>
                        </li>
                    ))}
                  </ul>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
