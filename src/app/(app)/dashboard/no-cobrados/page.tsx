
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const pendingPayments = [
  { name: 'LESTER ANTONIO RAMIREZ CRUZ', amount: 'C$ 5,610.00', status: 'normal' },
  { name: 'MARIA ANTONIETA ARAUZ CORRALES', amount: 'C$ 12,000.00', status: 'normal' },
  { name: 'CARMELA DE JESUS GARMENDIA', amount: 'C$ 4,430.00', status: 'warning' },
  { name: 'HUMBERTO JUSTINO CARDOZA', amount: 'C$ 2,945.00', status: 'warning' },
  { name: 'JOSUE DANIEL DONAIRE', amount: 'C$ 12,290.00', status: 'warning' },
  { name: 'MARIA AGUSTINA ZAMORA CENTENO', amount: 'C$ 9,570.00', status: 'warning' },
  { name: 'MARTA LORENA DELGADO ALVARADO', amount: 'C$ 7,400.00', status: 'warning' },
];

const getStatusClasses = (status: string) => {
  switch (status) {
    case 'normal':
      return {
        border: 'border-green-500',
        avatar: 'bg-green-500',
        arrow: 'text-green-500',
      };
    case 'warning':
      return {
        border: 'border-yellow-500',
        avatar: 'bg-yellow-500',
        arrow: 'text-yellow-500',
      };
    default:
      return {
        border: 'border-gray-300',
        avatar: 'bg-gray-500',
        arrow: 'text-gray-400',
      };
  }
};

export default function NoCobradosPage() {
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Pendiente de Cobro</h1>
        <div className="w-10"></div>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." className="pl-10 pr-10 rounded-full" />
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
            <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <ul className="space-y-3">
          {pendingPayments.map((payment, index) => {
            const classes = getStatusClasses(payment.status);
            const initial = payment.name.split(' ').map(n => n[0]).slice(0,1).join('')

            return (
              <li key={index} className={`flex items-center p-3 bg-card rounded-lg border-2 ${classes.border}`}>
                <Avatar className={`h-10 w-10 text-white mr-4 ${classes.avatar}`}>
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{payment.name}</p>
                  <p className="text-blue-600 font-bold text-sm">Cancelacion: {payment.amount}</p>
                </div>
                <div className={`flex items-center justify-center h-6 w-6 rounded-full border-2 ${classes.border}`}>
                   <ChevronRight className={`h-5 w-5 ${classes.arrow}`} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  );
}
