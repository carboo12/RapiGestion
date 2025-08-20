'use client';
import { useEffect, useMemo, useState } from 'react';
import { getFirestore, collection, query, onSnapshot, Timestamp, doc, getDoc, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Printer, Search, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

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

export default function PaymentsHistoryReport() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientMap, setClientMap] = useState<Map<string, Client>>(new Map());
    const [filters, setFilters] = useState({
      clientName: '',
      startDate: '',
      endDate: '',
    });

    const { toast } = useToast();

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

        const paymentsQuery = query(collection(db, 'payments'));
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
    }, [toast]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const formatCurrency = (amount: number) => `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const formatTimestamp = (timestamp: Timestamp) => {
        if (!timestamp) return 'N/A';
        try {
          return format(timestamp.toDate(), "dd/MM/yyyy, h:mm:ss a", { locale: es });
        } catch (e) {
          return 'Fecha inválida';
        }
    }

    const filteredPayments = useMemo(() => {
        let result = payments.map(p => ({ ...p, clientName: clientMap.get(p.clientId) ? `${clientMap.get(p.clientId)?.primerNombre} ${clientMap.get(p.clientId)?.apellido}`.trim() : 'Cliente Desconocido' }));

        if (filters.clientName) {
            result = result.filter(p => p.clientName?.toLowerCase().includes(filters.clientName.toLowerCase()));
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

        return result.sort((a, b) => b.paymentDate.toDate().getTime() - a.paymentDate.toDate().getTime());
    }, [payments, clientMap, filters]);
    
    const totalRecovered = useMemo(() => {
      return filteredPayments.reduce((acc, payment) => acc + payment.amount, 0);
    }, [filteredPayments]);

    return (
        <div className="p-6 h-full flex flex-col space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
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
            
            <div className="border rounded-lg flex-1 flex flex-col">
                <div className="flex-none p-4 border-b flex justify-between items-center bg-muted/50">
                   <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                        <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> PDF</Button>
                        <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> Excel</Button>
                    </div>
                    <div className="text-sm font-semibold">
                        Total Recuperado: <span className="text-green-600">{formatCurrency(totalRecovered)}</span>
                    </div>
                </div>
                 <div className="flex-none">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Fecha de Pago</TableHead>
                            <TableHead>Gestor</TableHead>
                            <TableHead>Recibo</TableHead>
                        </TableRow>
                    </TableHeader>
                </div>
                <ScrollArea className="flex-grow">
                    <Table>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredPayments.length > 0 ? (
                                filteredPayments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">{payment.clientName}</TableCell>
                                        <TableCell className="font-mono text-green-600 font-semibold">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell>{formatTimestamp(payment.paymentDate)}</TableCell>
                                        <TableCell>{payment.gestorName || 'No disponible'}</TableCell>
                                        <TableCell>
                                            <Button asChild variant="ghost" size="icon">
                                                <Link href={`/payments/${payment.id}`} target="_blank">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">No se encontraron pagos con los filtros seleccionados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}
