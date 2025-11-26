'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface EditRoastDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialRoast: string;
    onSave: (newRoast: string) => Promise<void>;
    title: string;
    description?: string;
}

export function EditRoastDialog({ 
    open, 
    onOpenChange, 
    initialRoast, 
    onSave, 
    title,
    description = "Edit the roast message below."
}: EditRoastDialogProps) {
    const [roast, setRoast] = useState(initialRoast);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!roast.trim()) return;
        
        setIsSaving(true);
        try {
            await onSave(roast.trim());
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving roast:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                    <Textarea 
                        value={roast}
                        onChange={(e) => setRoast(e.target.value)}
                        placeholder="Enter your roast..."
                        className="min-h-[120px]"
                        disabled={isSaving}
                    />
                    
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave}
                            disabled={!roast.trim() || isSaving}
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
