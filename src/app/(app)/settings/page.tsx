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
import { Separator } from "@/components/ui/separator"
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

const users = [
  { name: 'Admin User', email: 'admin@rapigestion.com', role: 'Administrator' },
  { name: 'Carlos Rodriguez', email: 'carlos.r@rapigestion.com', role: 'Collection Manager' },
  { name: 'Maria Sanchez', email: 'maria.s@rapigestion.com', role: 'Collection Manager' },
  { name: 'John Dispatch', email: 'john.d@rapigestion.com', role: 'Disbursement User' },
];

const getRoleBadgeVariant = (role: string) => {
  switch(role) {
    case 'Administrator': return 'destructive';
    case 'Collection Manager': return 'default';
    case 'Disbursement User': return 'secondary';
    default: return 'outline';
  }
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground">Manage your application settings and preferences.</p>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your company information and currency settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" defaultValue="RapiGestion S.A." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-currency">Default Currency</Label>
              <Select defaultValue="C$">
                <SelectTrigger id="default-currency">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C$">Córdoba (C$)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Loan Settings</CardTitle>
          <CardDescription>Configure default parameters for new credits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Default Interest Rate (%)</Label>
              <Input id="interest-rate" type="number" defaultValue="12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-loan">Max Loan Amount (C$)</Label>
              <Input id="max-loan" type="number" defaultValue="50000" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Manage third-party service integrations.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h4 className="font-medium">Portable Bluetooth Printers</h4>
                    <p className="text-sm text-muted-foreground">Enable to allow printing receipts from mobile devices.</p>
                </div>
                <Switch defaultChecked/>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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

      <div className="flex justify-end">
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
