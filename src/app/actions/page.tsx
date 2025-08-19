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
import { Search, SlidersHorizontal } from "lucide-react";

const actionLogs = [
  { id: 1, user: 'admin@rapigestion.com', action: 'INICIO_SESION', details: 'El usuario inició sesión exitosamente.', timestamp: '2024-07-29 10:00:15', role: 'Administrador' },
  { id: 2, user: 'carlos.r@rapigestion.com', action: 'CREAR_CLIENTE', details: 'Cliente "Alice Johnson" (CUST-001) creado.', timestamp: '2024-07-29 10:05:22', role: 'Gestor de Cobros' },
  { id: 3, user: 'admin@rapigestion.com', action: 'CREAR_USUARIO', details: 'Usuario "john.d@rapigestion.com" creado con rol "Usuario de Desembolsos".', timestamp: '2024-07-29 10:15:03', role: 'Administrador' },
  { id: 4, user: 'carlos.r@rapigestion.com', action: 'REGISTRAR_PAGO', details: 'Pago de C$ 500 registrado para crédito CR-002.', timestamp: '2024-07-29 10:20:45', role: 'Gestor de Cobros' },
  { id: 5, user: 'maria.s@rapigestion.com', action: 'ACTUALIZAR_CLIENTE', details: 'Dirección actualizada para cliente "Robert Brown" (CUST-002).', timestamp: '2024-07-29 10:30:11', role: 'Gestor de Cobros' },
  { id: 6, user: 'john.d@rapigestion.com', action: 'CREAR_CREDITO', details: 'Nuevo crédito (CR-006) por C$15,000 creado para cliente "Nuevo Cliente".', timestamp: '2024-07-29 11:00:59', role: 'Usuario de Desembolsos' },
  { id: 7, user: 'admin@rapigestion.com', action: 'CERRAR_SESION', details: 'El usuario cerró sesión.', timestamp: '2024-07-29 11:05:00', role: 'Administrador' },
];

const getActionBadgeVariant = (action: string) => {
  if (action.includes('CREAR')) return 'default';
  if (action.includes('ACTUALIZAR')) return 'secondary';
  if (action.includes('INICIO') || action.includes('CERRAR')) return 'outline';
  if (action.includes('PAGO')) return 'default';
  return 'secondary';
};

const getActionBadgeClass = (action: string) => {
  if (action.includes('CREAR')) return 'bg-sky-100 text-sky-800';
  if (action.includes('ACTUALIZAR')) return 'bg-amber-100 text-amber-800';
  if (action.includes('INICIO') || action.includes('CERRAR')) return 'bg-slate-100 text-slate-800';
  if (action.includes('PAGO')) return 'bg-emerald-100 text-emerald-800';
  return 'bg-gray-100 text-gray-800';
}

export default function ActionsPage() {
  return (
    <div className="space-y-6">
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
                <Button>
                    <SlidersHorizontal className="mr-2 h-4 w-4"/>
                    Aplicar Filtros
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de Actividades del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
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
              {actionLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{log.user}</span>
                        <span className="text-xs text-muted-foreground">{log.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)} className={getActionBadgeClass(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
