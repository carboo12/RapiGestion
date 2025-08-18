

'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, CreditCard, ShieldCheck, Monitor, UserPlus, Save, X } from 'lucide-react';
import Loading from '@/app/loading';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

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

export default function ClientDetailPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCreditsCount, setActiveCreditsCount] = useState(0);
  const [paidCreditsCount, setPaidCreditsCount] = useState(0);

  const [references, setReferences] = useState<Reference[]>([]);
  const [guarantees, setGuarantees] = useState<Guarantee[]>([]);

  const [isRefDialogOpen, setIsRefDialogOpen] = useState(false);
  const [isGuaranteeDialogOpen, setIsGuaranteeDialogOpen] = useState(false);
  
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [isEditRefDialogOpen, setIsEditRefDialogOpen] = useState(false);


  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  useEffect(() => {
    if (id) {
      const db = getFirestore(app);

      const fetchClientData = async () => {
        setLoading(true);
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
      
      const referencesQuery = query(collection(db, "references"), where("clientId", "==", id));
      const unsubscribeReferences = onSnapshot(referencesQuery, (snapshot) => {
          const refsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reference));
          setReferences(refsList);
      });

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

  const handleEditReferenceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingReference) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
        name: formData.get('ref-name') as string,
        phone: formData.get('ref-phone') as string,
        address: formData.get('ref-address') as string,
        relationship: formData.get('ref-relationship') as string,
    };

    try {
        const db = getFirestore(app);
        const refDoc = doc(db, 'references', editingReference.id);
        await setDoc(refDoc, updatedData, { merge: true });
        toast({ title: "Éxito", description: "Referencia actualizada correctamente." });
        setIsEditRefDialogOpen(false);
        setEditingReference(null);
    } catch (error) {
        console.error("Error updating reference:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la referencia.' });
    }
  };

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

  const handleNewCredit = () => {
    if (references.length === 0) {
      toast({ variant: 'destructive', title: 'Validación Fallida', description: 'El cliente debe tener al menos una referencia.' });
      return;
    }
    if (guarantees.length === 0) {
      toast({ variant: 'destructive', title: 'Validación Fallida', description: 'El cliente debe tener al menos una garantía.' });
      return;
    }
    
    const clientForCredit = {
        id: client?.id,
        name: fullName,
        hasGuarantees: guarantees.length > 0,
        hasReferences: references.length > 0,
    };
    localStorage.setItem('clientForCredit', JSON.stringify(clientForCredit));
    router.push('/credits');
  }

  const handleOpenEditReferenceDialog = (ref: Reference) => {
    setEditingReference(ref);
    setIsEditRefDialogOpen(true);
  };
  
  if (loading) return <Loading />;
  
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
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
    <div className="flex flex-col h-full -m-4 md:-m-8">
      <div className="flex flex-col flex-1 bg-gray-50 md:p-0">
        <header className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-6 w-6 text-green-600" />
          </Button>
          <h1 className="text-lg font-bold text-green-600">Detalle de Cliente</h1>
          <span className="text-xs text-muted-foreground w-10">v 10.1.1</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          <Card className="rounded-2xl border-2 border-green-500 shadow-lg">
              <CardContent className="p-4 space-y-3">
                  <div className='text-center'>
                      <span className="text-sm text-gray-500">Cliente:</span>
                      <p className="font-bold text-blue-600">{fullName}</p>
                  </div>
                  <div className="flex justify-around text-center">
                      <div>
                          <p className="font-bold text-green-600">{activeCreditsCount}</p>
                          <p className="text-sm text-gray-500">Créditos Activos</p>
                      </div>
                      <div>
                          <p className="font-bold text-yellow-600">{paidCreditsCount}</p>
                          <p className="text-sm text-gray-500">Ciclos</p>
                      </div>
                  </div>
                  <div className="space-y-2 pt-2">
                      <Dialog open={isGuaranteeDialogOpen} onOpenChange={setIsGuaranteeDialogOpen}>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="w-full rounded-full border-green-500 border-2 text-green-600 h-12">
                                  <ShieldCheck className="mr-2 h-5 w-5"/>
                                  Agregar Garantía
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
                                      <Input id="guarantee-type" name="guarantee-type" placeholder="Ej: Televisor, Motocicleta" required />
                                  </div>
                                  <div>
                                      <Label htmlFor="guarantee-value">Valor Estimado (C$)</Label>
                                      <Input id="guarantee-value" name="guarantee-value" type="number" required />
                                  </div>
                                  <div>
                                      <Label htmlFor="guarantee-details">Detalles u Observaciones</Label>
                                      <Textarea id="guarantee-details" name="guarantee-details" placeholder="Ej: TV Samsung 42 pulgadas, Modelo X" required />
                                  </div>
                              </form>
                              <DialogFooter>
                                  <Button variant="ghost" onClick={() => setIsGuaranteeDialogOpen(false)}>Cancelar</Button>
                                  <Button type="submit" form="guarantee-form">Guardar Garantía</Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>
                      <Button onClick={handleNewCredit} className="w-full rounded-full border-green-500 border-2 bg-green-500 hover:bg-green-600 h-12">
                          <CreditCard className="mr-2 h-5 w-5"/>
                          Agregar Crédito
                      </Button>
                  </div>
              </CardContent>
          </Card>

          <h3 className="text-center font-bold text-blue-600">Lista de Referencias</h3>

          <Card className="rounded-2xl border-2 border-green-500">
              <CardContent className="p-4">
                  {references.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                          <Image src="https://placehold.co/128x128.png" data-ai-hint="empty state illustration" alt="No hay nada que mostrar" width={128} height={128} />
                          <p className="mt-4 font-semibold">No hay nada que mostrar</p>
                      </div>
                  ) : (
                      <ul className="space-y-3">
                          {references.map(ref => (
                              <li key={ref.id}>
                                  <button onClick={() => handleOpenEditReferenceDialog(ref)} className="w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition-colors">
                                      <p className="font-semibold text-primary">{ref.name}</p>
                                      <p className="text-sm text-muted-foreground">{ref.phone}</p>
                                      <p className="text-sm text-muted-foreground">{ref.address}</p>
                                      <p className="text-sm text-muted-foreground">Parentesco: {ref.relationship}</p>
                                  </button>
                              </li>
                          ))}
                      </ul>
                  )}
              </CardContent>
          </Card>
        </main>
      </div>

       <Dialog open={isRefDialogOpen} onOpenChange={setIsRefDialogOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight">
              <UserPlus className="h-7 w-7" />
              <span className="text-xs mt-1">Referencia</span>
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
        
        <Dialog open={isEditRefDialogOpen} onOpenChange={setIsEditRefDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Referencia</DialogTitle>
                    <DialogClose asChild>
                      <Button variant="ghost" size="icon" className="absolute top-4 right-4">
                          <X className="h-4 w-4" />
                      </Button>
                    </DialogClose>
                </DialogHeader>
                 <form id="edit-ref-form" onSubmit={handleEditReferenceSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="ref-name">Nombre Completo</Label>
                        <Input id="ref-name" name="ref-name" required defaultValue={editingReference?.name} />
                    </div>
                    <div>
                        <Label htmlFor="ref-phone">Teléfono</Label>
                        <Input id="ref-phone" name="ref-phone" required defaultValue={editingReference?.phone} />
                    </div>
                    <div>
                        <Label htmlFor="ref-address">Dirección</Label>
                        <Input id="ref-address" name="ref-address" required defaultValue={editingReference?.address} />
                    </div>
                    <div>
                        <Label htmlFor="ref-relationship">Parentesco</Label>
                        <Input id="ref-relationship" name="ref-relationship" required defaultValue={editingReference?.relationship} />
                    </div>
                 </form>
                 <Button type="submit" form="edit-ref-form" className="fixed bottom-4 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white">
                    <Save className="h-7 w-7" />
                 </Button>
            </DialogContent>
        </Dialog>

    </div>
  );
}
