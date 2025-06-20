'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Studio {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudio() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: studioData } = await supabase
          .from('studios')
          .select('id, name')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setStudio(studioData);
      }
      setLoading(false);
    }

    fetchStudio();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </div>

      {!studio && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to InkForm!</CardTitle>
            <CardDescription>
              You haven't set up your studio yet. Get started by creating one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/onboarding">
              <Button>Create Your Studio</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {studio && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {studio.name}! 👋</CardTitle>
            <CardDescription>
              Manage your studio and appointments from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link href="/onboarding/edit">
              <Button variant="outline">Edit Studio</Button>
            </Link>
            <Link href="/appointments">
              <Button>View Appointments</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}