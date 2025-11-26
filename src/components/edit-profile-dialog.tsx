'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Loader2, Upload, User as UserIcon } from "lucide-react";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/types";
import Image from "next/image";
import { uploadAvatar } from "@/lib/upload-avatar";

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
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
    const [newAvatarData, setNewAvatarData] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const MAX_HEIGHT = 200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setAvatarPreview(dataUrl);
                setNewAvatarData(dataUrl);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!firestore) return;

        setIsSaving(true);
        try {
            let avatarUrl = user.avatarUrl;

            // Upload new avatar if changed
            if (newAvatarData) {
                toast({
                    title: "Uploading avatar...",
                    description: "Please wait while we upload your new profile picture.",
                });
                avatarUrl = await uploadAvatar(newAvatarData);
            }

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
                        <div className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {avatarPreview ? (
                                <Image src={avatarPreview} alt="Avatar preview" layout="fill" objectFit="cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-muted-foreground" />
                            )}
                            <label
                                htmlFor="avatar-upload-edit"
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <Upload className="w-6 h-6 text-white" />
                            </label>
                            <input
                                id="avatar-upload-edit"
                                type="file"
                                className="sr-only"
                                accept="image/png, image/jpeg"
                                onChange={handleAvatarChange}
                            />
                        </div>
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
