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
import { MoreHorizontal, PlusCircle, MapPin, Loader2, User, Phone, Map as MapIcon, Briefcase, Building, FileText, FolderKanban } from "lucide-react"
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { nicaraguaData } from "@/lib/nicaragua-data";
import { app } from "@/lib/firebase";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";


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
  location?: string | null;
  actividadEconomica?: string;
  profesion?: string;
  centroTrabajo?: string;
  direccionTrabajo?: string;
  createdBy?: string;
}

interface Municipality {
  nombre: string;
  comunidades: string[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
  const formRef = useRef<HTMLFormElement>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const fetchClients = async () => {
    try {
      const db = getFirestore(app);
      const clientsCol = collection(db, 'clients');
      const clientSnapshot = await getDocs(clientsCol);
      const clientList = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientList);
    } catch (error) {
      // Silently fail and show an empty table.
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (editingClient) {
      const department = nicaraguaData.find(d => d.departamento === editingClient.departamento);
      const newMunicipalities = department ? department.municipios : [];
      setMunicipalities(newMunicipalities);

      const municipality = newMunicipalities.find(m => m.nombre === editingClient.municipio);
      setCommunities(municipality ? municipality.comunidades : []);

      setLocation(editingClient.location || null);
    }
  }, [editingClient])
  
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

  const handleOpenDialog = (clientToEdit: Client | null) => {
    if (clientToEdit) {
      setEditingClient(clientToEdit);
      setIsEditing(true);
    } else {
      setEditingClient(null);
      setIsEditing(false);
    }
    setOpen(true);
  }

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  }
  
  const handleViewExpediente = (client: Client) => {
    router.push(`/clients/${client.id}`);
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const auth = getAuth(app);
    const user = auth.currentUser;

    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para realizar esta acción.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const clientData: Omit<Client, 'id'> = {
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
      createdBy: isEditing ? editingClient?.createdBy : user.uid,
    };

    try {
      const db = getFirestore(app);
      if (isEditing && editingClient) {
        const clientRef = doc(db, "clients", editingClient.id);
        await setDoc(clientRef, clientData, { merge: true });
        
        const updatedClient = { 
          ...editingClient, 
          ...clientData,
        };
        setClients(clients.map(c => c.id === editingClient.id ? updatedClient : c));

        toast({
          title: "Éxito",
          description: "Cliente actualizado correctamente.",
        });

      } else {
        const newClientData = {
          ...clientData,
        };
        const docRef = await addDoc(collection(db, "clients"), newClientData);
        setClients([...clients, { id: docRef.id, ...newClientData }]);
        toast({
          title: "Éxito",
          description: "Cliente agregado correctamente.",
        });
      }

      if (formRef.current) {
        formRef.current.reset();
      }
      setLocation(null);
      setOpen(false);

    } catch (error) {
      console.error("Error saving client: ", error);
      toast({
        title: `Error al ${isEditing ? 'actualizar' : 'agregar'} cliente`,
        description: `No se pudo guardar el cliente en la base de datos.`,
        variant: "destructive",
      });
    }
  }

  const DetailRow = ({ label, value, icon }: { label: string; value?: string | null; icon: React.ElementType }) => {
    const Icon = icon;
    if (!value) return null;
    return (
      <div className="flex items-start text-sm">
        <Icon className="w-4 h-4 mr-2 mt-0.5 text-primary" />
        <span className="font-semibold">{label}:</span>
        <span className="ml-2 text-muted-foreground">{value}</span>
      </div>
    );
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          </div>
          <div>
            <Button onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Agregar Cliente
            </Button>
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
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No hay clientes registrados.</TableCell>
                    </TableRow>
                  )}
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.id.substring(0,8).toUpperCase()}</TableCell>
                      <TableCell>{`${client.primerNombre} ${client.apellido}`}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(client)}>Ver Detalles</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenDialog(client)}>Editar Cliente</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewExpediente(client)}>Expediente</DropdownMenuItem>
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Actualiza la información del cliente.' : 'Rellena la información para registrar a un nuevo cliente en el sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <form id="client-form" ref={formRef} onSubmit={handleFormSubmit}>
              <div className="space-y-4 py-4">
                  <Input id="primer-nombre" name="primer-nombre" placeholder="Primer nombre..." required defaultValue={editingClient?.primerNombre} />
                  <Input id="segundo-nombre" name="segundo-nombre" placeholder="Segundo nombre..." defaultValue={editingClient?.segundoNombre} />
                  <Input id="apellido" name="apellido" placeholder="Apellido..." required defaultValue={editingClient?.apellido}/>
                  <Input id="segundo-apellido" name="segundo-apellido" placeholder="Segundo apellido..." defaultValue={editingClient?.segundoApellido} />
                  <Input id="phone" name="phone" placeholder="Teléfono..." required defaultValue={editingClient?.phone} />
                  <Input id="cedula" name="cedula" placeholder="Cédula..." required defaultValue={editingClient?.cedula} />
                  <Select name="sexo" required defaultValue={editingClient?.sexo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un sexo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select name="estado-civil" required defaultValue={editingClient?.estadoCivil}>
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
                
                  <Select name="departamento" onValueChange={handleDepartmentChange} defaultValue={editingClient?.departamento || "Chinandega"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un departamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nicaraguaData.map(d => (
                        <SelectItem key={d.departamento} value={d.departamento}>{d.departamento}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="municipio" disabled={!selectedDepartment && !editingClient} onValueChange={handleMunicipalityChange} defaultValue={editingClient?.municipio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un municipio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map(m => (
                        <SelectItem key={m.nombre} value={m.nombre}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="comunidad" disabled={!selectedMunicipality && !editingClient} defaultValue={editingClient?.comunidad}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una comunidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {communities.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input id="direccion" name="direccion" placeholder="Dirección..." required defaultValue={editingClient?.direccion}/>

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

                <Input id="actividad-economica" name="actividad-economica" placeholder="Actividad Económica..." defaultValue={editingClient?.actividadEconomica} />
                <Input id="profesion" name="profesion" placeholder="Profesión..." defaultValue={editingClient?.profesion} />
                <Input id="centro-trabajo" name="centro-trabajo" placeholder="Centro de trabajo..." defaultValue={editingClient?.centroTrabajo} />
                <Input id="direccion-trabajo" name="direccion-trabajo" placeholder="Dirección de trabajo..." defaultValue={editingClient?.direccionTrabajo} />
              </div>
            </form>
          </div>
          <DialogFooter className="p-6 pt-0">
            <Button type="submit" form="client-form" className="w-full">
              {isEditing ? 'Guardar Cambios' : 'Guardar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Detalles del Cliente</DialogTitle>
            <DialogDescription>
              Información completa del cliente seleccionado.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="flex-1 overflow-y-auto px-1">
              <Tabs defaultValue="personal" className="w-full p-5">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal"><User className="mr-2"/>Personal</TabsTrigger>
                  <TabsTrigger value="location"><MapIcon className="mr-2"/>Ubicación</TabsTrigger>
                  <TabsTrigger value="work"><Briefcase className="mr-2"/>Laboral</TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                   <div className="space-y-4 py-4">
                     <DetailRow icon={User} label="Nombre Completo" value={`${selectedClient.primerNombre} ${selectedClient.segundoNombre || ''} ${selectedClient.apellido} ${selectedClient.segundoApellido || ''}`} />
                     <DetailRow icon={FileText} label="Cédula" value={selectedClient.cedula} />
                     <DetailRow icon={Phone} label="Teléfono" value={selectedClient.phone} />
                     <DetailRow icon={User} label="Sexo" value={selectedClient.sexo} />
                     <DetailRow icon={User} label="Estado Civil" value={selectedClient.estadoCivil} />
                   </div>
                </TabsContent>
                <TabsContent value="location">
                  <div className="space-y-4 py-4">
                     <DetailRow icon={MapIcon} label="Departamento" value={selectedClient.departamento} />
                     <DetailRow icon={MapIcon} label="Municipio" value={selectedClient.municipio} />
                     <DetailRow icon={MapIcon} label="Comunidad" value={selectedClient.comunidad} />
                     <DetailRow icon={MapIcon} label="Dirección" value={selectedClient.direccion} />
                     <DetailRow icon={MapPin} label="Coordenadas GPS" value={selectedClient.location} />
                   </div>
                </TabsContent>
                <TabsContent value="work">
                    <div className="space-y-4 py-4">
                      <DetailRow icon={Briefcase} label="Actividad Económica" value={selectedClient.actividadEconomica} />
                      <DetailRow icon={Briefcase} label="Profesión" value={selectedClient.profesion} />
                      <DetailRow icon={Building} label="Centro de Trabajo" value={selectedClient.centroTrabajo} />
                      <DetailRow icon={MapIcon} label="Dirección del Trabajo" value={selectedClient.direccionTrabajo} />
                    </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter className="p-6 pt-0">
            <Button onClick={() => setIsDetailsOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
