'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  realName: z.string().min(2, { message: 'Real name must be at least 2 characters.' }),
  pesTeamName: z.string().min(2, { message: 'Team name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  avatar: z.any().optional(),
});

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      realName: '',
      pesTeamName: '',
      email: '',
      password: '',
    },
  });
  
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

        // Get the data-URL formatted string with specified quality (e.g., 0.7 for 70% quality)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setAvatarPreview(dataUrl);
        form.setValue('avatar', dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSignUp = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    await signUp({
      email: values.email,
      password_DO_NOT_STORE: values.password,
      name: values.name,
      realName: values.realName,
      pesTeamName: values.pesTeamName,
      avatarUrl: values.avatar || '',
    });
    // Loading state will be handled by the AuthProvider, which will navigate on success
    // If there's an error, loading will be set to false in the provider
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <h1 className="font-headline text-5xl text-primary drop-shadow-lg">
            Football Banter Barn
          </h1>
          <CardTitle className="font-headline text-3xl">Create an Account</CardTitle>
          <CardDescription>Join the barn and start the banter!</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignUp)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className='flex flex-col items-center'>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center relative overflow-hidden">
                        {avatarPreview ? (
                            <Image src={avatarPreview} alt="Avatar preview" layout="fill" objectFit="cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-muted-foreground" />
                        )}
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="w-6 h-6 text-white"/>
                        </label>
                         <input
                            id="avatar-upload"
                            type="file"
                            className="sr-only"
                            accept="image/png, image/jpeg"
                            onChange={handleAvatarChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="BanterKing99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="realName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Real Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pesTeamName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite PES Team</FormLabel>
                    <FormControl>
                      <Input placeholder="Manchester United" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="underline text-primary">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
