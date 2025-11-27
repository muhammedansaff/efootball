import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/main-sidebar';
import { SiteHeader } from '@/components/site-header';
import { BottomNavigation } from '@/components/bottom-navigation';
import { DilshamVictorySticker } from '@/components/dilsham-victory-sticker';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="md:block hidden">
        <MainSidebar />
      </div>
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-28 md:pb-0">{children}</main>
        <BottomNavigation />
      </SidebarInset>
      <DilshamVictorySticker />
    </SidebarProvider>
  );
}
