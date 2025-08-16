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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const creditsData = [
  { id: 'CR-001', client: 'Alice Johnson', amount: 'C$ 10,000', interest: '10%', term: '6 Meses', dueDate: '2024-06-15', status: 'Activo' },
  { id: 'CR-002', client: 'Robert Brown', amount: '$ 500', interest: '12%', term: '12 Meses', dueDate: '2024-06-20', status: 'Activo' },
  { id: 'CR-003', client: 'Emily Davis', amount: 'C$ 5,000', interest: '8%', term: '3 Meses', dueDate: '2024-05-30', status: 'Vencido' },
  { id: 'CR-004', client: 'Michael Wilson', amount: 'C$ 25,000', interest: '15%', term: '24 Meses', dueDate: '2024-06-25', status: 'Pendiente' },
  { id: 'CR-005', client: 'Sarah Miller', amount: '$ 2,000', interest: '7%', term: '18 Meses', dueDate: '2024-01-10', status: 'Pagado' },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Activo': return 'default';
    case 'Vencido': return 'destructive';
    case 'Pendiente': return 'secondary';
    case 'Pagado': return 'outline';
    default: return 'default';
  }
}

const getStatusClass = (status: string) => {
  switch(status) {
    case 'Activo': return 'bg-blue-100 text-blue-800';
    case 'Vencido': return 'bg-red-100 text-red-800';
    case 'Pagado': return 'bg-green-100 text-green-800';
    case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
    default: return '';
  }
}

const CreditTable = ({ statusFilter }: { statusFilter?: string }) => {
  const filteredCredits = statusFilter ? creditsData.filter(c => c.status === statusFilter) : creditsData;
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID de Crédito</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Interés</TableHead>
              <TableHead>Plazo</TableHead>
              <TableHead>Próxima Fecha de Pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredits.map((credit) => (
              <TableRow key={credit.id}>
                <TableCell className="font-medium">{credit.id}</TableCell>
                <TableCell>{credit.client}</TableCell>
                <TableCell>{credit.amount}</TableCell>
                <TableCell>{credit.interest}</TableCell>
                <TableCell>{credit.term}</TableCell>
                <TableCell>{credit.dueDate}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(credit.status)} className={getStatusClass(credit.status)}>
                    {credit.status}
                  </Badge>
                </TableCell>
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
                      <DropdownMenuItem>Registrar Pago</DropdownMenuItem>
                      <DropdownMenuItem>Imprimir Recibo de Pago</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function CreditsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Créditos</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Crédito
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes de Aprobación</TabsTrigger>
          <TabsTrigger value="paid">Pagados</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <CreditTable statusFilter="Activo" />
        </TabsContent>
        <TabsContent value="pending">
          <CreditTable statusFilter="Pendiente" />
        </TabsContent>
        <TabsContent value="paid">
          <CreditTable statusFilter="Pagado" />
        </TabsContent>
        <TabsContent value="overdue">
          <CreditTable statusFilter="Vencido" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
