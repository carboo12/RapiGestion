'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart2 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
            <p className="text-muted-foreground">
                Genera y visualiza reportes personalizados del sistema.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 hover:border-primary hover:bg-accent transition-all">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                        <FileText className="h-8 w-8 text-primary"/>
                    </div>
                    <CardTitle>Reporte de Créditos</CardTitle>
                    <CardDescription>Generar un reporte detallado de todos los créditos.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-amber-600 font-semibold">En Construcción</p>
                 </CardContent>
            </Card>
            <Card className="flex flex-col items-center justify-center text-center p-6 border-dashed border-2 hover:border-primary hover:bg-accent transition-all">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                        <BarChart2 className="h-8 w-8 text-primary"/>
                    </div>
                    <CardTitle>Reporte de Pagos</CardTitle>
                    <CardDescription>Visualiza el historial y estado de todos los pagos.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-sm text-amber-600 font-semibold">En Construcción</p>
                 </CardContent>
            </Card>
        </div>
    </div>
  );
}
