'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface Appointment {
  id: string;
  client_name: string;
  appointment_date: string;
  price: number | null;
  deposit: number | null;
  payment_status: 'paid' | 'deposit_paid' | 'pending' | 'fully_paid';
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">€{value.toFixed(2)}</div>
    </CardContent>
  </Card>
);

export default function FinancePage() {
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
          const { data, error } = await supabase
            .from('appointments')
            .select('id, client_name, appointment_date, price, deposit, payment_status')
            .eq('studio_id', studio.id)
            .order('appointment_date', { ascending: false });

          if (error) {
            setError('Failed to load financial data: ' + error.message);
          } else {
            setAppointments(data || []);
          }
        }
      }
      setLoading(false);
    }
    fetchAppointments();
  }, [supabase]);
  
  const financialStats = useMemo(() => {
    return appointments.reduce(
      (acc, app) => {
        if (app.payment_status === 'fully_paid' && app.price) {
          acc.totalRevenue += app.price;
        }
        if (app.deposit && (app.payment_status === 'deposit_paid' || app.payment_status === 'fully_paid')) {
          acc.totalDeposits += app.deposit;
        }
        if (app.payment_status !== 'fully_paid' && app.price) {
           const remaining = app.price - (app.payment_status === 'deposit_paid' && app.deposit ? app.deposit : 0);
           acc.outstanding += remaining;
        }
        return acc;
      },
      { totalRevenue: 0, totalDeposits: 0, outstanding: 0 }
    );
  }, [appointments]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    return months.map(month => ({
      name: format(month, 'MMM yy'),
      Revenue: appointments
        .filter(app => new Date(app.appointment_date) >= startOfMonth(month) && new Date(app.appointment_date) <= endOfMonth(month) && app.payment_status === 'fully_paid' && app.price)
        .reduce((sum, app) => sum + (app.price || 0), 0),
    })).reverse();
  }, [appointments]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'deposit_paid':
        return <Badge variant="secondary">Deposit Paid</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-t-transparent"></div>
      </div>
    );
  }
  
  if (error) {
    return <p className="text-red-500 bg-red-100 p-4 rounded mb-6">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Finance Overview</h1>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard title="Total Revenue (All Time)" value={financialStats.totalRevenue} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard title="Total Deposits Collected" value={financialStats.totalDeposits} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/></svg>} />
        <StatCard title="Outstanding Payments" value={financialStats.outstanding} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 8v4l3 3"/></svg>} />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="Revenue" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.client_name}</TableCell>
                      <TableCell>{format(new Date(app.appointment_date), 'PPP')}</TableCell>
                      <TableCell>€{app.price ? app.price.toFixed(2) : 'N/A'}</TableCell>
                      <TableCell>€{app.deposit ? app.deposit.toFixed(2) : 'N/A'}</TableCell>
                      <TableCell>{getPaymentStatusBadge(app.payment_status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 