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
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const clients = [
  { id: 'CUST-001', name: 'Alice Johnson', phone: '+1-202-555-0191', address: '1234 Elm St, Springfield', email: 'alice.j@example.com' },
  { id: 'CUST-002', name: 'Robert Brown', phone: '+1-202-555-0154', address: '5678 Oak St, Springfield', email: 'robert.b@example.com' },
  { id: 'CUST-003', name: 'Emily Davis', phone: '+1-202-555-0129', address: '9101 Pine St, Springfield', email: 'emily.d@example.com' },
  { id: 'CUST-004', name: 'Michael Wilson', phone: '+1-202-555-0188', address: '1213 Maple St, Springfield', email: 'michael.w@example.com' },
  { id: 'CUST-005', name: 'Sarah Miller', phone: '+1-202-555-0176', address: '1415 Birch St, Springfield', email: 'sarah.m@example.com' },
];

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

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
                    <TableCell className="font-medium">{client.id}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>{client.address}</TableCell>
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
                          <DropdownMenuItem>Editar Cliente</DropdownMenuItem>
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
          <div className="space-y-4 py-4 pr-2">
              <Input id="primer-nombre" placeholder="Primer nombre..." />
              <Input id="segundo-nombre" placeholder="Segundo nombre..." />
              <Input id="apellido" placeholder="Apellido..." />
              <Input id="segundo-apellido" placeholder="Segundo apellido..." />
              <Input id="phone" placeholder="Teléfono..." />
              <Input id="cedula" placeholder="Cédula..." />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un sexo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
              <Select>
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
            
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un departamento..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Add department options here */}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un municipio..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Add municipality options here */}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una comunidad..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Add community options here */}
                </SelectContent>
              </Select>
              <Input id="direccion" placeholder="Dirección..." />

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

            <Input id="actividad-economica" placeholder="Actividad Económica..." />
          </div>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button type="submit" className="w-full" onClick={() => setOpen(false)}>Guardar Cliente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
