'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FileClock, UserCheck, UserX, LineChart, Users, BarChartHorizontal, PieChart, ListChecks } from "lucide-react";
import { ListFilter } from "lucide-react";

import PendingPaymentsReport from '@/components/reports/pending-payments-report';
import OverdueClientsReport from '@/components/reports/overdue-clients-report';
import DebtFreeClientsReport from '@/components/reports/debt-free-clients-report';
import FinancialSummaryReport from '@/components/reports/financial-summary-report';
import CollectorPerformanceReport from '@/components/reports/collector-performance-report';
import PortfolioSummaryReport from '@/components/reports/portfolio-summary-report';
import PaymentsHistoryReport from '@/components/reports/payments-history-report';

type ReportType = 'pending' | 'overdue' | 'debt-free' | 'financial' | 'collector' | 'portfolio' | 'payments-history';

interface Report {
    id: ReportType;
    title: string;
    description: string;
    icon: React.ElementType;
    component: React.ElementType | null;
    status: 'active' | 'construction';
}

const reports: Report[] = [
    { id: 'pending', title: 'Clientes Pendientes', description: 'Listado de clientes con saldo por pagar.', icon: FileClock, component: PendingPaymentsReport, status: 'active' },
    { id: 'overdue', title: 'Clientes en Mora', description: 'Listado de clientes con créditos vencidos.', icon: UserX, component: OverdueClientsReport, status: 'active' },
    { id: 'debt-free', title: 'Clientes Cancelados', description: 'Listado de clientes sin deudas activas.', icon: UserCheck, component: DebtFreeClientsReport, status: 'active' },
    { id: 'financial', title: 'Resumen Financiero', description: 'Inversión, recuperación y saldos pendientes.', icon: LineChart, component: FinancialSummaryReport, status: 'active' },
    { id: 'collector', title: 'Rendimiento de Gestores', description: 'Análisis de efectividad de los gestores.', icon: BarChartHorizontal, component: CollectorPerformanceReport, status: 'active' },
    { id: 'portfolio', title: 'Resumen de Cartera', description: 'Distribución de créditos por estado.', icon: PieChart, component: PortfolioSummaryReport, status: 'active' },
    { id: 'payments-history', title: 'Historial de Pagos', description: 'Registro de todos los pagos realizados.', icon: ListChecks, component: PaymentsHistoryReport, status: 'active' }
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleGenerateReport = (report: Report) => {
        if (report.status === 'active') {
            setSelectedReport(report);
            setIsSheetOpen(true);
        }
    };
    
    const ReportComponent = selectedReport?.component;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
                <p className="text-muted-foreground">
                    Genera y visualiza reportes personalizados del sistema.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <Card key={report.id} className="flex flex-col">
                        <CardHeader className="flex-grow">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col">
                                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-4">
                                        <report.icon className="h-8 w-8 text-primary"/>
                                    </div>
                                    <CardTitle>{report.title}</CardTitle>
                                    <CardDescription>{report.description}</CardDescription>
                                </div>
                                {report.status === 'construction' && (
                                     <span className="text-xs font-semibold text-amber-100 bg-amber-600 px-2 py-1 rounded-full">Pronto</span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                             <Button 
                                className="w-full" 
                                onClick={() => handleGenerateReport(report)}
                                disabled={report.status === 'construction'}
                            >
                                Generar Reporte
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-full sm:w-3/4 md:w-2/3 lg:max-w-screen-lg p-0">
                    {ReportComponent && (
                        <div className="h-full flex flex-col">
                            <SheetHeader className="p-6 border-b">
                                <SheetTitle>{selectedReport?.title}</SheetTitle>
                                <SheetDescription>{selectedReport?.description}</SheetDescription>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto">
                                <ReportComponent />
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
