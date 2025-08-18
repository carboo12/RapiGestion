
'use client';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, MoreHorizontal, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, serverTimestamp, query, where, Timestamp } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Client {
  id: string;
  name: string;
  hasGuarantees: boolean;
  hasReferences: boolean;
}

type PaymentFrequency = 'diario' | 'semanal' | 'quincenal' | 'mensual';

interface Credit {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: 'C$' | 'USD';
  interestRate: number;
  term: number; // Plazo en meses
  paymentFrequency: PaymentFrequency;
  numberOfInstallments: number; // Número de cuotas
  disbursementDate: Timestamp;
  firstPaymentDate: Timestamp;
  status: 'Activo' | 'Pendiente' | 'Pagado' | 'Vencido';
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Activo': return 'default';
    case 'Vencido': return 'destructive';
    case 'Pendiente': return 'secondary';
    case 'Pagado': return 'outline';
    default: return 'default';
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Activo': return 'bg-blue-100 text-blue-800';
    case 'Vencido': return 'bg-red-100 text-red-800';
    case 'Pagado': return 'bg-green-100 text-green-800';
    case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
    default: return '';
  }
}

const CreditTable = ({ credits, statusFilter }: { credits: Credit[], statusFilter?: string }) => {
  const filteredCredits = statusFilter ? credits.filter(c => c.status === statusFilter) : credits;

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), "P", { locale: es });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID de Crédito</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Interés</TableHead>
              <TableHead>Nº Cuotas</TableHead>
              <TableHead>Desembolso</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredits.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                        No hay créditos en esta categoría.
                    </TableCell>
                </TableRow>
            ) : filteredCredits.map((credit) => (
              <TableRow key={credit.id}>
                <TableCell className="font-medium">{credit.id.substring(0,8).toUpperCase()}</TableCell>
                <TableCell>{credit.clientName}</TableCell>
                <TableCell>{`${credit.currency} ${credit.amount.toLocaleString()}`}</TableCell>
                <TableCell>{credit.interestRate}%</TableCell>
                <TableCell>{credit.numberOfInstallments}</TableCell>
                <TableCell>{formatDate(credit.disbursementDate)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(credit.status)} className={getStatusClass(credit.status)}>
                    {credit.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                      <DropdownMenuItem>Registrar Pago</DropdownMenuItem>
                      <DropdownMenuItem>Imprimir Recibo de Pago</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openNewCredit, setOpenNewCredit] = useState(false);
  
  // Form states
  const [disbursementDate, setDisbursementDate] = useState('');
  const [firstPaymentDate, setFirstPaymentDate] = useState('');
  const [term, setTerm] = useState(0);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('mensual');
  const [numberOfInstallments, setNumberOfInstallments] = useState(0);

  const { toast } = useToast();

  const fetchCredits = async () => {
    const db = getFirestore(app);
    try {
      // Fetch clients to map names
      const clientsCol = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCol);
      const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch credits
      const creditsCol = collection(db, 'credits');
      const creditSnapshot = await getDocs(creditsCol);
      const creditList = creditSnapshot.docs.map(doc => {
          const data = doc.data();
          const client = clientList.find(c => c.id === data.clientId);
          return {
              id: doc.id,
              ...data,
              clientName: client ? `${client.primerNombre} ${client.apellido}` : 'Cliente Desconocido',
          } as Credit;
      });
      setCredits(creditList);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos.",
      });
    }
  };

  useEffect(() => {
    fetchCredits();

    const clientForCreditJSON = localStorage.getItem('clientForCredit');
    if (clientForCreditJSON) {
        const clientData = JSON.parse(clientForCreditJSON);
        setSelectedClient(clientData);
        setOpenNewCredit(true);
        localStorage.removeItem('clientForCredit');
    }
  }, []);

  useEffect(() => {
    if (term > 0) {
      switch (paymentFrequency) {
        case 'mensual':
          setNumberOfInstallments(term);
          break;
        case 'quincenal':
          setNumberOfInstallments(term * 2);
          break;
        case 'semanal':
          setNumberOfInstallments(term * 4);
          break;
        case 'diario':
          setNumberOfInstallments(term * 30);
          break;
        default:
          setNumberOfInstallments(0);
      }
    } else {
      setNumberOfInstallments(0);
    }
  }, [term, paymentFrequency]);


  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset states when dialog closes
      setSelectedClient(null);
      setDisbursementDate('');
      setFirstPaymentDate('');
      setTerm(0);
      setPaymentFrequency('mensual');
    }
    setOpenNewCredit(open);
  }
  
  const handleNewCreditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!selectedClient || !disbursementDate || !firstPaymentDate || term <= 0) {
        toast({
            variant: "destructive",
            title: "Error de validación",
            description: "Por favor, complete todos los campos requeridos.",
        });
        return;
    }

    const formData = new FormData(form);
    const newCreditData = {
        clientId: selectedClient.id,
        amount: parseFloat(formData.get('amount') as string),
        currency: formData.get('currency') as 'C$' | 'USD',
        interestRate: parseFloat(formData.get('interest-rate') as string),
        term: term,
        paymentFrequency: paymentFrequency,
        numberOfInstallments: numberOfInstallments,
        disbursementDate: Timestamp.fromDate(new Date(disbursementDate)),
        firstPaymentDate: Timestamp.fromDate(new Date(firstPaymentDate)),
        status: 'Activo',
        createdAt: serverTimestamp()
    };

    try {
        const db = getFirestore(app);
        await addDoc(collection(db, "credits"), newCreditData);

        toast({
            title: "Éxito",
            description: "Nuevo crédito agregado correctamente.",
        });
        
        handleDialogClose(false);
        form.reset();
        fetchCredits();
    } catch (error) {
        console.error("Error creating credit:", error);
        toast({
            variant: 'destructive',
            title: 'Error al crear crédito',
            description: 'No se pudo guardar el crédito en la base de datos.'
        });
    }
  }

  const interestRateOptions = () => {
    const options: number[] = [];
    for (let i = 1; i <= 10; i++) {
        options.push(i);
    }
    options.push(10.44);
    options.push(10.5);

    for (let i = 11; i <= 40; i += 0.5) {
        options.push(i);
    }
    return options.sort((a,b) => a-b);
  };

  return (
    <Dialog open={openNewCredit} onOpenChange={handleDialogClose}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-center sm:text-left">Créditos</h2>
            <Button className="w-full sm:w-auto" onClick={() => toast({ title: "Acción no disponible", description: "Por favor, selecciona un cliente desde la página de Clientes para otorgar un crédito."})}>
              <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Crédito
            </Button>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="paid">Pagados</TabsTrigger>
            <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <CreditTable credits={credits} statusFilter="Activo" />
          </TabsContent>
          <TabsContent value="paid">
            <CreditTable credits={credits} statusFilter="Pagado" />
          </TabsContent>
          <TabsContent value="overdue">
            <CreditTable credits={credits} statusFilter="Vencido" />
          </TabsContent>
        </Tabs>
      </div>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Otorgar Nuevo Crédito</DialogTitle>
          <DialogDescription>
            {selectedClient ? `Rellena los detalles del crédito para ${selectedClient.name}.` : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto no-scrollbar -mx-6 px-6">
          {selectedClient && (
              <form id="new-credit-form" onSubmit={handleNewCreditSubmit} className="space-y-4 py-4">
                  <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Cliente Elegido: {selectedClient.name}</AlertTitle>
                      <AlertDescription>
                          El cliente cumple con los requisitos de garantías y referencias.
                      </AlertDescription>
                  </Alert>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label htmlFor="amount">Monto del Crédito</Label>
                         <Input id="amount" name="amount" type="number" required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="currency">Moneda</Label>
                          <Select name="currency" defaultValue="C$">
                             <SelectTrigger id="currency">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="C$">Córdoba (C$)</SelectItem>
                               <SelectItem value="USD">Dólar (USD)</SelectItem>
                             </SelectContent>
                          </Select>
                      </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label htmlFor="interest-rate">Tasa de Interés (%)</Label>
                         <Select name="interest-rate" required>
                           <SelectTrigger id="interest-rate">
                             <SelectValue placeholder="Selecciona una tasa..." />
                           </SelectTrigger>
                           <SelectContent>
                             {interestRateOptions().map(rate => (
                               <SelectItem key={rate} value={String(rate)}>
                                 {rate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="term">Plazo (Meses)</Label>
                          <Input id="term" name="term" type="number" required onChange={(e) => setTerm(parseInt(e.target.value, 10) || 0)}/>
                      </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label htmlFor="payment-frequency">Frecuencia de Pago</Label>
                         <Select name="payment-frequency" value={paymentFrequency} onValueChange={(value) => setPaymentFrequency(value as PaymentFrequency)}>
                            <SelectTrigger id="payment-frequency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="diario">Diario</SelectItem>
                              <SelectItem value="semanal">Semanal</SelectItem>
                              <SelectItem value="quincenal">Quincenal</SelectItem>
                              <SelectItem value="mensual">Mensual</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                       <div className="space-y-2">
                          <Label htmlFor="installments">Número de Cuotas</Label>
                          <Input id="installments" name="installments" type="number" value={numberOfInstallments} readOnly className="bg-gray-100" />
                      </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <Label>Fecha de Desembolso</Label>
                         <Input
                           type="date"
                           value={disbursementDate}
                           onChange={(e) => setDisbursementDate(e.target.value)}
                           required
                         />
                      </div>
                      <div className="space-y-2">
                          <Label>Fecha de Primer Pago</Label>
                          <Input
                           type="date"
                           value={firstPaymentDate}
                           onChange={(e) => setFirstPaymentDate(e.target.value)}
                           required
                         />
                      </div>
                  </div>
              </form>
          )}
        </div>
         <DialogFooter className="mt-4">
              <Button type="button" variant="ghost" onClick={() => handleDialogClose(false)}>Cancelar</Button>
              {selectedClient && (
                  <Button type="submit" form="new-credit-form">Guardar Crédito</Button>
              )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
