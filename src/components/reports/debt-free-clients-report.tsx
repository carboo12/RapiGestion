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
    cedula: string;
}

interface ReportData {
    clientName: string;
    phone: string;
    cedula: string;
}

export default function DebtFreeClientsReport() {
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);

                // 1. Get all clients
                const clientsSnapshot = await getDocs(collection(db, 'clients'));
                const allClients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));

                // 2. Get all clients who have active credits
                const activeCreditsQuery = query(collection(db, 'credits'), where('balance', '>', 0));
                const activeCreditsSnapshot = await getDocs(activeCreditsQuery);
                const clientsWithActiveCredits = new Set(activeCreditsSnapshot.docs.map(doc => doc.data().clientId));

                // 3. Filter clients to find those who are debt-free
                const debtFreeClients = allClients.filter(client => !clientsWithActiveCredits.has(client.id));

                const data: ReportData[] = debtFreeClients.map(client => ({
                    clientName: `${client.primerNombre} ${client.apellido}`.trim(),
                    phone: client.phone,
                    cedula: client.cedula,
                })).sort((a,b) => a.clientName.localeCompare(b.clientName));

                setReportData(data);
            } catch (error) {
                console.error("Error generating report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                            <TableHead>Cédula</TableHead>
                            <TableHead>Teléfono</TableHead>
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
                                        <TableCell>{row.cedula}</TableCell>
                                        <TableCell>{row.phone}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No se encontraron clientes sin deudas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
                 <div className="flex-none p-4 border-t bg-muted/50">
                    <div className="flex justify-end items-center">
                        <span className="font-bold text-lg">Total de Clientes: {reportData.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
