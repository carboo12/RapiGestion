
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getFirestore, collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActionLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: Timestamp;
  role: string;
}

const getActionBadgeClass = (action: string) => {
  if (action.includes('CREAR')) return 'bg-sky-100 text-sky-800';
  if (action.includes('ACTUALIZAR')) return 'bg-amber-100 text-amber-800';
  if (action.includes('INICIO DE SESIÓN')) return 'bg-slate-100 text-slate-800';
  if (action.includes('CIERRE DE SESIÓN')) return 'bg-slate-100 text-slate-800';
  if (action.includes('APLICAR ABONO')) return 'bg-emerald-100 text-emerald-800';
  return 'bg-gray-100 text-gray-800';
}

export default function ActionsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirestore(app);
    const logsCollection = collection(db, 'action_logs');
    const q = query(logsCollection, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActionLog));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching action logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(timestamp.toDate(), "dd/MM/yyyy, h:mm:ss a", { locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Registro de Acciones</h2>
        <p className="text-muted-foreground">
          Un registro de auditoría de todas las acciones realizadas por los usuarios en el sistema.
        </p>
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Filtrar Acciones</CardTitle>
            <CardDescription>Busca por usuario o filtra por un rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Buscar por correo de usuario..." className="pl-10" />
                </div>
                <div className="flex items-center gap-4">
                    <Input type="date" />
                    <span className="text-muted-foreground">-</span>
                    <Input type="date" />
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de Actividades del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Detalles</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <span>{log.user}</span>
                            <span className="text-xs text-muted-foreground">{log.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionBadgeClass(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.details}</TableCell>
                      <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight"
      >
        <SlidersHorizontal className="h-7 w-7" />
        <span className="text-xs mt-1">Filtrar</span>
      </Button>
    </div>
  )
}
