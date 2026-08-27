'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAcademy } from '@/context/academy-context';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft, GraduationCap, Target, BookOpen, School, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const onboardingSchema = z.object({
  studentName: z.string().min(3, 'Student name must be at least 3 characters.'),
  targetUTMEScore: z.coerce.number().min(0, 'Score must be at least 0.').max(40, 'Score cannot exceed 40.'),
  targetInstitution: z.string().min(3, 'Target Institution is required.'),
  targetCourse: z.string().min(3, 'Target Course is required.'),
  department: z.string().min(1, 'Please select a department.'),
  subject1: z.string().min(1, 'Subject 1 is required.'),
  subject2: z.string().min(1, 'Subject 2 is required.'),
  subject3: z.string().min(1, 'Subject 3 is required.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const departments = [
  'Science', 'Art', 'Commercial', 'Social Science'
];

const nigerianUniversities = [
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'Obafemi Awolowo University (OAU)',
  'University of Benin (UNIBEN)',
  'University of Nigeria, Nsukka (UNN)',
  'Ahmadu Bello University (ABU)',
  'Lagos State University (LASU)',
  'Federal University of Technology, Akure (FUTA)',
  'Federal University of Technology, Minna (FUTMINNA)',
  'University of Ilorin (UNILORIN)',
  'Other'
];

const targetCourses = [
  'Medicine & Surgery',
  'Computer Science',
  'Law',
  'Nursing Science',
  'Electrical & Electronic Engineering',
  'Mechanical Engineering',
  'Pharmacy',
  'Accounting',
  'Economics',
  'Other'
];

const utmeSubjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Literature in English', 'Government', 
  'History', 'Economics', 'Geography', 'Agricultural Science', 'Christian Religious Studies (CRS)', 
  'Islamic Religious Studies (IRS)', 'Commerce', 'Financial Accounting', 'Yoruba', 'Igbo', 'Hausa', 'Arabic'
];

const steps = [
  { name: 'Target Goals', icon: Target, fields: ['studentName', 'targetUTMEScore', 'department'] },
  { name: 'Aspirations', icon: School, fields: ['targetInstitution', 'targetCourse'] },
  { name: 'Syllabus Setup', icon: BookOpen, fields: ['subject1', 'subject2', 'subject3'] },
];

const OnboardingStepper = ({ currentStep }: { currentStep: number }) => (
  <nav aria-label="Progress" className="w-full max-w-lg mx-auto mb-8">
    <ol role="list" className="flex items-center">
      {steps.map((step, stepIdx) => (
        <li key={step.name} className={cn("relative", stepIdx !== steps.length - 1 ? "flex-1" : "")}>
          {stepIdx < currentStep - 1 ? (
            <>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-0.5 w-full bg-primary" />
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-300">
                <step.icon className="h-5 w-5" />
              </div>
            </>
          ) : stepIdx === currentStep - 1 ? (
            <>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-px w-full border-t-2 border-dashed border-border" />
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-background ring-4 ring-primary/20 transition-all duration-300">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="absolute -bottom-7 text-xs text-primary font-semibold left-1/2 -translate-x-1/2 whitespace-nowrap">{step.name}</p>
            </>
          ) : (
            <>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-px w-full border-t-2 border-dashed border-border" />
              </div>
              <div className="group relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-background transition-all duration-300">
                <step.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="absolute -bottom-7 text-xs text-muted-foreground left-1/2 -translate-x-1/2 whitespace-nowrap">{step.name}</p>
            </>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { academy, currentUserProfile, triggerRefresh, user } = useAcademy();

  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [otherUni, setOtherUni] = React.useState(false);
  const [otherCourse, setOtherCourse] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      studentName: currentUserProfile?.name || '',
      targetUTMEScore: 25,
      targetInstitution: 'Obafemi Awolowo University (OAU)',
      targetCourse: '',
      department: '',
      subject1: '',
      subject2: '',
      subject3: '',
    },
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    const authUser = getAuth().currentUser || user;
    let bId = currentUserProfile?.academyId || (currentUserProfile as any)?.businessId || academy?.id;
    const isNewAcademy = !bId;

    if (!authUser) {
      toast({ 
        variant: 'destructive', 
        title: 'Session Error', 
        description: 'Your session has expired. Please log in again.' 
      });
      return;
    }

    if (isNewAcademy) {
      bId = doc(collection(firestore, 'businessInstances')).id;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      
      // 1. Update or Create Student Study Business Instance name & setup
      const businessDocRef = doc(firestore, 'businessInstances', bId);
      if (isNewAcademy) {
        const { add } = await import('date-fns');
        const trialEndDate = add(new Date(), { days: 30 });
        batch.set(businessDocRef, {
          name: `${data.studentName}'s Pinnacle Portal`,
          createdAt: serverTimestamp(),
          ownerId: authUser.uid,
          plan: 'starter',
          trialExpiresAt: trialEndDate,
          status: 'active',
          settings: {
            currency: 'Qs',
            timezone: 'Africa/Lagos',
            defaultTaxRate: 0,
            productCategories: [data.department],
            state: 'Lagos',
            country: 'Nigeria'
          }
        });
      } else {
        batch.set(businessDocRef, {
          name: `${data.studentName}'s Pinnacle Portal`,
          settings: {
            currency: 'Qs',
            productCategories: [data.department],
            state: 'Lagos',
            country: 'Nigeria',
          }
        }, { merge: true });
      }

      // 2. Update Student User Profile with specific academic goals
      const userDocRef = doc(firestore, 'users', authUser.uid);
      const userUpdates: any = {
        name: data.studentName,
        surveyCompleted: true,
        targetUTMEScore: Number(data.targetUTMEScore),
        targetInstitution: data.targetInstitution,
        targetCourse: data.targetCourse,
        department: data.department,
        utmeSubjects: ['English Language', data.subject1, data.subject2, data.subject3],
      };
      if (isNewAcademy) {
        userUpdates.academyId = bId;
        userUpdates.businessId = bId; // set both for safety in security rules
      }
      batch.update(userDocRef, userUpdates);

      // 3. Create Welcome Notification
      const notifRef = doc(collection(firestore, `users/${authUser.uid}/notifications`));
      batch.set(notifRef, {
          title: "Welcome to Pinnacle Academia! 🎓",
          body: `Hi ${data.studentName.split(' ')[0]}, your study dashboard is ready. Let's aim for that ${data.targetUTMEScore} OAU Post UTME score!`,
          createdAt: serverTimestamp(),
          read: false,
          type: 'system',
          clickable: false
      });

      await batch.commit();

      // Trigger a local context refresh
      triggerRefresh();

      // Small delay to allow the auth/profile listener to pick up the changes
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({ variant: 'success', title: 'Setup Complete!', description: 'Welcome to Pinnacle Academia.' });
      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding submission error:', error);
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not save your preferences. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    const fieldsToValidate = steps[step - 1].fields as (keyof OnboardingFormValues)[];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  if (!mounted || !currentUserProfile) {
    return <div className="flex suppress-hydration-warning justify-center items-center h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="onboarding-bg flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 bg-gradient-to-br from-background via-card/50 to-primary/5">
      <div className="w-full suppress-hydration-warning max-w-3xl space-y-12">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2 border border-primary/20">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">Set Up Your Study space, {(currentUserProfile?.name || '').split(' ')[0] || 'Student'}</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Configure your academic profile to calibrate our computer-based test simulator and smart syllabus tracker.
          </p>
        </div>

        <OnboardingStepper currentStep={step} />

        <Card className="shadow-xl border-[0.5px] border-border/40 bg-card/40 backdrop-blur-md rounded-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {step === 1 && (
                <CardContent className="pt-6 space-y-6">
                  <CardTitle className="flex items-center gap-3 text-2xl font-bold"><Target className="text-primary h-6 w-6" /> Target Goals</CardTitle>
                  <p className="text-sm text-muted-foreground">Specify your target goals to customize performance analytics tracking.</p>
                  
                  <FormField control={form.control} name="studentName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your Name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="targetUTMEScore" render={({ field }) => (
                      <FormItem><FormLabel>Target OAU Post UTME Score (40 Max)</FormLabel><FormControl><Input type="number" min="0" max="40" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem><FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger></FormControl>
                          <SelectContent>{departments.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              )}
              {step === 2 && (
                <CardContent className="pt-6 space-y-6">
                  <CardTitle className="flex items-center gap-3"><School className="text-primary" /> Institutions & Aspiration</CardTitle>
                  <p className="text-sm text-muted-foreground">Select your dream institution and course to compute aggregate score requirements.</p>
                  
                  <FormField control={form.control} name="targetInstitution" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Institution (e.g. UNILAG, UI, OAU)</FormLabel>
                      {!otherUni ? (
                        <Select
                          onValueChange={(val) => {
                            if (val === 'Other') {
                              setOtherUni(true);
                              field.onChange('');
                            } else {
                              field.onChange(val);
                            }
                          }}
                          value={nigerianUniversities.includes(field.value) ? field.value : (field.value ? 'Other' : '')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Target University" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {nigerianUniversities.map(uni => (
                              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Type your target university" {...field} />
                          </FormControl>
                          <Button type="button" variant="outline" onClick={() => {
                            setOtherUni(false);
                            field.onChange('');
                          }}>Select List</Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="targetCourse" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Course (e.g. Medicine, Law, Engineering)</FormLabel>
                      {!otherCourse ? (
                        <Select
                          onValueChange={(val) => {
                            if (val === 'Other') {
                              setOtherCourse(true);
                              field.onChange('');
                            } else {
                              field.onChange(val);
                            }
                          }}
                          value={targetCourses.includes(field.value) ? field.value : (field.value ? 'Other' : '')}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Target Course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {targetCourses.map(course => (
                              <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Type your target course" {...field} />
                          </FormControl>
                          <Button type="button" variant="outline" onClick={() => {
                            setOtherCourse(false);
                            field.onChange('');
                          }}>Select List</Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
              )}
              {step === 3 && (
                <CardContent className="pt-6 space-y-6">
                  <CardTitle className="flex items-center gap-3"><BookOpen className="text-primary" /> OAU Post UTME Subject Combination</CardTitle>
                  <p className="text-sm text-muted-foreground">Select your OAU Post UTME subject combination. <strong>English Language</strong> is selected by default.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="subject1" render={({ field }) => (
                      <FormItem><FormLabel>Subject 1</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {utmeSubjects.map(sub => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="subject2" render={({ field }) => (
                      <FormItem><FormLabel>Subject 2</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {utmeSubjects.map(sub => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="subject3" render={({ field }) => (
                      <FormItem><FormLabel>Subject 3</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {utmeSubjects.map(sub => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="text-xs text-muted-foreground p-3 bg-muted/40 rounded-lg flex items-start gap-2 border border-border/50">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong>Compulsory selection:</strong> English Language is automatically added as your 4th OAU Post UTME subject combination.
                    </div>
                  </div>
                </CardContent>
              )}
              <CardContent className="flex justify-between mt-6">
                {step > 1 ? (<Button type="button" variant="outline" onClick={handlePrevStep}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>) : (<div />)}
                {step < steps.length ? (<Button type="button" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish Setup
                  </Button>)}
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
