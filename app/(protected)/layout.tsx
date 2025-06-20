'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  FileText,
  Menu,
  X,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';

const navLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/appointments', icon: Calendar, label: 'Appointments' },
  { href: '/documents', icon: FileText, label: 'Documents' },
  { href: '/finance', icon: DollarSign, label: 'Finance' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasStudio, setHasStudio] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUserAndStudio() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
      
      // Check if user has a studio
      const { data: studio } = await supabase
        .from('studios')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!studio) {
        router.push('/onboarding');
        return;
      }
      
      setHasStudio(true);
      setLoading(false);
    }
    
    checkUserAndStudio();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !hasStudio) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-100 border-r transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b lg:border-b-0">
          <h1 className="text-xl lg:text-2xl font-bold">InkForm</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex flex-col space-y-2 p-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center space-x-2 text-gray-700 hover:bg-gray-200 p-2 rounded transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-lg font-semibold">InkForm</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}