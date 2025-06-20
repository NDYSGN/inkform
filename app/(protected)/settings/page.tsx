'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Mail, Save } from 'lucide-react';

interface StudioSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email_notifications_enabled: boolean;
  calendar_integration_enabled: boolean;
  google_calendar_credentials: string | null;
  email_smtp_host: string | null;
  email_smtp_port: number | null;
  email_smtp_user: string | null;
  email_smtp_pass: string | null;
  email_from: string | null;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: studio, error } = await supabase
        .from('studios')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        setError('Failed to load settings: ' + error.message);
      } else {
        setSettings(studio);
      }
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setSuccess('');

    const { error } = await supabase
      .from('studios')
      .update({
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        email_notifications_enabled: settings.email_notifications_enabled,
        calendar_integration_enabled: settings.calendar_integration_enabled,
        google_calendar_credentials: settings.google_calendar_credentials,
        email_smtp_host: settings.email_smtp_host,
        email_smtp_port: settings.email_smtp_port,
        email_smtp_user: settings.email_smtp_user,
        email_smtp_pass: settings.email_smtp_pass,
        email_from: settings.email_from,
      })
      .eq('id', settings.id);

    if (error) {
      setError('Failed to save settings: ' + error.message);
    } else {
      setSuccess('Settings saved successfully!');
    }
    setSaving(false);
  };

  const updateSetting = (field: keyof StudioSettings, value: unknown) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-t-transparent"></div>
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center">No settings found.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-4 rounded mb-6">{error}</p>}
      {success && <p className="text-green-500 bg-green-100 p-4 rounded mb-6">{success}</p>}

      <div className="space-y-6">
        {/* Studio Information */}
        <Card>
          <CardHeader>
            <CardTitle>Studio Information</CardTitle>
            <CardDescription>Basic information about your tattoo studio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Studio Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => updateSetting('name', e.target.value)}
                placeholder="Your Studio Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address || ''}
                onChange={(e) => updateSetting('address', e.target.value)}
                placeholder="Studio address"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={settings.phone || ''}
                onChange={(e) => updateSetting('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>Configure email notifications for appointments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="emailNotifications"
                checked={settings.email_notifications_enabled || false}
                onCheckedChange={(checked) => updateSetting('email_notifications_enabled', checked)}
              />
              <Label htmlFor="emailNotifications">Enable email notifications</Label>
            </div>

            {settings.email_notifications_enabled && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email_smtp_host || ''}
                      onChange={(e) => updateSetting('email_smtp_host', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.email_smtp_port || ''}
                      onChange={(e) => updateSetting('email_smtp_port', parseInt(e.target.value) || null)}
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={settings.email_smtp_user || ''}
                      onChange={(e) => updateSetting('email_smtp_user', e.target.value)}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      value={settings.email_smtp_pass || ''}
                      onChange={(e) => updateSetting('email_smtp_pass', e.target.value)}
                      placeholder="Your email password or app password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailFrom">From Email Address</Label>
                  <Input
                    id="emailFrom"
                    type="email"
                    value={settings.email_from || ''}
                    onChange={(e) => updateSetting('email_from', e.target.value)}
                    placeholder="noreply@yourstudio.com"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar Integration
            </CardTitle>
            <CardDescription>Sync appointments with your Google Calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="calendarIntegration"
                checked={settings.calendar_integration_enabled || false}
                onCheckedChange={(checked) => updateSetting('calendar_integration_enabled', checked)}
              />
              <Label htmlFor="calendarIntegration">Enable Google Calendar integration</Label>
            </div>

            {settings.calendar_integration_enabled && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="calendarCredentials">Google Calendar Credentials (JSON)</Label>
                  <Textarea
                    id="calendarCredentials"
                    value={settings.google_calendar_credentials || ''}
                    onChange={(e) => updateSetting('google_calendar_credentials', e.target.value)}
                    placeholder="Paste your Google Calendar API credentials JSON here"
                    rows={6}
                  />
                  <p className="text-sm text-gray-600">
                    To get Google Calendar credentials, visit the{' '}
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Google Cloud Console
                    </a>
                    {' '}and create a service account with Calendar API access.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 