'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { Match, User } from '@/lib/types';
import Image from 'next/image';

export function DilshamVictorySticker() {
    const { appUser } = useAuth();
    const firestore = useFirestore();
    const [showSticker, setShowSticker] = useState(false);

    // Get all users to find Dilsham
    const usersQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, 'users')) : null, 
        [firestore]
    );
    const { data: users } = useCollection<User>(usersQuery);

    // Get user's latest match
    const latestMatchQuery = useMemoFirebase(() => 
        (appUser && firestore) 
            ? query(
                collection(firestore, 'matches'), 
                where('participants', 'array-contains', appUser.id), 
                orderBy('date', 'desc'), 
                limit(1)
            ) 
            : null,
        [firestore, appUser]
    );
    const { data: latestMatches } = useCollection<Match>(latestMatchQuery);

    useEffect(() => {
        if (!appUser || !users || !latestMatches || latestMatches.length === 0) {
            setShowSticker(false);
            return;
        }

        const latestMatch = latestMatches[0];
        
        // Find Dilsham by email
        const dilsham = users.find(u => u.email === 'dilshamkp007@gmail.com');
        
        if (!dilsham) {
            setShowSticker(false);
            return;
        }

        // Check if the latest match was against Dilsham and user lost
        const isAgainstDilsham = latestMatch.participants.includes(dilsham.id);
        const userLost = latestMatch.winnerId === dilsham.id;

        if (isAgainstDilsham && userLost) {
            setShowSticker(true);
        } else {
            setShowSticker(false);
        }
    }, [appUser, users, latestMatches]);

    if (!showSticker) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-bottom-right">
            <div className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl">
                <Image
                    src="/dilsham_sticker.png"
                    alt="Dilsham Victory"
                    fill
                    className="object-contain animate-bounce-slow"
                    priority
                />
            </div>
        </div>
    );
}
