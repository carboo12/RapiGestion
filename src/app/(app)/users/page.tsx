
'use client';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, PlusCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const initialUsers = [
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

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUser = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    };
    setUsers([...users, newUser]);
    setOpen(false);
    e.currentTarget.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Usuario
            </Button>
          </DialogTrigger>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los Usuarios</CardTitle>
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
      </div>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
          <DialogDescription>
            Completa los detalles para agregar un nuevo usuario al sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddUser}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input id="name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo
              </Label>
              <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Contraseña
              </Label>
              <div className="relative col-span-3">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} required />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"} contraseña</span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select name="role" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Gestor de Cobros">Gestor de Cobros</SelectItem>
                  <SelectItem value="Usuario de Desembolsos">Usuario de Desembolsos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Usuario</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
