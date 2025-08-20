'use client';
import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Printer } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface Client {
    id: string;
    primerNombre: string;
    apellido: string;
    phone: string;
}

interface Credit {
    id: string;
    clientId: string;
    balance: number;
}

interface ReportData {
    clientName: string;
    phone: string;
    balance: number;
}

export default function PendingPaymentsReport() {
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);
                
                const creditsQuery = query(collection(db, 'credits'), where('balance', '>', 0));
                const creditsSnapshot = await getDocs(creditsQuery);
                const credits = creditsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Credit));

                if (credits.length === 0) {
                    setReportData([]);
                    setLoading(false);
                    return;
                }

                const clientIds = [...new Set(credits.map(c => c.clientId))];
                const clientsRef = collection(db, 'clients');
                
                // Firestore 'in' query has a limit of 30 items. We need to chunk it.
                const clientPromises = [];
                for (let i = 0; i < clientIds.length; i += 30) {
                    const chunk = clientIds.slice(i, i + 30);
                    const q = query(clientsRef, where('__name__', 'in', chunk));
                    clientPromises.push(getDocs(q));
                }
                
                const clientSnapshots = await Promise.all(clientPromises);
                const clientMap = new Map<string, Client>();
                clientSnapshots.forEach(snapshot => {
                    snapshot.forEach(doc => {
                        clientMap.set(doc.id, { id: doc.id, ...doc.data() } as Client);
                    });
                });

                const data: ReportData[] = credits.map(credit => {
                    const client = clientMap.get(credit.clientId);
                    return {
                        clientName: client ? `${client.primerNombre} ${client.apellido}`.trim() : 'Desconocido',
                        phone: client?.phone || 'N/A',
                        balance: credit.balance,
                    };
                }).sort((a, b) => b.balance - a.balance);

                setReportData(data);
            } catch (error) {
                console.error("Error generating report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number) => `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const totalPending = reportData.reduce((sum, row) => sum + row.balance, 0);

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-end gap-2 mb-4">
                <Button variant="outline" size="sm" disabled><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> PDF</Button>
                <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" /> Excel</Button>
            </div>
            <div className="border rounded-lg flex-1 flex flex-col">
                <div className="flex-none">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">Saldo Pendiente</TableHead>
                        </TableRow>
                    </TableHeader>
                </div>
                 <ScrollArea className="flex-grow">
                    <Table>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : reportData.length > 0 ? (
                                reportData.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{row.clientName}</TableCell>
                                        <TableCell>{row.phone}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(row.balance)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No hay clientes con pagos pendientes.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <div className="flex-none p-4 border-t bg-muted/50">
                    <div className="flex justify-end items-center">
                        <span className="font-bold text-lg">Total Pendiente: {formatCurrency(totalPending)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
