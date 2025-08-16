import {
  Card,
  CardContent,
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
import { DollarSign, Users, PiggyBank, AlertTriangle } from "lucide-react"

export default function DashboardPage() {
  const transactions = [
    { id: 1, client: "John Doe", type: "Payment", amount: "C$ 500.00", date: "2024-05-20", status: "Completed" },
    { id: 2, client: "Jane Smith", type: "Disbursement", amount: "$ 100.00", date: "2024-05-20", status: "Completed" },
    { id: 3, client: "Peter Jones", type: "Payment", amount: "C$ 1,200.00", date: "2024-05-19", status: "Completed" },
    { id: 4, client: "Mary Johnson", type: "Payment", amount: "C$ 350.00", date: "2024-05-19", status: "Pending" },
    { id: 5, client: "David Williams", type: "Disbursement", amount: "$ 250.00", date: "2024-05-18", status: "Completed" },
  ]
  
  return (
    <div className="flex-1 space-y-4">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loaned Value</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">C$ 1,250,000.00</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">C$ 450,000.00</div>
            <p className="text-xs text-muted-foreground">+12.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+150</div>
            <p className="text-xs text-muted-foreground">+10 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Credits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">2 new since yesterday</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.client}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                   <TableCell>
                    <Badge variant={tx.status === 'Completed' ? 'default' : 'secondary'} className={tx.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{tx.status}</Badge>
                  </TableCell>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell className="text-right">{tx.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
