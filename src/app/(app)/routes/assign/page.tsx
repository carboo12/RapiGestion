
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapIcon } from "lucide-react";
import Link from "next/link";

const pendingCredits = [
  { id: 'credit-01', clientName: 'Alice Johnson', address: '1234 Elm St', amount: 50.00 },
  { id: 'credit-02', clientName: 'Robert Brown', address: '5678 Oak St', amount: 75.00 },
  { id: 'credit-03', clientName: 'Emily Davis', address: '9101 Pine St', amount: 30.00 },
  { id: 'credit-04', clientName: 'Michael Wilson', address: '1213 Maple St', amount: 100.00 },
  { id: 'credit-05', clientName: 'David Williams', address: '2122 Cedar St', amount: 45.00 },
];

export default function AssignRoutePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/routes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Asignar Ruta de Cobro</h2>
            <p className="text-muted-foreground">
                Selecciona un gestor, una fecha y los créditos a cobrar.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Ruta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="collector">Gestor de Cobros</Label>
            <Select>
              <SelectTrigger id="collector">
                <SelectValue placeholder="Seleccionar un gestor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carlos-r">Carlos Rodriguez</SelectItem>
                <SelectItem value="maria-s">Maria Sanchez</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-date">Fecha de la Ruta</Label>
            <Input id="route-date" type="date" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Mapa</CardTitle>
                <CardDescription>Vista previa de la ruta.</CardDescription>
            </CardHeader>
            <CardContent className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <MapIcon className="w-16 h-16 text-muted-foreground" />
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Créditos Pendientes</CardTitle>
            <CardDescription>Selecciona los clientes que formarán parte de esta ruta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[50px]">
                        <Checkbox />
                    </TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pendingCredits.map((credit) => (
                    <TableRow key={credit.id}>
                        <TableCell>
                        <Checkbox id={`credit-${credit.id}`} />
                        </TableCell>
                        <TableCell className="font-medium">{credit.clientName}</TableCell>
                        <TableCell className="text-muted-foreground">{credit.address}</TableCell>
                        <TableCell className="text-right">C$ {credit.amount.toFixed(2)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>


      <div className="flex justify-end">
        <Button size="lg">Guardar Ruta</Button>
      </div>
    </div>
  );
}
