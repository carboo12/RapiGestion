'use client';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, PiggyBank, Landmark, TrendingUp } from 'lucide-react';
import { Separator } from '../ui/separator';

interface Credit {
    id: string;
    amount: number;
    balance: number;
    totalToPay: number;
    status: 'Activo' | 'Pagado' | 'Vencido';
}

interface FinancialSummary {
    totalInvested: number;
    totalRecovered: number;
    outstandingBalance: number;
    grossProfit: number;
}

export default function FinancialSummaryReport() {
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);
                const creditsSnapshot = await getDocs(collection(db, 'credits'));
                const credits = creditsSnapshot.docs.map(doc => doc.data() as Credit);
                
                const paymentsSnapshot = await getDocs(collection(db, 'payments'));
                const totalRecovered = paymentsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

                let totalInvested = 0;
                let outstandingBalance = 0;
                let profitFromPaid = 0;

                credits.forEach(credit => {
                    totalInvested += credit.amount;
                    if (credit.status !== 'Pagado') {
                        outstandingBalance += credit.balance;
                    } else {
                        const recoveredOnThis = credit.totalToPay;
                        profitFromPaid += (recoveredOnThis - credit.amount);
                    }
                });

                setSummary({
                    totalInvested,
                    totalRecovered,
                    outstandingBalance,
                    grossProfit: profitFromPaid
                });

            } catch (error) {
                console.error("Error generating financial summary:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount: number) => `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div className="p-6 h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!summary) {
        return <div className="p-6 text-center">No se pudieron cargar los datos financieros.</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capital Total Invertido</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalInvested)}</div>
                        <p className="text-xs text-muted-foreground">Suma de todos los montos de créditos otorgados.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Recuperado</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRecovered)}</div>
                        <p className="text-xs text-muted-foreground">Suma de todos los abonos registrados.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Pendiente (en la calle)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{formatCurrency(summary.outstandingBalance)}</div>
                        <p className="text-xs text-muted-foreground">Suma de todos los saldos de créditos activos/vencidos.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilidad Bruta (de créditos cerrados)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-teal-600">{formatCurrency(summary.grossProfit)}</div>
                        <p className="text-xs text-muted-foreground">Suma de (Total Pagado - Monto Prestado) de créditos cancelados.</p>
                    </CardContent>
                </Card>
            </div>
             <Separator />
             <div className="text-center p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold">Valor Actual de la Cartera</h3>
                <p className="text-3xl font-bold text-primary">{formatCurrency(summary.totalRecovered + summary.outstandingBalance)}</p>
                <p className="text-sm text-muted-foreground">(Total Recuperado + Saldo Pendiente)</p>
             </div>
        </div>
    );
}