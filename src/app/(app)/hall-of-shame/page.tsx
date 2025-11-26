'use client';

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ThumbsDown, Crown, Pencil } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import type { HallEntry, User } from "@/lib/types";
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { EditRoastDialog } from "@/components/edit-roast-dialog";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";

export default function HallOfFameAndShamePage() {
    const firestore = useFirestore();
    const { appUser } = useAuth();
    const { toast } = useToast();
    
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection<User>(usersQuery);

    const hallOfShameQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'hallofshame'), orderBy('date', 'desc'), limit(50)) : null,
        [firestore]
    );
    const { data: hallEntries, isLoading: isLoadingEntries } = useCollection<HallEntry>(hallOfShameQuery);
    
    const isLoading = isLoadingUsers || isLoadingEntries;

    const fameEntries = hallEntries?.filter(item => item.type === 'fame') || [];
    const shameEntries = hallEntries?.filter(item => item.type === 'shame') || [];

    const getUser = (id: string) => users?.find(u => u.id === id);
    
    const formatDate = (date: Timestamp | Date | undefined | null) => {
        // Check if date is a Firestore Timestamp and has the toDate method
        if (date && typeof (date as any).toDate === 'function') {
            return formatDistanceToNow((date as Timestamp).toDate(), { addSuffix: true });
        }
        return null; // Return null or a placeholder if the date is not ready
    }

    // Edit functionality
    const [editingEntry, setEditingEntry] = useState<HallEntry | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const handleEditClick = (entry: HallEntry) => {
        setEditingEntry(entry);
        setIsEditDialogOpen(true);
    };

    const handleSaveRoast = async (newRoast: string) => {
        if (!editingEntry || !firestore) return;

        try {
            const entryRef = doc(firestore, 'hallofshame', editingEntry.id);
            await updateDoc(entryRef, { roast: newRoast });
            
            toast({
                title: "Roast Updated!",
                description: "Your roast has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating roast:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update the roast. Please try again.",
            });
        }
    };

    // Check if current user can edit an entry (must be the winner)
    const canEdit = (entry: HallEntry) => {
        return appUser && entry.winnerId && entry.winnerId === appUser.id;
    };

    // Dialog and audio playback for Dilsham's Hall of Fame entry
    const [showDilshamDialog, setShowDilshamDialog] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasPlayedRef = useRef(false);

    useEffect(() => {
        // Only run when data is loaded and audio hasn't been played yet
        if (!isLoading && fameEntries.length > 0 && users && !hasPlayedRef.current) {
            // Get the latest (first) Hall of Fame entry
            const latestFameEntry = fameEntries[0];
            
            // Get the user for this entry
            const entryUser = getUser(latestFameEntry.userId);
            
            // Check if the user's email matches Dilsham's email
            if (entryUser && entryUser.email === 'dilshamkp007@gmail.com') {
                // Show the dialog
                setShowDilshamDialog(true);
                
                // Play the special audio
                if (!audioRef.current) {
                    audioRef.current = new Audio('/dilsham_audio.mp3');
                }
                
                audioRef.current.play().catch(error => {
                    console.log('Audio playback failed:', error);
                    // Audio playback might fail due to browser autoplay policies
                });
                
                hasPlayedRef.current = true;
            }
        }
    }, [isLoading, fameEntries, users]);

    if (isLoading) {
        return (
             <div className="space-y-8">
                <PageHeader
                    title="Hall of Fame & Shame"
                    description="Where legends are born and egos are bruised."
                />
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12">
            <PageHeader
                title="Hall of Fame & Shame"
                description="Where legends are born and egos are bruised."
            />
            
            <div>
                <h2 className="font-headline text-4xl text-primary mb-4">Hall of Fame</h2>
                {fameEntries.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {fameEntries.map(entry => {
                            const user = getUser(entry.userId);
                            if (!user) return null;
                            const formattedDate = formatDate(entry.date);
                            return (
                                <Card key={entry.id} className="flex flex-col border-primary/50 hover:bg-primary/10 transition-colors">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="font-headline text-2xl text-primary">{entry.title}</CardTitle>
                                                <CardDescription>{entry.description}</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canEdit(entry) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(entry)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Crown className="h-8 w-8 text-primary/70 flex-shrink-0"/>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-card rounded-b-lg">
                                        <Avatar className="w-20 h-20 mb-4 border-4 border-primary">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-xl font-bold">{user.name}</h3>
                                        <p className="text-amber-400 font-bold text-lg">{entry.stat}</p>
                                        <blockquote className="mt-4 text-sm text-muted-foreground italic border-l-2 border-border pl-4">
                                            "{entry.roast}"
                                        </blockquote>
                                        {formattedDate && <p className="text-xs text-muted-foreground/50 mt-4">{formattedDate}</p>}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No legendary achievements recorded yet. Go make history!
                        </CardContent>
                    </Card>
                )}
            </div>

            <div>
                <h2 className="font-headline text-4xl text-destructive mb-4">Hall of Shame</h2>
                {shameEntries.length > 0 ? (
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {shameEntries.map(entry => {
                            const user = getUser(entry.userId);
                            if (!user) return null;
                            const formattedDate = formatDate(entry.date);
                            return (
                                <Card key={entry.id} className="flex flex-col border-destructive/50 hover:bg-destructive/10 transition-colors">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="font-headline text-2xl text-destructive">{entry.title}</CardTitle>
                                                <CardDescription>{entry.description}</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canEdit(entry) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEditClick(entry)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <ThumbsDown className="h-8 w-8 text-destructive/70 flex-shrink-0"/>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-card rounded-b-lg">
                                        <Avatar className="w-20 h-20 mb-4 border-4 border-destructive">
                                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-xl font-bold">{user.name}</h3>
                                        <p className="text-red-400 font-bold text-lg">{entry.stat}</p>
                                        <blockquote className="mt-4 text-sm text-muted-foreground italic border-l-2 border-border pl-4">
                                            "{entry.roast}"
                                        </blockquote>
                                        {formattedDate && <p className="text-xs text-muted-foreground/50 mt-4">{formattedDate}</p>}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                     <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            The Hall of Shame is currently empty. Everyone is playing nicely... for now.
                        </CardContent>
                    </Card>
                )}\n            </div>
            
            {/* Edit Roast Dialog */}
            {editingEntry && (
                <EditRoastDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    initialRoast={editingEntry.roast}
                    onSave={handleSaveRoast}
                    title={`Edit ${editingEntry.type === 'fame' ? 'Hall of Fame' : 'Hall of Shame'} Roast`}
                    description="Update the roast message below."
                />
            )}
            
            {/* Special Dialog for Dilsham's Hall of Fame */}
            <Dialog open={showDilshamDialog} onOpenChange={setShowDilshamDialog}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none">
                    <VisuallyHidden>
                        <DialogTitle>Dilsham Hall of Fame Celebration</DialogTitle>
                    </VisuallyHidden>
                    <div className="relative w-full aspect-video">
                        <Image 
                            src="/dilsham_image.png" 
                            alt="Dilsham Hall of Fame" 
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
