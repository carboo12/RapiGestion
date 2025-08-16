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
  { id: 'CR-001', client: 'Alice Johnson', amount: 'C$ 10,000', interest: '10%', term: '6 Months', dueDate: '2024-06-15', status: 'Active' },
  { id: 'CR-002', client: 'Robert Brown', amount: '$ 500', interest: '12%', term: '12 Months', dueDate: '2024-06-20', status: 'Active' },
  { id: 'CR-003', client: 'Emily Davis', amount: 'C$ 5,000', interest: '8%', term: '3 Months', dueDate: '2024-05-30', status: 'Overdue' },
  { id: 'CR-004', client: 'Michael Wilson', amount: 'C$ 25,000', interest: '15%', term: '24 Months', dueDate: '2024-06-25', status: 'Pending' },
  { id: 'CR-005', client: 'Sarah Miller', amount: '$ 2,000', interest: '7%', term: '18 Months', dueDate: '2024-01-10', status: 'Paid' },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Active': return 'default';
    case 'Overdue': return 'destructive';
    case 'Pending': return 'secondary';
    case 'Paid': return 'outline';
    default: return 'default';
  }
}

const getStatusClass = (status: string) => {
  switch(status) {
    case 'Active': return 'bg-blue-100 text-blue-800';
    case 'Overdue': return 'bg-red-100 text-red-800';
    case 'Paid': return 'bg-green-100 text-green-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
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
              <TableHead>Credit ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Next Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
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
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Record Payment</DropdownMenuItem>
                      <DropdownMenuItem>Print Payment Receipt</DropdownMenuItem>
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
        <h2 className="text-3xl font-bold tracking-tight">Credits</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> New Credit
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <CreditTable statusFilter="Active" />
        </TabsContent>
        <TabsContent value="pending">
          <CreditTable statusFilter="Pending" />
        </TabsContent>
        <TabsContent value="paid">
          <CreditTable statusFilter="Paid" />
        </TabsContent>
        <TabsContent value="overdue">
          <CreditTable statusFilter="Overdue" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
