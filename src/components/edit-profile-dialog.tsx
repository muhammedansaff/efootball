'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Loader2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";
import { UploadButton } from "@/utils/uploadthing";

interface EditProfileDialogProps {
    user: User;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({ user, open, onOpenChange }: EditProfileDialogProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [name, setName] = useState(user.name);
    const [realName, setRealName] = useState(user.realName || '');
    const [pesTeamName, setPesTeamName] = useState(user.pesTeamName || '');
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!firestore) return;

        setIsSaving(true);
        try {
            // Update user document
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                name,
                realName,
                pesTeamName,
                avatarUrl,
            });

            toast({
                title: "Profile Updated!",
                description: "Your profile has been successfully updated.",
            });

            onOpenChange(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update your profile. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile information and avatar.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <Label>Profile Picture</Label>
                        <Avatar className="h-24 w-24 border-4 border-primary">
                            <AvatarImage src={avatarUrl} alt="Avatar preview" />
                            <AvatarFallback className="text-4xl">{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <UploadButton
                            endpoint="profileImage"
                            onClientUploadComplete={async (res) => {
                                if (!res?.[0]) return;
                                setAvatarUrl(res[0].url);
                                toast({
                                    title: "Avatar Uploaded!",
                                    description: "Your profile picture has been uploaded successfully.",
                                });
                            }}
                            onUploadError={(error: Error) => {
                                toast({
                                    variant: "destructive",
                                    title: "Upload Failed",
                                    description: error.message,
                                });
                            }}
                            appearance={{
                                button: "text-sm",
                            }}
                            content={{
                                button: "Change Avatar"
                            }}
                        />
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="BanterKing99"
                        />
                    </div>

                    {/* Real Name */}
                    <div className="space-y-2">
                        <Label htmlFor="realName">Real Name</Label>
                        <Input
                            id="realName"
                            value={realName}
                            onChange={(e) => setRealName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>

                    {/* PES Team Name */}
                    <div className="space-y-2">
                        <Label htmlFor="pesTeamName">Favorite PES Team</Label>
                        <Input
                            id="pesTeamName"
                            value={pesTeamName}
                            onChange={(e) => setPesTeamName(e.target.value)}
                            placeholder="Manchester United"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
