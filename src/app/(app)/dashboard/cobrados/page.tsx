import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const payments = [
  { name: 'CARMEN MARIA MAIRENA', amount: 'C$ 100.00' },
  { name: 'JOSUE DANIEL DONAIRE', amount: 'C$ 1,000.00' },
  { name: 'MARIA ANTONIETA ARAUZ CORRALES', amount: 'C$ 1,500.00' },
  { name: 'LISBETH CAROLINA AMADOR CARRASCO', amount: 'C$ 200.00' },
  { name: 'CRISTOBAL DE LA CRUZ NAVARRO CENTENO', amount: 'C$ 100.00' },
  { name: 'HERMINIA DEL SOCORRO JUAREZ HERRERA', amount: 'C$ 100.00' },
  { name: 'LESTER ANTONIO RAMIREZ CRUZ', amount: 'C$ 1,300.00' },
];

export default function CobradosPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Cuotas Aplicadas</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10 pr-10" />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-3">
          {payments.map((payment, index) => (
            <li key={index} className="flex items-center p-3 bg-card rounded-lg border border-green-200">
              <Avatar className="h-10 w-10 bg-primary text-primary-foreground mr-4">
                <AvatarFallback>{payment.name.split(' ').slice(0, 2).map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{payment.name}</p>
                <p className="text-blue-600 font-bold text-sm">Abono: {payment.amount}</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
