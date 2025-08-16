import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const users = [
  { name: 'Usuario Administrador', email: 'admin@rapigestion.com', role: 'Administrador' },
  { name: 'Carlos Rodriguez', email: 'carlos.r@rapigestion.com', role: 'Gestor de Cobros' },
  { name: 'Maria Sanchez', email: 'maria.s@rapigestion.com', role: 'Gestor de Cobros' },
  { name: 'John Dispatch', email: 'john.d@rapigestion.com', role: 'Usuario de Desembolsos' },
];

const getRoleBadgeVariant = (role: string) => {
  switch(role) {
    case 'Administrador': return 'destructive';
    case 'Gestor de Cobros': return 'default';
    case 'Usuario de Desembolsos': return 'secondary';
    default: return 'outline';
  }
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Gestiona la configuración y preferencias de tu aplicación.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>Actualiza la información de tu empresa y la configuración de la moneda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nombre de la Empresa</Label>
              <Input id="company-name" defaultValue="RapiGestion S.A." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-currency">Moneda por Defecto</Label>
              <Select defaultValue="C$">
                <SelectTrigger id="default-currency">
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C$">Córdoba (C$)</SelectItem>
                  <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Préstamos</CardTitle>
          <CardDescription>Configura los parámetros por defecto para nuevos créditos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Tasa de Interés por Defecto (%)</Label>
              <Input id="interest-rate" type="number" defaultValue="12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-loan">Monto Máximo de Préstamo (C$)</Label>
              <Input id="max-loan" type="number" defaultValue="50000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integraciones</CardTitle>
          <CardDescription>Gestiona las integraciones con servicios de terceros.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h4 className="font-medium">Impresoras Bluetooth Portátiles</h4>
                    <p className="text-sm text-muted-foreground">Activa para permitir la impresión de recibos desde dispositivos móviles.</p>
                </div>
                <Switch defaultChecked/>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
          <CardDescription>Gestiona las cuentas de usuario y sus roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Guardar Cambios</Button>
      </div>
    </div>
  )
}
