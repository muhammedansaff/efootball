'use client';

import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Swords } from 'lucide-react';

export function SiteHeader() {
  const { appUser } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenNavTutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenNavTutorial', 'true');
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 md:hidden relative z-50">
        <div onClick={dismissTutorial}>
          <SidebarTrigger />
        </div>
        {showTutorial && (
          <div className="absolute top-12 left-0 w-64 bg-primary text-primary-foreground p-4 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 z-50 pointer-events-none">
            <div className="absolute -top-2 left-3 w-4 h-4 bg-primary rotate-45" />
            <p className="font-bold text-sm mb-1">New Navigation!</p>
            <p className="text-xs">Tap the book icon to open the menu and access Matches, Stats, and more.</p>
          </div>
        )}
      </div>
      {showTutorial && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={dismissTutorial} />}
      <div className="flex items-center justify-end gap-4">
        {/* Potentially add global search here in the future */}
        <div className="md:hidden">
           <Link href="/profile" passHref>
             <Button variant="ghost" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={appUser?.avatarUrl} alt={appUser?.name} />
                  <AvatarFallback>{appUser?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
             </Button>
           </Link>
        </div>
      </div>
    </header>
  );
}
