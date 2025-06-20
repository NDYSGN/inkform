'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Calendar, User, FileText, CheckCircle, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { markAppointmentAsPaid, cancelAppointment } from './actions';
import { toast } from "sonner"

interface Appointment {
  id: string;
  client_name: string;
  appointment_date: string;
  description: string;
  status: string;
  price: number | null;
  deposit: number | null;
  deposit_paid: boolean;
  payment_status: string;
}

export default function AppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAppointments() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studio } = await supabase
          .from('studios')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (studio) {
          const { data: appointmentData, error: appointmentError } = await supabase
            .from('appointments')
            .select('*')
            .eq('studio_id', studio.id)
            .order('appointment_date', { ascending: true });

          if (appointmentError) {
            setError('Failed to load appointments: ' + appointmentError.message);
          } else {
            setAppointments(appointmentData || []);
          }
        }
      }
      setLoading(false);
    }
    fetchAppointments();
  }, [supabase]);

  const handleMarkAsPaid = async (appointmentId: string) => {
    const result = await markAppointmentAsPaid(appointmentId);
    if (result.success) {
      toast.success("Appointment marked as paid.");
      // Refresh local state to reflect the change immediately
      setAppointments(prev => 
        prev.map(app => 
          app.id === appointmentId ? { ...app, payment_status: 'fully_paid' } : app
        )
      );
    } else {
      toast.error(result.error || "Could not mark appointment as paid.");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const result = await cancelAppointment(appointmentId);
    if (result.success) {
      toast.success("Appointment cancelled.");
      setAppointments(prev =>
        prev.map(app =>
          app.id === appointmentId ? { ...app, status: 'cancelled', payment_status: 'cancelled' } : app
        )
      );
    } else {
      toast.error(result.error || "Could not cancel appointment.");
    }
  };

  const getPaymentStatusBadge = (appointment: Appointment) => {
    if (!appointment.price) return null;
    
    switch (appointment.payment_status) {
      case 'fully_paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'deposit_paid':
        return <Badge variant="secondary">Deposit Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return 'text-green-600';
      case 'deposit_paid':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Link href="/appointments/new">
          <Button className="w-full sm:w-auto">+ New Appointment</Button>
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded mb-6">{error}</p>}

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No appointments scheduled.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.client_name}</TableCell>
                  <TableCell>
                    {format(new Date(app.appointment_date), 'PPP p')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={app.status === 'Checked-in' ? 'default' : 'secondary'}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {app.price && (
                        <div className="text-sm">
                          <span className="font-medium">€{app.price.toFixed(2)}</span>
                          {app.deposit && (
                            <span className="text-gray-500 ml-2">
                              (€{app.deposit.toFixed(2)} deposit)
                            </span>
                          )}
                        </div>
                      )}
                      {getPaymentStatusBadge(app)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           {app.status === 'Scheduled' ? (
                              <Link href={`/appointments/${app.id}/check-in`} className="w-full justify-start cursor-pointer">Check-in</Link>
                            ) : (
                              <Link href={`/appointments/${app.id}/anamnesis`} className="w-full justify-start cursor-pointer">View Form</Link>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem 
                          onClick={() => handleMarkAsPaid(app.id)}
                          disabled={app.payment_status === 'fully_paid'}
                          className="cursor-pointer"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer"
                          onClick={() => handleCancelAppointment(app.id)}
                          disabled={app.status === 'cancelled'}
                        >
                          Cancel Appointment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No appointments scheduled.</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <CardTitle className="text-lg">{app.client_name}</CardTitle>
                  </div>
                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           {app.status === 'Scheduled' ? (
                              <Link href={`/appointments/${app.id}/check-in`} className="w-full justify-start cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />Check-in
                              </Link>
                            ) : (
                              <Link href={`/appointments/${app.id}/anamnesis`} className="w-full justify-start cursor-pointer">
                                <FileText className="mr-2 h-4 w-4" />View Form
                              </Link>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem 
                          onClick={() => handleMarkAsPaid(app.id)}
                          disabled={app.payment_status === 'fully_paid'}
                          className="cursor-pointer"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 cursor-pointer"
                          onClick={() => handleCancelAppointment(app.id)}
                          disabled={app.status === 'cancelled'}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Cancel Appointment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={app.status === 'Checked-in' ? 'default' : 'secondary'}>
                      {app.status}
                  </Badge>
                  {getPaymentStatusBadge(app)}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 pt-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(app.appointment_date), 'PPP p')}</span>
                </div>
                {app.description && (
                  <p className="text-sm text-gray-600">{app.description}</p>
                )}
                {app.price && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">€{app.price.toFixed(2)}</span>
                    {app.deposit && (
                      <span className="text-gray-500">
                        (€{app.deposit.toFixed(2)} deposit)
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 