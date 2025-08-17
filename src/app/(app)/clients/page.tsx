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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, MapPin, Loader2 } from "lucide-react"
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { nicaraguaData } from "@/lib/nicaragua-data";
import { app } from "@/lib/firebase";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";


interface Client {
  id: string;
  primerNombre: string;
  segundoNombre?: string;
  apellido: string;
  segundoApellido?: string;
  phone: string;
  cedula: string;
  sexo: string;
  estadoCivil: string;
  departamento: string;
  municipio: string;
  comunidad: string;
  direccion: string;
  email?: string; // Adding email to match table display
}

interface Municipality {
  nombre: string;
  comunidades: string[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [selectedDepartment, setSelectedDepartment] = useState('Chinandega');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>(() => {
      const chinandega = nicaraguaData.find(d => d.departamento === 'Chinandega');
      return chinandega ? chinandega.municipios : [];
  });
  const [communities, setCommunities] = useState<string[]>([]);
  
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const db = getFirestore(app);
      const clientsCol = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCol);
      const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientList);
      if (clientList.length === 0) {
        toast({
          title: "Información",
          description: "No hay clientes registrados para mostrar.",
        });
      }
    } catch (error) {
      console.error("Error fetching clients: ", error);
      toast({
        title: "Error de Carga",
        description: "No se pudieron cargar los clientes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La geolocalización no es compatible con este navegador.");
      toast({
        variant: "destructive",
        title: "Error de Geolocalización",
        description: "Tu navegador no es compatible con esta función.",
      });
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    setLocation(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`);
        setIsGettingLocation(false);
        toast({
            title: "Ubicación Obtenida",
            description: "Se capturaron las coordenadas GPS correctamente.",
        })
      },
      (error) => {
        let message = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Permiso de ubicación denegado.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "La información de ubicación no está disponible.";
            break;
          case error.TIMEOUT:
            message = "Se agotó el tiempo de espera para obtener la ubicación.";
            break;
          default:
            message = "Ocurrió un error desconocido.";
            break;
        }
        setLocationError(message);
        setIsGettingLocation(false);
        toast({
          variant: "destructive",
          title: "Error al obtener ubicación",
          description: message,
        });
      }
    );
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    const department = nicaraguaData.find(d => d.departamento === value);
    const newMunicipalities = department ? department.municipios : [];
    setMunicipalities(newMunicipalities);
    setSelectedMunicipality(null);
    setCommunities([]);
  }

  const handleMunicipalityChange = (value: string) => {
    setSelectedMunicipality(value);
    const municipality = municipalities.find(m => m.nombre === value);
    setCommunities(municipality ? municipality.comunidades : []);
  }

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClient = {
      primerNombre: formData.get('primer-nombre') as string,
      segundoNombre: formData.get('segundo-nombre') as string,
      apellido: formData.get('apellido') as string,
      segundoApellido: formData.get('segundo-apellido') as string,
      phone: formData.get('phone') as string,
      cedula: formData.get('cedula') as string,
      sexo: formData.get('sexo') as string,
      estadoCivil: formData.get('estado-civil') as string,
      departamento: formData.get('departamento') as string,
      municipio: formData.get('municipio') as string,
      comunidad: formData.get('comunidad') as string,
      direccion: formData.get('direccion') as string,
      location: location,
      actividadEconomica: formData.get('actividad-economica') as string,
      profesion: formData.get('profesion') as string,
      centroTrabajo: formData.get('centro-trabajo') as string,
      direccionTrabajo: formData.get('direccion-trabajo') as string,
    };

    try {
      const db = getFirestore(app);
      const docRef = await addDoc(collection(db, "clients"), newClient);
      toast({
        title: "Éxito",
        description: "Cliente agregado correctamente.",
      });
      setClients([...clients, { id: docRef.id, ...newClient }]);
      setOpen(false);
      e.currentTarget.reset();
      setLocation(null);
    } catch (error) {
      console.error("Error adding client: ", error);
      toast({
        title: "Error al agregar cliente",
        description: "No se pudo guardar el cliente en la base de datos.",
        variant: "destructive",
      });
    }
  }


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
        </div>
        <div>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Cliente
            </Button>
          </DialogTrigger>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todos los Clientes</CardTitle>
            <CardDescription>
              Una lista de todos los clientes registrados en RapiGestion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID de Cliente</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.id.substring(0,8).toUpperCase()}</TableCell>
                    <TableCell>{`${client.primerNombre} ${client.apellido}`}</TableCell>
                    <TableCell>{client.email || 'N/A'}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.direccion}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setOpen(true)}>Editar Cliente</DropdownMenuItem>
                          <DropdownMenuItem>Ver Garantías</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Rellena la información para registrar a un nuevo cliente en el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <form id="add-client-form" onSubmit={handleAddClient}>
            <div className="space-y-4 py-4">
                <Input id="primer-nombre" name="primer-nombre" placeholder="Primer nombre..." required />
                <Input id="segundo-nombre" name="segundo-nombre" placeholder="Segundo nombre..." />
                <Input id="apellido" name="apellido" placeholder="Apellido..." required />
                <Input id="segundo-apellido" name="segundo-apellido" placeholder="Segundo apellido..." />
                <Input id="phone" name="phone" placeholder="Teléfono..." required />
                <Input id="cedula" name="cedula" placeholder="Cédula..." required />
                <Select name="sexo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un sexo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                  </SelectContent>
                </Select>
                <Select name="estado-civil" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado civil..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soltero">Soltero/a</SelectItem>
                    <SelectItem value="casado">Casado/a</SelectItem>
                    <SelectItem value="viudo">Viudo/a</SelectItem>
                    <SelectItem value="divorciado">Divorciado/a</SelectItem>
                  </SelectContent>
                </Select>

              <Separator className="my-4" />
              <h4 className="text-center font-semibold text-primary">Ubicación del Cliente</h4>
              
                <Select name="departamento" onValueChange={handleDepartmentChange} defaultValue="Chinandega">
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {nicaraguaData.map(d => (
                      <SelectItem key={d.departamento} value={d.departamento}>{d.departamento}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select name="municipio" disabled={!selectedDepartment} onValueChange={handleMunicipalityChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un municipio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map(m => (
                      <SelectItem key={m.nombre} value={m.nombre}>{m.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select name="comunidad" disabled={!selectedMunicipality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione una comunidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input id="direccion" name="direccion" placeholder="Dirección..." required/>

              <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isGettingLocation}>
                      {isGettingLocation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                          <MapPin className="h-4 w-4" />
                      )}
                      GPS
                  </Button>
                  { (location || locationError) &&
                      <div className="flex-1">
                          {location && <p className="text-sm text-green-600">{location}</p>}
                          {locationError && <p className="text-sm text-destructive">{locationError}</p>}
                      </div>
                  }
              </div>

              <Separator className="my-4" />
              <h4 className="text-center font-semibold text-primary">Actividad Económica del Cliente</h4>

              <Input id="actividad-economica" name="actividad-economica" placeholder="Actividad Económica..." />
              <Input id="profesion" name="profesion" placeholder="Profesión..." />
              <Input id="centro-trabajo" name="centro-trabajo" placeholder="Centro de trabajo..." />
              <Input id="direccion-trabajo" name="direccion-trabajo" placeholder="Dirección de trabajo..." />
            </div>
          </form>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button type="submit" form="add-client-form" className="w-full">Guardar Cliente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
