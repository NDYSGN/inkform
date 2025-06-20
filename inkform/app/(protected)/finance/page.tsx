'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns'; // <-- SEUL import utile

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

interface Appointment {
  id: string;
  client_name: string;
  appointment_date: string;
  price: number;
  deposit: number;
  payment_status: 'pending' | 'deposit_paid' | 'paid' | 'fully_paid' | 'refunded';
}

export default function FinancePage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAppointments() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studio } = await supabase.from('studios').select('id').eq('user_id', user.id).single();
      if (!studio) return;
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, client_name, appointment_date, price, deposit, payment_status')
        .eq('studio_id', studio.id)
        .order('appointment_date', { ascending: false });

      if (error) {
        setError('Failed to fetch appointments');
      } else {
        setAppointments(data || []);
      }
      setLoading(false);
    }
    fetchAppointments();
  }, [supabase]);
  
  const stats = useMemo(() => {
    const totalRevenue = appointments.reduce((acc, app) => {
      if (app.payment_status === 'fully_paid' && app.price) {
        return acc + app.price;
      }
      if (app.deposit && (app.payment_status === 'deposit_paid' || app.payment_status === 'paid')) {
        return acc + app.deposit;
      }
      return acc;
    }, 0);

    const pendingRevenue = appointments.reduce((acc, app) => {
      if (app.payment_status !== 'fully_paid' && app.payment_status !== 'refunded' && app.price) {
        const paidAmount = (app.payment_status === 'deposit_paid' || app.payment_status === 'paid') ? app.deposit : 0;
        return acc + (app.price - paidAmount);
      }
      return acc;
    }, 0);

    const monthlyRevenueData = appointments
      .filter(app => (app.payment_status === 'fully_paid' || app.payment_status === 'paid' || app.payment_status === 'deposit_paid') && app.price)
      .reduce((acc, app) => {
        const month = format(new Date(app.appointment_date), 'MMM yyyy');
        if (!acc[month]) {
          acc[month] = 0;
        }
        if (app.payment_status === 'fully_paid') {
            acc[month] += app.price;
        } else if (app.deposit) {
            acc[month] += app.deposit;
        }
        return acc;
      }, {} as Record<string, number>);
    
    const chartData = Object.keys(monthlyRevenueData)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(month => ({
        name: month,
        revenue: monthlyRevenueData[month],
      }));

    return { 
      totalRevenue, 
      pendingRevenue, 
      totalAppointments: appointments.length, 
      chartData 
    };
  }, [appointments]);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'deposit_paid':
        return <Badge variant="secondary">Deposit Paid</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
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
        <StatCard title="Total Revenue (All Time)" value={`€${stats.totalRevenue.toFixed(2)}`} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard title="Total Appointments" value={stats.totalAppointments} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        <StatCard title="Outstanding Payments" value={`€${stats.pendingRevenue.toFixed(2)}`} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 8v4l3 3"/></svg>} />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#16a34a" />
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