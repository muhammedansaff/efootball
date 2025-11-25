'use client';

import {
  Award,
  GitCommitHorizontal,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  ShieldHalf,
  Swords,
  Trophy,
  Users,
  LogOut,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { UploadMatchButton } from './upload-match-button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

const NavLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-md transition-colors text-xs w-16',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

const MoreMenu = () => {
  const { signOut } = useAuth();
  const moreLinks = [
    { href: '/users', icon: Users, label: 'Users' },
    { href: '/badges', icon: Award, label: 'Badges' },
    { href: '/rivals', icon: Swords, label: 'Rivals' },
    { href: '/journey', icon: GitCommitHorizontal, label: 'Journey' },
    { href: '/stats', icon: Target, label: 'Stats' },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center gap-1 p-2 rounded-md transition-colors text-xs w-16 text-muted-foreground hover:text-primary">
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 mb-2">
        <div className="grid gap-1">
          {moreLinks.map((link) => (
            <Link key={link.href} href={link.href} passHref>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <link.icon className="h-4 w-4 text-muted-foreground" />
                {link.label}
              </Button>
            </Link>
          ))}
           <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 text-muted-foreground" />
                Sign Out
              </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function BottomNavigation() {
  const mainLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/hall-of-shame', icon: ShieldHalf, label: 'Shame' },
    null, // Placeholder for Upload button
    { href: '/leaderboard', icon: Trophy, label: 'Leaders' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="relative flex h-20 items-center justify-around">
        {mainLinks.map((link, index) => {
          if (!link) {
            return (
              <div key="upload-button" className="relative -top-8">
                <UploadMatchButton />
              </div>
            );
          }
          return <NavLink key={index} {...link} />;
        })}
        <MoreMenu />
      </div>
    </div>
  );
}
