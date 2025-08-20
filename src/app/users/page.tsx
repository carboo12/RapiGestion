
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
import { Eye, EyeOff, PlusCircle, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useRef } from "react"
import { app } from "@/lib/firebase"
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getFirestore, collection, doc, setDoc, onSnapshot, Timestamp, updateDoc, deleteDoc } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logAction } from "@/lib/action-logger"

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
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const addUserFormRef = useRef<HTMLFormElement>(null);
  const [adminCredentials, setAdminCredentials] = useState<{email: string, pass: string} | null>(null);

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

  const handleOpenDeleteDialog = (user: User) => {
    setDeletingUser(user);
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    const auth = getAuth(app);
    const admin = auth.currentUser;

    if (!admin) {
        toast({ title: "Error", description: "No se pudo obtener el usuario administrador actual.", variant: "destructive" });
        return;
    }
    
    // This is a workaround since there's no client-side way to get the password.
    // We prompt the admin for their password once to re-authenticate.
    let adminPass = adminCredentials?.pass;
    if (admin.email !== adminCredentials?.email) {
        adminPass = prompt('Para continuar, por favor ingresa tu contraseña de administrador:');
        if (!adminPass) {
            toast({ title: "Cancelado", description: "Operación cancelada por el usuario."});
            return;
        }
        setAdminCredentials({email: admin.email!, pass: adminPass});
    }

    if (!adminPass) return;


    try {
      // This function logs in the new user, so we have to log back in as admin.
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
      
      await logAction('CREAR USUARIO', `Usuario ${email} creado con rol ${role}`, admin.uid);

      // Re-authenticate as admin
      await signInWithEmailAndPassword(auth, admin.email!, adminPass);
      
      toast({
        title: "Éxito",
        description: "Usuario agregado correctamente.",
      });

      addUserFormRef.current?.reset();
      setIsAddDialogOpen(false);

    } catch (error: any) {
      console.error("Error adding user: ", error);
       // If re-authentication fails, clear the stored password
      if (error.code === 'auth/wrong-password') {
          setAdminCredentials(null);
          toast({ title: "Error de Autenticación", description: "La contraseña de administrador es incorrecta.", variant: "destructive" });
      } else {
          toast({
            title: "Error al agregar usuario",
            description: error.message,
            variant: "destructive",
          })
      }
    }
  };
  
  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const auth = getAuth(app);
    const admin = auth.currentUser;

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

        if (admin) {
            await logAction('ACTUALIZAR USUARIO', `Usuario ${editingUser.email} actualizado. Nuevo rol: ${role}`, admin.uid);
        }

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
  
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    
    const auth = getAuth(app);
    const admin = auth.currentUser;
    if (!admin) {
      toast({ title: "Error", description: "Acción no permitida.", variant: "destructive" });
      return;
    }

    try {
        const db = getFirestore(app);
        // Deleting from Firestore.
        await deleteDoc(doc(db, "users", deletingUser.id));

        // Note: Client-side SDK cannot delete other user accounts from Auth.
        // This requires the Admin SDK in a backend environment.
        // By deleting the user from Firestore, they lose their role and can't function in the app.
        // We log this action for manual cleanup in Firebase Console if needed.
        await logAction('ACTUALIZAR USUARIO', `Usuario ${deletingUser.email} eliminado de la base de datos. Se requiere limpieza manual de Auth.`, admin.uid);


        toast({
            title: "Usuario Eliminado",
            description: `${deletingUser.name} ha sido eliminado de la base de datos.`,
        });
        setDeletingUser(null);
    } catch(error: any) {
        console.error("Error deleting user:", error);
        toast({
            title: "Error al eliminar",
            description: "No se pudo eliminar el usuario de la base de datos.",
            variant: "destructive",
        });
    }
  }


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
                   <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDeleteDialog(user)} disabled={user.role === 'Administrador'}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario
                                      <span className="font-bold"> {deletingUser?.name} </span>
                                       de la base de datos.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
                                    Sí, eliminar usuario
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
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
          <form onSubmit={handleAddUser} ref={addUserFormRef}>
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
               <Button variant="ghost" type="button" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

      