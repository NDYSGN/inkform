'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditStudioPage() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [style, setStyle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchStudio() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studio, error } = await supabase
          .from('studios')
          .select('name, address, style')
          .eq('user_id', user.id)
          .single();

        if (studio) {
          setName(studio.name);
          setAddress(studio.address || '');
          setStyle(studio.style || '');
        } else if (error) {
          setError('Failed to load studio data: ' + error.message);
        }
      }
      setInitialLoading(false);
    }
    fetchStudio();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('studios')
        .update({ name, address, style })
        .eq('user_id', user.id);

      if (error) {
        setError('Failed to update studio: ' + error.message);
      } else {
        router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-t-transparent"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
       <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Your Studio</CardTitle>
          <CardDescription>
            Update the information for your tattoo studio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Studio Name</Label>
              <Input
                id="name"
                placeholder="e.g., Electric Dream Tattoos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Anytown, USA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Main Style</Label>
              <Input
                id="style"
                placeholder="e.g., Fine line, Traditional, Blackwork"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
} 