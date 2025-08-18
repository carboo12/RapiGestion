
'use client';
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
import { Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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

interface CompanySettings {
    companyName: string;
    ruc: string;
    phone: string;
    address: string;
    defaultCurrency: string;
    exchangeRate: number;
}


export default function SettingsPage() {
    const [settings, setSettings] = useState<CompanySettings>({
        companyName: '',
        ruc: '',
        phone: '',
        address: '',
        defaultCurrency: 'C$',
        exchangeRate: 37.0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const db = getFirestore(app);
        const settingsDocRef = doc(db, 'settings', 'general');
        
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const docSnap = await getDoc(settingsDocRef);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as CompanySettings);
                } else {
                    console.log("No such document! Using default settings.");
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                 toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración." });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (value: string) => {
        setSettings(prev => ({ ...prev, defaultCurrency: value }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        const db = getFirestore(app);
        const settingsDocRef = doc(db, 'settings', 'general');
        try {
            await setDoc(settingsDocRef, settings, { merge: true });
            toast({ title: "Éxito", description: "La configuración ha sido guardada." });
        } catch (error) {
            console.error("Error saving settings:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
        <p className="text-muted-foreground">Gestiona la configuración y preferencias de tu aplicación.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>Actualiza la información de tu empresa y la configuración de la moneda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input id="companyName" value={settings.companyName} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input id="ruc" value={settings.ruc} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Número Telefónico</Label>
              <Input id="phone" value={settings.phone} onChange={handleInputChange} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="address">Dirección de la Empresa</Label>
              <Input id="address" value={settings.address} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Moneda por Defecto</Label>
              <Select value={settings.defaultCurrency} onValueChange={handleSelectChange}>
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C$">Córdoba (C$)</SelectItem>
                  <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="exchangeRate">Tasa de Cambio (USD a C$)</Label>
              <Input id="exchangeRate" type="number" value={settings.exchangeRate} onChange={handleInputChange} />
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

      <Button
        onClick={handleSaveSettings}
        disabled={saving}
        className="fixed bottom-20 right-4 h-16 w-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg text-white flex flex-col items-center justify-center p-0 leading-tight"
      >
        {saving ? <Loader2 className="h-7 w-7 animate-spin" /> : <Save className="h-7 w-7" />}
        <span className="text-xs mt-1">Guardar</span>
      </Button>
    </div>
  )
}
