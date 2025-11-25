'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Swords } from 'lucide-react';

export function SiteHeader() {
  const { appUser } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Link href="/matches" passHref>
          <Button variant="ghost" size="icon">
            <Swords className="h-5 w-5" />
          </Button>
        </Link>
      </div>
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
