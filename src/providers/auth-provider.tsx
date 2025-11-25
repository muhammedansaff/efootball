'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  useUser,
  useAuthInstance,
  UserHookResult,
  useFirestore,
  useDoc,
  useMemoFirebase
} from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import type { User, Badge, Milestone } from '@/lib/types';
import { doc, setDoc, getDocs, collection, serverTimestamp, addDoc, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBadgeDescription } from '@/ai/flows/generate-badge-description';


// --- AI Badge Generation Logic ---
const badgeCreationJobs = [
    { name: "First Victory", criteria: "Get your first win", stat: "wins", value: 1, iconName: "Trophy" },
    { name: "Goal Scorer", criteria: "Score 10 goals", stat: "goalsFor", value: 10, iconName: "Zap" },
    { name: "The Participant", criteria: "Play 5 matches", stat: "matchesPlayed", value: 5, iconName: "Award" },
    { name: "Getting Started", criteria: "Play your first match", stat: "matchesPlayed", value: 1, iconName: "Footprints" },
    { name: "Tenacious Tackler", criteria: "Complete 20 tackles", stat: "tackles", value: 20, iconName: "Footprints" },
    { name: "Comeback Kid", criteria: "Win after being 1 goal down", stat: "comebacks", value: 1, iconName: "Crown" },
    { name: "Serial Winner", criteria: "Win 3 matches in a row", stat: "winStreak", value: 3, iconName: "Flame" },
    { name: "The Fortress", criteria: "Keep 1 clean sheet", stat: "cleanSheets", value: 1, iconName: "Shield" },
    // Loser Badges
    { name: "First Defeat", criteria: "Lose your first match", stat: "losses", value: 1, iconName: "HeartCrack" },
    { name: "Butter Fingers", criteria: "Concede 10 goals", stat: "goalsAgainst", value: 10, iconName: "Bot" },
    { name: "The Philanthropist", criteria: "Lose 5 matches", stat: "losses", value: 5, iconName: "ThumbsDown" },
    { name: "Tough Day at the Office", criteria: "Lose 3 matches in a row", stat: "lossStreak", value: 3, iconName: "Coffee" },
];

export async function manageBadges(firestore: any, forceCreate = false) {
    try {
        const badgesRef = collection(firestore, 'badges');
        const existingBadgesSnap = await getDocs(badgesRef);
        const existingBadgeNames = existingBadgesSnap.docs.map(d => d.data().name);

        const badgeJobsToRun = badgeCreationJobs
            .filter(job => !existingBadgeNames.includes(job.name))
            .slice(0, 2); // Get the next two available jobs

        if (badgeJobsToRun.length === 0) {
            console.log("All predefined badges have been created.");
            return;
        }
        
        if (forceCreate || existingBadgesSnap.docs.length < 5) {
             console.log(`Creating ${badgeJobsToRun.length} new badges...`);
            for (const job of badgeJobsToRun) {
                 const { description } = await generateBadgeDescription({
                    badgeName: job.name,
                    badgeCriteria: job.criteria,
                });

                const newBadge: Omit<Badge, 'id'> = {
                    name: job.name,
                    description: description,
                    iconName: job.iconName,
                    criteria: {
                        stat: job.stat as any,
                        value: job.value,
                    },
                    lastUpdated: serverTimestamp() as any
                };
                await addDoc(badgesRef, newBadge);
                console.log(`Successfully created new badge: ${newBadge.name}`);
            }
        }
    } catch(e) {
        console.error("Error managing badges:", e)
    }
}

// --- Dynamic Milestone Management ---
const milestoneCreationJobs = [
    { title: "First Win", description: "Get your first win in the barn.", stat: "wins", target: 1 },
    { title: "10 Wins", description: "Achieve 10 total wins.", stat: "wins", target: 10 },
    { title: "25 Wins", description: "Achieve 25 total wins.", stat: "wins", target: 25 },
    { title: "25 Goals", description: "Score 25 goals.", stat: "goalsFor", target: 25 },
    { title: "100 Goals", description: "Score a total of 100 goals.", stat: "goalsFor", target: 100 },
    { title: "50 Tackles", description: "Make 50 successful tackles.", stat: "tackles", target: 50 },
    { title: "10 Matches", description: "Play 10 matches.", stat: "matchesPlayed", target: 10 },
];

async function manageMilestones(firestore: any) {
    try {
        const milestonesRef = collection(firestore, 'milestones');
        const q = query(milestonesRef, orderBy('lastUpdated', 'desc'), limit(1));
        const lastMilestoneSnap = await getDocs(q);

        let shouldCreate = true;
        if (!lastMilestoneSnap.empty) {
            const lastMilestone = lastMilestoneSnap.docs[0].data();
            const lastUpdated = (lastMilestone.lastUpdated as Timestamp).toDate();
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Approx twice a week
            if (lastUpdated > threeDaysAgo) {
                shouldCreate = false;
            }
        }

        if (shouldCreate) {
            console.log("Time to create new milestones...");
            const existingMilestonesSnap = await getDocs(milestonesRef);
            const existingMilestoneTitles = existingMilestonesSnap.docs.map(d => d.data().title);

            const newJob = milestoneCreationJobs.find(job => !existingMilestoneTitles.includes(job.title));

            if (newJob) {
                const newMilestone: Omit<Milestone, 'id'> = {
                    ...newJob,
                    lastUpdated: serverTimestamp() as any,
                };
                await addDoc(milestonesRef, newMilestone);
                console.log(`Successfully created new milestone: ${newMilestone.title}`);
            } else {
                console.log("All predefined milestones have been created.");
            }
        }
    } catch (e) {
        console.error("Error managing milestones:", e);
    }
}


interface SignUpData {
  email: string;
  password_DO_NOT_STORE: string;
  name: string;
  realName: string;
  pesTeamName: string;
  avatarUrl: string;
}

interface AuthContextType extends UserHookResult {
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
  appUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user: firebaseUser, isUserLoading, userError } = useUser();
  const auth = useAuthInstance();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemoFirebase(() => 
    (firebaseUser && firestore) ? doc(firestore, 'users', firebaseUser.uid) : null,
    [firebaseUser, firestore]
  );
  
  const { data: appUser, isLoading: isAppUserLoading } = useDoc<User>(userRef);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (firestore) {
        manageBadges(firestore);
        manageMilestones(firestore);
    }
  }, [firestore])


  useEffect(() => {
    const overallLoading = isUserLoading || (firebaseUser && isAppUserLoading);
    setLoading(overallLoading);

    if (overallLoading) return;
    
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (!firebaseUser && !isAuthPage) {
      router.push('/login');
    } else if (firebaseUser && isAuthPage) {
      router.push('/dashboard');
    }
  }, [firebaseUser, isAppUserLoading, isUserLoading, pathname, router]);


  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Let the useEffects handle redirection and user loading
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Please check your credentials and try again.',
      });
      setLoading(false); // Only stop loading on error
    }
  };
  
  const signUp = async (data: SignUpData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password_DO_NOT_STORE);
      const fbUser = userCredential.user;

      await updateProfile(fbUser, { displayName: data.name });
      
      // Store avatar in local storage
      if (data.avatarUrl) {
          localStorage.setItem(`avatar-${fbUser.uid}`, data.avatarUrl);
      }

      const newUser: Omit<User, 'id'> = {
        name: data.name,
        realName: data.realName,
        pesTeamName: data.pesTeamName,
        email: data.email,
        avatarUrl: data.avatarUrl,
        badges: [],
        stats: { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, shots: 0, shotsOnTarget: 0, passes: 0, successfulPasses: 0, tackles: 0, saves: 0, redCards: 0, },
      };

      await setDoc(doc(firestore, 'users', fbUser.uid), newUser);
      
      // Don't call setAppUser here, let the onAuthStateChanged listener and useDoc handle it
      
    } catch (error: any) {
       console.error('Sign-up error:', error);
       toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
      setLoading(false); // Stop loading on error
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // Clear all local avatars on sign out
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('avatar-')) {
          localStorage.removeItem(key);
        }
      });
      router.push('/login');
    } catch (error) {
      console.error('Sign-out error:', error);
    } finally {
      // The useEffect will handle setting loading to false once user is null
    }
  };

  if (loading) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const value = {
    user: firebaseUser,
    isUserLoading,
    userError,
    loading: loading,
    signIn,
    signOut,
    signUp,
    appUser: appUser || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
