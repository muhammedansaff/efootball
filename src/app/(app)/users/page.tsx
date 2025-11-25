'use client';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Loader2 } from "lucide-react";

export default function UsersPage() {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('name')) : null, [firestore]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Users"
                description="Browse all the legends (and not-so-legends) of the Barn."
            />

            {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {users && users.map(user => (
                    <Card key={user.id}>
                        <CardContent className="p-6 flex flex-col items-center text-center">
                             <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold">{user.name}</h3>
                            <p className="text-muted-foreground">W: {user.stats.wins} / L: {user.stats.losses}</p>
                            <Link href={`/users/${user.id}`} passHref>
                                <Button variant="outline" className="mt-4">View Profile</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
