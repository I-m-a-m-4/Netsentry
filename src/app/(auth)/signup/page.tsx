"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfileDocument, waitForUserProfile } from '@/firebase/users';
import { useAcademy } from '@/context/academy-context';
import Link from 'next/link';
import { Eye, EyeOff, Loader, ChevronLeft, Building, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppConfig } from '@/lib/config';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  phone: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const signupSlides = [
  {
    src: "/assets/login_cbt.png",
    alt: "A modern exam hall where students sit at laptop computers taking a computer based test (CBT).",
    title: "High-Fidelity CBT Engine",
    description: "Simulate real computer-based tests for UNILAG, UI, OAU, and more with smart AI topic analysis and offline capability."
  },
  {
    src: "/assets/login_syllabus.png",
    alt: "A student studying textbooks and a digital syllabus checklist tracker on a phone.",
    title: "Syllabus Tracker & Checker",
    description: "Track your coverage of official JAMB & WAEC syllabus outlines and summary novel checklists automatically."
  },
  {
    src: "/assets/login_news.png",
    alt: "A student checking real-time news on a smartphone showing notifications with official verified badges.",
    title: "Verified News Hub",
    description: "Avoid rumors. Get double-checked official updates and admission feeds directly from campus representatives."
  },
  {
    src: "/assets/login_mentorship.png",
    alt: "A student smiling during a 1-on-1 tutoring session with a mentor.",
    title: "Community & Mentorship",
    description: "Connect on real-time forums or schedule interactive 15-minute consultations with top student mentors."
  }
];

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { triggerRefresh } = useAcademy();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);

  const [invitationDetails, setInvitationDetails] = useState<{ businessName: string, role: string } | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const invitationCode = searchParams.get('invitationCode');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % signupSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', name: '', phone: '' },
  });

  useEffect(() => {
    if (invitationCode && firestore) {
      const fetchInvitation = async () => {
        setIsLoadingInvitation(true);
        const invRef = doc(firestore, 'invitations', invitationCode);
        try {
          const invSnap = await getDoc(invRef);
          if (invSnap.exists()) {
            const invData = invSnap.data();
            const businessRef = doc(firestore, 'businessInstances', invData.academyId);
            const businessSnap = await getDoc(businessRef);
            if (businessSnap.exists()) {
              setInvitationDetails({
                businessName: businessSnap.data().name,
                role: invData.role.replace('_', ' '),
              });
              form.setValue('email', invData.email);
            } else {
              throw new Error("Associated academy not found.");
            }
          } else {
            toast({ variant: "destructive", title: "Invalid Invitation", description: "This invitation link is either invalid or has already been used." });
            router.replace('/signup');
          }
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not retrieve invitation details." });
          router.replace('/signup');
        } finally {
          setIsLoadingInvitation(false);
        }
      };
      fetchInvitation();
    } else {
      setIsLoadingInvitation(false);
      const emailFromQuery = searchParams.get('email');
      if (emailFromQuery) {
        form.setValue('email', emailFromQuery);
      }
    }
  }, [invitationCode, firestore, router, form, toast]);

  const onSubmit = async (data: SignupFormValues) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCredential.user, { displayName: data.name });

      // Pass invitation code to the creation function
      await createUserProfileDocument(firestore, userCredential.user, data.name, data.phone, invitationCode);
      await waitForUserProfile(firestore, userCredential.user.uid);

      triggerRefresh();
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push(invitationCode ? '/cbt-simulator/select-subjects' : '/onboarding');

    } catch (error: any) {
      let description = "Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please log in instead.";
      } else {
        description = error.message;
      }
      toast({ variant: "destructive", title: "Signup Failed", description });
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center relative w-full">
        <div className="absolute top-8 left-4 sm:left-8">
          <Button variant="ghost" asChild>
            <Link href="/login">
              Already have an account?
            </Link>
          </Button>
        </div>
        <div className="mx-auto grid w-full max-w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src={AppConfig.logoUrl} alt="Pinnacle Academia Logo" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold">Create an account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your information to create your account
            </p>
          </div>

          {isLoadingInvitation ? (
            <div className="flex justify-center items-center h-24"><Loader className="animate-spin" /></div>
          ) : invitationDetails ? (
            <div className="p-4 rounded-lg border bg-primary/5 text-center">
              <div className="flex items-center justify-center gap-3">
                <Building className="h-5 w-5 text-primary" />
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You are joining <strong className="text-primary">{invitationDetails.businessName}</strong> as a <strong className="capitalize text-primary">{invitationDetails.role}</strong>.
              </p>
            </div>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Name</Label>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
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
                    <Label>Email</Label>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} disabled={!!invitationCode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <Label>Phone Number (Optional)</Label>
                    <FormControl>
                      <Input type="tel" placeholder="+2348012345678" {...field} />
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
                    <Label>Password</Label>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? 'text' : 'password'} {...field} />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || isLoadingInvitation}>
                {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : 'Create an account'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <Image
              src={signupSlides[currentSlide].src}
              alt={signupSlides[currentSlide].alt}
              width={1920}
              height={1080}
              quality={100}
              priority
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-12 left-12 right-12 p-0 bg-transparent z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <h2 className="text-white text-4xl font-bold font-headline leading-tight tracking-tight drop-shadow-lg">
                {signupSlides[currentSlide].title.split(" ").map((word, i) => (
                  <React.Fragment key={i}>
                    {word === "CBT" || word === "Syllabus" || word === "News" || word === "Mentorship" || word === "AI" ? <span className="text-primary italic"> {word} </span> : word + " "}
                  </React.Fragment>
                ))}
              </h2>
              <p className="text-white/90 mt-4 text-xl font-light leading-relaxed drop-shadow-md max-w-[600px]">
                {signupSlides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center gap-3">
            {signupSlides.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(255,165,0,0.5)]",
                  currentSlide === i ? "w-12 bg-primary" : "w-2 bg-white/30"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
