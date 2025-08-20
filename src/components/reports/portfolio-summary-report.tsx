'use client';
import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PieChart, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Pie, Cell, ResponsiveContainer, PieProps, Tooltip } from 'recharts';

interface Credit {
    id: string;
    balance: number;
    status: 'Activo' | 'Pagado' | 'Vencido';
    firstPaymentDate: Timestamp;
}

interface PortfolioData {
    name: 'Activo' | 'Pagado' | 'Vencido' | 'Atrasado';
    value: number; // Count of credits
    amount: number; // Sum of balances
    color: string;
    icon: React.ElementType;
}

export default function PortfolioSummaryReport() {
    const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const db = getFirestore(app);
                const creditsSnapshot = await getDocs(collection(db, 'credits'));
                const credits = creditsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Credit));

                const summary = {
                    active: { count: 0, amount: 0 },
                    overdue: { count: 0, amount: 0 },
                    paid: { count: 0, amount: 0 },
                };

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                credits.forEach(credit => {
                    if (credit.status === 'Pagado') {
                        summary.paid.count++;
                    } else {
                        const isOverdue = credit.firstPaymentDate && credit.firstPaymentDate.toDate() < today;
                        if (credit.status === 'Vencido' || isOverdue) {
                            summary.overdue.count++;
                            summary.overdue.amount += credit.balance;
                        } else {
                            summary.active.count++;
                            summary.active.amount += credit.balance;
                        }
                    }
                });

                const data: PortfolioData[] = [
                    { name: 'Activo', value: summary.active.count, amount: summary.active.amount, color: '#3b82f6', icon: Clock },
                    { name: 'Atrasado', value: summary.overdue.count, amount: summary.overdue.amount, color: '#f59e0b', icon: AlertCircle },
                    { name: 'Pagado', value: summary.paid.count, amount: 0, color: '#22c55e', icon: CheckCircle },
                ];
                
                setPortfolioData(data);
            } catch (error) {
                console.error("Error generating portfolio summary:", error);
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

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {portfolioData.map(item => (
                    <Card key={item.name} className="flex flex-col items-center justify-center p-4 text-center">
                         <item.icon className="w-8 h-8 mb-2" style={{ color: item.color }}/>
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-sm font-medium" style={{ color: item.color }}>{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.name !== 'Pagado' ? formatCurrency(item.amount) : '-'}</p>
                    </Card>
                ))}
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Distribución de la Cartera por # de Créditos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={portfolioData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {portfolioData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} créditos`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}