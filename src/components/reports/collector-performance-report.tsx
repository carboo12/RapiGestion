'use client';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Download, Printer, User, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';

interface User {
    id: string;
    name: string;
    role: string;
}

interface Payment {
    id: string;
    gestorId: string;
    amount: number;
}

interface ReportData {
    collectorName: string;
    totalCollected: number;
    paymentsCount: number;
}

export default function CollectorPerformanceReport() {
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);

                const usersSnapshot = await getDocs(collection(db, 'users'));
                const collectors = usersSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as User))
                    .filter(user => user.role === 'Gestor de Cobros');

                const paymentsSnapshot = await getDocs(collection(db, 'payments'));
                const payments = paymentsSnapshot.docs.map(doc => doc.data() as Payment);

                const performanceData: { [key: string]: { totalCollected: number, paymentsCount: number } } = {};

                payments.forEach(payment => {
                    if (payment.gestorId) {
                        if (!performanceData[payment.gestorId]) {
                            performanceData[payment.gestorId] = { totalCollected: 0, paymentsCount: 0 };
                        }
                        performanceData[payment.gestorId].totalCollected += payment.amount;
                        performanceData[payment.gestorId].paymentsCount++;
                    }
                });

                const data: ReportData[] = collectors.map(collector => ({
                    collectorName: collector.name,
                    totalCollected: performanceData[collector.id]?.totalCollected || 0,
                    paymentsCount: performanceData[collector.id]?.paymentsCount || 0,
                })).sort((a, b) => b.totalCollected - a.totalCollected);

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
                            <TableHead>Gestor</TableHead>
                            <TableHead># Abonos</TableHead>
                            <TableHead className="text-right">Total Recuperado</TableHead>
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
                                        <TableCell className="font-medium">{row.collectorName}</TableCell>
                                        <TableCell>{row.paymentsCount}</TableCell>
                                        <TableCell className="text-right font-mono text-green-600 font-semibold">{formatCurrency(row.totalCollected)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">No se encontraron datos de rendimiento.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}