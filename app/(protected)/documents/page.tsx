'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, FileText, Calendar, User } from 'lucide-react';

interface FormDocument {
  id: string;
  appointment_id: string;
  signature_date: string;
  place: string;
  appointment: {
    client_name: string;
    appointment_date: string;
    description: string;
  };
}

export default function DocumentsPage() {
  const supabase = createClient();
  const [documents, setDocuments] = useState<FormDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    async function fetchDocuments() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studio } = await supabase
          .from('studios')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (studio) {
          const { data: formData, error: formError } = await supabase
            .from('anamnesis_forms')
            .select(`
              id,
              appointment_id,
              signature_date,
              place,
              appointment:appointments (
                client_name,
                appointment_date,
                description
              )
            `)
            .eq('appointment.studio_id', studio.id)
            .order('signature_date', { ascending: false });

          if (formError) {
            setError('Failed to load documents: ' + formError.message);
          } else {
            setDocuments((formData as any) || []);
          }
        }
      }
      setLoading(false);
    }

    fetchDocuments();
  }, [supabase]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.appointment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.place.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;
    
    const docDate = new Date(doc.signature_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    switch (dateFilter) {
      case 'today':
        return docDate.toDateString() === today.toDateString();
      case 'yesterday':
        return docDate.toDateString() === yesterday.toDateString();
      case 'lastWeek':
        return docDate >= lastWeek;
      case 'lastMonth':
        return docDate >= lastMonth;
      default:
        return true;
    }
  });

  const stats = {
    total: documents.length,
    today: documents.filter(doc => {
      const docDate = new Date(doc.signature_date);
      const today = new Date();
      return docDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: documents.filter(doc => {
      const docDate = new Date(doc.signature_date);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return docDate >= lastWeek;
    }).length,
    thisMonth: documents.filter(doc => {
      const docDate = new Date(doc.signature_date);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return docDate >= lastMonth;
    }).length,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-gray-600">All completed anamnesis forms</p>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded mb-6">{error}</p>}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs lg:text-sm text-gray-600">Total Forms</p>
                <p className="text-xl lg:text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs lg:text-sm text-gray-600">Today</p>
                <p className="text-xl lg:text-2xl font-bold">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs lg:text-sm text-gray-600">This Week</p>
                <p className="text-xl lg:text-2xl font-bold">{stats.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs lg:text-sm text-gray-600">This Month</p>
                <p className="text-xl lg:text-2xl font-bold">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by client name, description, or place..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Filter by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="lastWeek">Last 7 Days</SelectItem>
            <SelectItem value="lastMonth">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Appointment Date</TableHead>
              <TableHead>Form Date</TableHead>
              <TableHead>Place</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {documents.length === 0 ? 'No completed forms found.' : 'No forms match your search criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{doc.appointment.client_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.appointment.appointment_date), 'PPP')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.signature_date), 'PPP')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.place || 'Not specified'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/appointments/${doc.appointment_id}/anamnesis`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Form
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                {documents.length === 0 ? 'No completed forms found.' : 'No forms match your search criteria.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <CardTitle className="text-lg">{doc.appointment.client_name}</CardTitle>
                  </div>
                  <Badge variant="outline">{doc.place || 'Not specified'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Appointment: {format(new Date(doc.appointment.appointment_date), 'PPP')}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  <span>Form: {format(new Date(doc.signature_date), 'PPP')}</span>
                </div>
                {doc.appointment.description && (
                  <p className="text-sm text-gray-600">{doc.appointment.description}</p>
                )}
                <div className="pt-2">
                  <Link href={`/appointments/${doc.appointment_id}/anamnesis`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      View Form
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredDocuments.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} forms
        </div>
      )}
    </div>
  );
} 