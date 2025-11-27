'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Swords,
  Trophy,
  Users,
  LogOut,
  ShieldHalf,
  BarChart,
  GitCommitHorizontal,
  Award,
  Skull,
  TrendingUp,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const FootballIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="m15.24 8.76-1.88 4.3-4.3-1.88 1.88-4.3 4.3 1.88zm-5.32.75 2.12 2.12-2.12 2.12-2.12-2.12 2.12-2.12z"></path>
      <path d="M12 22a10 10 0 0 0 6.92-3.08"></path>
      <path d="M12 2a10 10 0 0 1 6.92 3.08"></path>
      <path d="M2 12a10 10 0 0 0 3.08 6.92"></path>
      <path d="M22 12a10 10 0 0 1-3.08 6.92"></path>
    </svg>
  );

export function MainSidebar() {
  const { appUser, signOut } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/matches', label: 'Matches', icon: Swords },
    { href: '/stats', label: 'Stats', icon: BarChart },
    { href: '/trends', label: 'Trends', icon: TrendingUp },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/losers', label: 'Hall of Losers', icon: Skull },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/badges', label: 'Badges', icon: Award },
    { href: '/rivals', label: 'Rivals', icon: Users },
    { href: '/journey', label: 'Journey', icon: GitCommitHorizontal },
    { href: '/profile', label: 'My Profile', icon: BarChart },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2">
            <FootballIcon />
            <h1 className="font-headline text-2xl text-primary tracking-wider">Banter Barn</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label }}
                  className='justify-start'
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        <div className="flex items-center justify-between p-2">
            <div className='flex items-center gap-2'>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={appUser?.avatarUrl} alt={appUser?.name} />
                    <AvatarFallback>{appUser?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">{appUser?.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="group-data-[collapsible=icon]:w-full">
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
