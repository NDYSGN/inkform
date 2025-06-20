'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, DollarSign, Mail, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createAppointmentAction } from '../actions';

export default function NewAppointmentPage() {
  const router = useRouter();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [depositPaid, setDepositPaid] = useState(false);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedDay) {
      setError('Please select a date.');
      setLoading(false);
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = new Date(selectedDay);
    appointmentDate.setHours(hours, minutes);

    const result = await createAppointmentAction({
      clientName,
      clientEmail,
      appointmentDate,
      description,
      price: price ? parseFloat(price) : undefined,
      deposit: deposit ? parseFloat(deposit) : undefined,
      depositPaid,
      addToCalendar,
      sendEmail,
    });

    setLoading(false);

    if (result.success) {
      router.push('/appointments');
    } else {
      setError(result.error || 'An unknown error occurred.');
    }
  };

  const timeOptions = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const remainingAmount = price && deposit ? parseFloat(price) - parseFloat(deposit) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Appointment</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                placeholder="e.g., Jane Doe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email (for notifications)</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="e.g., jane@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDay && 'text-muted-foreground'
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDay ? format(selectedDay, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDay}
                      onSelect={setSelectedDay}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <select
                  id="time"
                  className="w-full p-2 border rounded"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  disabled={loading}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tattoo Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Small rose on the wrist"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Total Price (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit Amount (€)</Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {price && deposit && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Price:</span>
                    <span>€{parseFloat(price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deposit:</span>
                    <span>€{parseFloat(deposit).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                    <span>Remaining:</span>
                    <span>€{remainingAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="depositPaid"
                checked={depositPaid}
                onCheckedChange={setDepositPaid}
                disabled={loading}
              />
              <Label htmlFor="depositPaid">Deposit has been paid</Label>
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="addToCalendar"
                checked={addToCalendar}
                onCheckedChange={setAddToCalendar}
                disabled={loading}
              />
              <Label htmlFor="addToCalendar">Add to Google Calendar</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="sendEmail"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                disabled={!clientEmail}
              />
              <Label htmlFor="sendEmail" className={!clientEmail ? 'text-gray-400' : ''}>
                Send confirmation email to client
              </Label>
            </div>
            
            {!clientEmail && sendEmail && (
              <p className="text-sm text-amber-600">
                Add client email to enable email notifications.
              </p>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>}

        <div className="flex justify-end pt-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Create Appointment'}
          </Button>
        </div>
      </form>
    </div>
  );
} 