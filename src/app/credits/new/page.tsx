'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, getFirestore, serverTimestamp, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Calculator, Loader2, Save, ShieldAlert } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const creditSchema = z.object({
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  interestRate: z.coerce.number().min(0, 'La tasa de interés no puede ser negativa'),
  paymentFrequency: z.enum(['diario', 'semanal', 'quincenal', 'mensual']),
  term: z.coerce.number().int().min(1, 'El plazo debe ser de al menos 1 mes'),
  disbursementDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha de desembolso inválida" }),
  destination: z.string().min(1, 'El destino del crédito es requerido'),
});

type CreditFormData = z.infer<typeof creditSchema>;

interface SelectedClient {
    id: string;
    name: string;
    totalGuaranteeValue: number;
}

export default function NewCreditPage() {
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstPaymentDate, setFirstPaymentDate] = useState<Date | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema.refine(
        (data) => {
            if (selectedClient && selectedClient.totalGuaranteeValue) {
                return data.amount <= selectedClient.totalGuaranteeValue;
            }
            return true;
        },
        {
            message: 'El monto del crédito no puede exceder el valor total de la garantía.',
            path: ['amount'],
        }
    )),
    defaultValues: {
      amount: 0,
      term: 1,
      disbursementDate: new Date().toISOString().split('T')[0],
      paymentFrequency: 'diario',
      interestRate: 10,
      destination: '',
    }
  });

  const disbursementDate = form.watch('disbursementDate');
  const paymentFrequency = form.watch('paymentFrequency');
  const term = form.watch('term');
  
  useEffect(() => {
    const clientData = localStorage.getItem('selectedClient');
    if (clientData) {
      const parsedClient = JSON.parse(clientData);
      setSelectedClient(parsedClient);
      form.trigger(); // Trigger validation after client is set
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se ha seleccionado ningún cliente. Redirigiendo...',
      });
      router.push('/clients');
    }
  }, [router, toast, form]);

  useEffect(() => {
    if (disbursementDate && paymentFrequency) {
        const date = new Date(disbursementDate);
        date.setUTCHours(0,0,0,0); // Normalize date
        const newFirstPaymentDate = new Date(date);

        switch (paymentFrequency) {
            case 'diario': newFirstPaymentDate.setDate(newFirstPaymentDate.getDate() + 1); break;
            case 'semanal': newFirstPaymentDate.setDate(newFirstPaymentDate.getDate() + 7); break;
            case 'quincenal': newFirstPaymentDate.setDate(newFirstPaymentDate.getDate() + 15); break;
            case 'mensual': newFirstPaymentDate.setMonth(newFirstPaymentDate.getMonth() + 1); break;
        }
        setFirstPaymentDate(newFirstPaymentDate);
    }
  }, [disbursementDate, paymentFrequency]);

  const getNumberOfInstallments = (term: number, frequency: 'diario' | 'semanal' | 'quincenal' | 'mensual'): number => {
      const months = term;
      switch (frequency) {
          case 'diario': return months * 30; // Assuming 30 days per month
          case 'semanal': return months * 4; // Assuming 4 weeks per month
          case 'quincenal': return months * 2;
          case 'mensual': return months;
          default: return 0;
      }
  }
  
  const onSubmit = async (data: CreditFormData) => {
    if (!selectedClient || !firstPaymentDate) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cliente no encontrado o fecha de primer pago no calculada.' });
      return;
    }

    const auth = getAuth(app);
    const gestor = auth.currentUser;
    if (!gestor) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un crédito.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const db = getFirestore(app);
        const disbursementDateObj = new Date(data.disbursementDate);
        
        const numberOfInstallments = getNumberOfInstallments(data.term, data.paymentFrequency);
        const totalInterest = data.amount * (data.interestRate / 100);
        const totalToPay = data.amount + totalInterest;

        // The user explained a different calculation for installmentAmount
        // Amortization = (Monto a prestar / #cuotas) + interes por cuota
        const capitalPerInstallment = data.amount / numberOfInstallments;
        const interestPerInstallment = totalInterest / numberOfInstallments;
        const installmentAmount = capitalPerInstallment + interestPerInstallment;
        
        const creditData = {
          clientId: selectedClient.id,
          amount: data.amount,
          currency: 'C$',
          interestRate: data.interestRate,
          term: data.term, // in months
          paymentFrequency: data.paymentFrequency,
          numberOfInstallments: numberOfInstallments,
          disbursementDate: Timestamp.fromDate(disbursementDateObj),
          firstPaymentDate: Timestamp.fromDate(firstPaymentDate),
          status: 'Activo',
          totalToPay: parseFloat(totalToPay.toFixed(2)),
          balance: parseFloat(totalToPay.toFixed(2)),
          installmentAmount: parseFloat(installmentAmount.toFixed(2)),
          destination: data.destination,
          gestorId: gestor.email, 
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'credits'), creditData);
        toast({ title: 'Éxito', description: 'Crédito creado correctamente.' });
        localStorage.removeItem('selectedClient');
        router.push(`/credits/${docRef.id}`);

    } catch (error) {
        console.error("Error creating credit:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el crédito.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount)) return 'C$ 0.00';
    return `C$ ${amount.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  if (!selectedClient) {
    return null; 
  }

  const interestRateOptions = [
    ...Array.from({ length: 9 }, (_, i) => i + 1), // 1-9
    10, 10.44, 10.5, 11, 11.5, 12, 12.5, 12.66, 13, 13.5,
    ...Array.from({ length: (40 - 14) * 2 + 1 }, (_, i) => 14 + i * 0.5), // 14-40 in 0.5 steps
  ];


  return (
    <div className="flex flex-col h-full -m-4 md:-m-8">
      <div className="flex flex-col flex-1 bg-gray-50 overflow-y-auto no-scrollbar">
          <header className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-6 w-6 text-green-600" />
            </Button>
            <h1 className="text-lg font-bold text-green-600">Nuevo Crédito</h1>
            <span className="text-xs text-muted-foreground w-10">v 10.1.1</span>
          </header>
          
          <main className="flex-1 p-4 space-y-4 pb-24">
            <Card className="rounded-2xl border-2 border-green-500">
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-500">Cliente:</p>
                    <p className="font-bold text-blue-600 text-lg">{selectedClient.name}</p>
                     <div className="mt-2 text-sm font-semibold text-indigo-600 flex items-center justify-center gap-2">
                        <ShieldAlert className="h-5 w-5" />
                        <span>Valor de Garantía: {formatCurrency(selectedClient.totalGuaranteeValue)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-2 border-blue-500">
                <CardHeader>
                    <CardTitle>Detalles del Crédito</CardTitle>
                    <CardDescription>Completa la información del nuevo crédito.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Monto a Prestar (C$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 5000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tasa de Interés (%)</FormLabel>
                                        <Select onValueChange={(value) => field.onChange(parseFloat(value))} defaultValue={String(field.value)}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona una tasa" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {interestRateOptions.map(rate => (
                                                    <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="paymentFrequency"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Frecuencia de Pago</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una frecuencia" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="diario">Diario</SelectItem>
                                        <SelectItem value="semanal">Semanal</SelectItem>
                                        <SelectItem value="quincenal">Quincenal</SelectItem>
                                        <SelectItem value="mensual">Mensual</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="term"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plazo (meses)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 3" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="destination"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Destino del Crédito</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Ej: Compra de mercancía" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="disbursementDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha de Desembolso</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <div>
                                <Label>Fecha de Primera Cuota</Label>
                                <Input 
                                    type="text" 
                                    readOnly 
                                    value={firstPaymentDate ? format(firstPaymentDate, 'dd / MMMM / yyyy', { locale: es }) : 'Calculando...'}
                                    className="mt-2 bg-gray-100"
                                />
                            </div>
                             <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-full bg-green-500 hover:bg-green-600 text-lg font-bold">
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-6 w-6" />
                                )}
                                Guardar Crédito
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
          </main>
      </div>
    </div>
  );
}
