'use client';
import { Button } from "@/components/ui/button"
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
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, query, where, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Plus, User, MapPin, ChevronRight, Search, SlidersHorizontal, Loader2, UserPlus, Eye } from "lucide-react";

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
  activeCreditsCount?: number;
  paidCreditsCount?: number;
}

interface Municipality {
  nombre: string;
  comunidades: string[];
}

interface Credit {
    id: string;
    clientId: string;
    status: 'Activo' | 'Pagado' | 'Vencido';
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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

  useEffect(() => {
    const db = getFirestore(app);
    setLoading(true);

    const unsubscribeClients = onSnapshot(collection(db, 'clients'), (clientSnapshot) => {
        const clientsData = clientSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Client, 'activeCreditsCount' | 'paidCreditsCount'>));

        const creditsRef = collection(db, 'credits');
        onSnapshot(creditsRef, (creditsSnapshot) => {
            const creditsData = creditsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Credit));

            const clientsWithCreditCounts = clientsData.map(client => {
                const clientCredits = creditsData.filter(credit => credit.clientId === client.id);
                const activeCount = clientCredits.filter(c => c.status === 'Activo').length;
                const paidCount = clientCredits.filter(c => c.status === 'Pagado').length;
                return {
                    ...client,
                    activeCreditsCount: activeCount,
                    paidCreditsCount: paidCount,
                };
            });
            
            setClients(clientsWithCreditCounts);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching credits:", error);
            setLoading(false);
        });
    }, (error) => {
        console.error("Error fetching clients:", error);
        setLoading(false);
    });

    return () => {
        // In a real app, you might need a more sophisticated way to unsubscribe both listeners
        // For now, this structure assumes the component unmounts and remounts cleanly.
    };
  }, []);

  useEffect(() => {
    if (editingClient) {
      handleDepartmentChange(editingClient.departamento, false)
      handleMunicipalityChange(editingClient.municipio, false);

      setSelectedDepartment(editingClient.departamento);
      setSelectedMunicipality(editingClient.municipio);

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

  const handleDepartmentChange = (value: string, reset = true) => {
    setSelectedDepartment(value);
    const department = nicaraguaData.find(d => d.departamento === value);
    const newMunicipalities = department ? department.municipios : [];
    setMunicipalities(newMunicipalities);
    if(reset) {
        setSelectedMunicipality(null);
        setCommunities([]);
    }
  }

  const handleMunicipalityChange = (value: string, reset = true) => {
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
      setLocation(null);
      if (formRef.current) {
        formRef.current.reset();
      }
    }
    setOpen(true);
  }
  
  const handleClientClick = (client: Client) => {
    router.push(`/clients/${client.id}`);
  };

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
        
        toast({
          title: "Éxito",
          description: "Cliente actualizado correctamente.",
        });

      } else {
        const newClientData = { ...clientData };
        await addDoc(collection(db, "clients"), newClientData);
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
  
  const ClientItem = ({ client, onClick }: { client: Client; onClick: (client: Client) => void }) => {
    const fullName = [client.primerNombre, client.segundoNombre, client.apellido, client.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();

    return (
      <li
        onClick={() => onClick(client)}
        className="flex items-center p-3 bg-card rounded-lg border-2 border-green-400 cursor-pointer hover:bg-green-50 transition-colors"
      >
        <div className="flex-shrink-0 h-11 w-11 rounded-full bg-green-500 flex items-center justify-center mr-4">
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{fullName}</p>
          <div className="text-xs text-muted-foreground mt-1">
            <span>Telefono: <span className="font-semibold text-blue-600">{client.phone}</span></span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <span>Creditos Activos: <span className="font-semibold text-green-600">{client.activeCreditsCount || 0}</span></span>
            <span className="ml-2">Ciclos: <span className="font-semibold text-yellow-600">{client.paidCreditsCount || 0}</span></span>
          </div>
        </div>
        <ChevronRight className="h-6 w-6 text-green-500 ml-2" />
      </li>
    );
  };
  
  return (
    <div className="relative h-full flex flex-col">
      <header className="flex items-center justify-between p-4">
         <h1 className="text-lg font-bold text-green-600">Clientes</h1>
         <span className="text-xs text-muted-foreground">v 10.1.1</span>
      </header>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10 pr-10 rounded-full bg-white border-gray-300" />
           <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto px-4 pb-20">
            {clients.length > 0 ? (
                <ul className="space-y-3">
                    {clients.map(client => (
                        <ClientItem key={client.id} client={client} onClick={handleClientClick}/>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">No hay clientes registrados.</p>
                </div>
            )}
        </main>
      )}

      <Button
        onClick={() => handleOpenDialog(null)}
        className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight"
      >
        <UserPlus className="h-7 w-7" />
        <span className="text-xs mt-1">Cliente</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{isEditing ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Actualiza la información del cliente.' : 'Rellena la información para registrar a un nuevo cliente en el sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 no-scrollbar">
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
                  <Select name="municipio" onValueChange={handleMunicipalityChange} defaultValue={editingClient?.municipio} value={selectedMunicipality ?? ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un municipio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map(m => (
                        <SelectItem key={m.nombre} value={m.nombre}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="comunidad" defaultValue={editingClient?.comunidad}>
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
    </div>
  )
}
