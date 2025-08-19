'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapIcon, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Credit {
  id: string;
  clientName: string;
  clientId: string;
  clientAddress: string; // Assuming client has an address property
  amountToPay: number; // Assuming this is the installment amount
}

export default function AssignRoutePage() {
  const [collectors, setCollectors] = useState<User[]>([]);
  const [pendingCredits, setPendingCredits] = useState<Credit[]>([]);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);
  const [selectedCollector, setSelectedCollector] = useState<string>('');
  const [routeDate, setRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const db = getFirestore(app);
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch collectors
        const usersRef = collection(db, "users");
        const qCollectors = query(usersRef, where("role", "==", "Gestor de Cobros"));
        const collectorSnapshot = await getDocs(qCollectors);
        const collectorList = collectorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setCollectors(collectorList);

        // Fetch pending credits and associated clients
        const creditsRef = collection(db, 'credits');
        const qCredits = query(creditsRef, where("status", "in", ["Activo", "Vencido"]));
        const creditSnapshot = await getDocs(qCredits);

        const clientsRef = collection(db, 'clients');
        const clientSnapshot = await getDocs(clientsRef);
        const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const creditList = creditSnapshot.docs.map(doc => {
            const data = doc.data();
            const client = clientList.find(c => c.id === data.clientId);
            return {
                id: doc.id,
                clientName: client ? `${client.primerNombre} ${client.apellido}`.trim() : 'Cliente Desconocido',
                clientId: data.clientId,
                clientAddress: client ? client.direccion : 'Dirección no disponible',
                amountToPay: data.balance,
            } as Credit;
        });
        
        setPendingCredits(creditList);
      } catch (error) {
        console.error("Error fetching data for route assignment:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos necesarios.' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCredits(pendingCredits.map(c => c.id));
    } else {
      setSelectedCredits([]);
    }
  };
  
  const handleSelectCredit = (creditId: string, checked: boolean) => {
    if (checked) {
      setSelectedCredits(prev => [...prev, creditId]);
    } else {
      setSelectedCredits(prev => prev.filter(id => id !== creditId));
    }
  };

  const handleSaveRoute = async () => {
    if (!selectedCollector) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un gestor de cobros.' });
      return;
    }
    if (selectedCredits.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar al menos un crédito para la ruta.' });
      return;
    }
    setSaving(true);
    const db = getFirestore(app);
    try {
      // 1. Save the route
      const routeRef = await addDoc(collection(db, 'routes'), {
        collectorId: selectedCollector,
        date: Timestamp.fromDate(new Date(routeDate)),
        creditIds: selectedCredits,
        status: 'Pendiente',
        createdAt: serverTimestamp()
      });

      // 2. Create notification for the collector
      await addDoc(collection(db, `users/${selectedCollector}/notifications`), {
        title: 'Nueva Ruta Asignada',
        description: `Se te ha asignado una nueva ruta para el ${routeDate}.`,
        link: `/routes`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: 'Éxito', description: 'La ruta ha sido asignada y el gestor notificado.' });
      router.push('/routes');

    } catch (error) {
      console.error("Error saving route:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la ruta.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/routes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Asignar Ruta de Cobro</h2>
            <p className="text-muted-foreground">
                Selecciona un gestor, una fecha y los créditos a cobrar.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Ruta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="collector">Gestor de Cobros</Label>
            <Select onValueChange={setSelectedCollector} value={selectedCollector}>
              <SelectTrigger id="collector">
                <SelectValue placeholder="Seleccionar un gestor..." />
              </SelectTrigger>
              <SelectContent>
                {collectors.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-date">Fecha de la Ruta</Label>
            <Input id="route-date" type="date" value={routeDate} onChange={(e) => setRouteDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Mapa</CardTitle>
                <CardDescription>Vista previa de la ruta.</CardDescription>
            </CardHeader>
            <CardContent className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <MapIcon className="w-16 h-16 text-muted-foreground" />
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Créditos Pendientes</CardTitle>
            <CardDescription>Selecciona los clientes que formarán parte de esta ruta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox 
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                          checked={selectedCredits.length === pendingCredits.length && pendingCredits.length > 0}
                        />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingCredits.map((credit) => (
                    <TableRow key={credit.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCredits.includes(credit.id)}
                            onCheckedChange={(checked) => handleSelectCredit(credit.id, checked as boolean)}
                            id={`credit-${credit.id}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{credit.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">{credit.clientAddress}</TableCell>
                        <TableCell className="text-right">C$ {(credit.amountToPay || 0).toFixed(2)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSaveRoute}
        disabled={saving}
        className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight"
      >
        {saving ? <Loader2 className="h-7 w-7 animate-spin" /> : <Save className="h-7 w-7" />}
        <span className="text-xs mt-1">Guardar</span>
      </Button>

    </div>
  );
}
