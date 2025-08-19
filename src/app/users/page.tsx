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
import { Eye, EyeOff, PlusCircle, Edit } from "lucide-react"
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
import { useState, useEffect } from "react"
import { app } from "@/lib/firebase"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, collection, doc, setDoc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: 'online' | 'offline';
  lastSeen?: Timestamp;
}

const getRoleBadgeVariant = (role: string) => {
  switch(role) {
    case 'Administrador': return 'destructive';
    case 'Gestor de Cobros': return 'default';
    case 'Usuario de Desembolsos': return 'secondary';
    default: return 'outline';
  }
}

const formatLastSeen = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Nunca';
    const date = timestamp.toDate();
    if (isToday(date)) {
        return `hoy a las ${format(date, 'p', { locale: es })}`;
    }
    if (isYesterday(date)) {
        return `ayer a las ${format(date, 'p', { locale: es })}`;
    }
    return format(date, 'P p', { locale: es });
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const db = getFirestore(app);
    const usersCol = collection(db, 'users');
    
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(userList);
    }, (error) => {
      console.error("Error fetching users: ", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };


  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const db = getFirestore(app);
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role,
        status: 'offline',
        lastSeen: Timestamp.now()
      });

      toast({
        title: "Éxito",
        description: "Usuario agregado correctamente.",
      });

      setIsAddDialogOpen(false);
      e.currentTarget.reset();

    } catch (error: any) {
      console.error("Error adding user: ", error);
      toast({
        title: "Error al agregar usuario",
        description: error.message,
        variant: "destructive",
      })
    }
  };
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;

    try {
        const db = getFirestore(app);
        const userDocRef = doc(db, "users", editingUser.id);
        await updateDoc(userDocRef, {
            name,
            role,
        });

        toast({
            title: "Éxito",
            description: "Usuario actualizado correctamente.",
        });

        setIsEditDialogOpen(false);
        setEditingUser(null);

    } catch (error: any) {
        console.error("Error updating user:", error);
        toast({
            title: "Error al actualizar usuario",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>Gestiona las cuentas de usuario, sus roles y su estado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                      {user.status === 'online' ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span>En línea</span>
                        </>
                      ) : (
                          <>
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
                          </span>
                          <span className="text-muted-foreground text-xs">
                              Últ. vez {formatLastSeen(user.lastSeen)}
                          </span>
                          </>
                      )}
                      </div>
                  </TableCell>
                   <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight"
          >
            <PlusCircle className="h-7 w-7" />
            <span className="text-xs mt-1">Agregar</span>
          </Button>
        </DialogTrigger>

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
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Actualiza la información del usuario.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nombre
                </Label>
                <Input id="name" name="name" className="col-span-3" required defaultValue={editingUser?.name} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Correo
                </Label>
                <Input id="email" name="email" type="email" className="col-span-3" disabled defaultValue={editingUser?.email} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Rol
                </Label>
                <Select name="role" required defaultValue={editingUser?.role}>
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
               <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
