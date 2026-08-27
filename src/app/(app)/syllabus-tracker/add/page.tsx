'use client';

import * as React from 'react';
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronLeft,
  Upload,
  CalendarIcon,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash, CheckCircle2, BookOpen } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useAcademy } from '@/context/academy-context';
import { logAuditEvent } from '@/lib/audit';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { BarcodeScanner } from '@/components/syllabus-tracker/barcode-scanner';

import { Combobox } from '@/components/ui/combobox';
const productSchema = z.object({
  name: z.string().min(3, "Subject name must be at least 3 characters."),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price is required and must be greater than 0."),
  costPrice: z.coerce.number().optional(),
  stock: z.coerce.number().int("Stock must be a whole number.").optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  expiryDate: z.date().optional(),
  categoryType: z.enum(['product', 'service']).default('product'),

  // Advanced Features
  type: z.enum(['single', 'variant', 'composite']).default('single'),
  baseUnit: z.string().optional(),
  uomConversions: z.array(z.object({
    unitName: z.string().min(1, "Unit name required"),
    multiplier: z.coerce.number().min(1, "Multiplier must be at least 1"),
    price: z.coerce.number().optional()
  })).optional(),
  components: z.array(z.object({
    subjectId: z.string().min(1, "Subject required"),
    quantity: z.coerce.number().min(1, "Quantity required")
  })).optional(),
  tutorName: z.string().optional(),
  tutorEmail: z.string().optional(),
  tutorBio: z.string().optional(),
  modules: z.array(z.object({
    title: z.string().min(1, "Module title is required"),
    topics: z.array(z.object({
      id: z.string(),
      title: z.string().min(1, "Topic title is required")
    }))
  })).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const PRODUCT_LIMITS = {
  starter: 500,
  pro: 1500,
  academy: Infinity,
};

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { academy, subjects, currentUserProfile, isLoading, addToQueue, addProductWithImage } = useAcademy();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const isSubmitting = React.useRef(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const [expiryDateInput, setExpiryDateInput] = React.useState("");
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isTauri, setIsTauri] = React.useState(false);

  React.useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__);
  }, []);

  const userProfile = currentUserProfile;

  React.useEffect(() => {
    if (userProfile) {
      const hasPermission = userProfile.permissions?.manage_inventory ?? (userProfile.role === 'admin' || userProfile.role === 'manager');
      if (!hasPermission) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to add subjects.' });
        router.push('/syllabus-tracker');
      }
    }
  }, [userProfile, router, toast]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      costPrice: undefined,
      stock: undefined,
      sku: "",
      category: "",
      expiryDate: undefined,
      categoryType: "product",
      type: "single",
      baseUnit: "Piece",
      uomConversions: [],
      components: [],
      tutorName: "",
      tutorEmail: "",
      tutorBio: "",
      modules: [],
    },
  });

  const { fields: uomFields, append: appendUom, remove: removeUom } = useFieldArray({
    control: form.control,
    name: "uomConversions"
  });

  const { fields: componentFields, append: appendComponent, remove: removeComponent } = useFieldArray({
    control: form.control,
    name: "components"
  });

  const productType = form.watch("type");
  const categoryType = form.watch("categoryType");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleNativeImageUpload = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readFile } = await import('@tauri-apps/plugin-fs');
      
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'webp']
        }]
      });

      if (selected && !Array.isArray(selected)) {
        const fileData = await readFile(selected);
        const fileName = selected.split(/[\\/]/).pop() || 'product.png';
        const ext = fileName.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        
        const blob = new Blob([fileData], { type: mimeType });
        const file = new File([blob], fileName, { type: mimeType });
        processImageFile(file);
      }
    } catch (err) {
      console.error('Native upload failed:', err);
    }
  };

  const processImageFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'Image Too Large',
        description: 'Please select an image smaller than 5MB.',
      });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper to parse date string DD/MM/YY or DD/MM/YYYY
  const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return undefined;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    let year = parseInt(parts[2], 10);

    // Handle 2 digit year
    if (year < 100) {
      year += 2000;
    }

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return undefined;
    return date;
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (isSaving || isSubmitting.current) return;
    isSubmitting.current = true;
    setIsSaving(true);

    if (!userProfile || !firestore || !academy || !subjects) {
      toast({ variant: 'destructive', title: 'Error', description: 'Session data not found. Please refresh.' });
      isSubmitting.current = false;
      setIsSaving(false);
      return;
    }

    const hasInventoryPermission = userProfile.permissions?.manage_inventory ?? (userProfile.role === 'admin' || userProfile.role === 'manager');
    if (!hasInventoryPermission) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to add subjects.' });
      isSubmitting.current = false;
      setIsSaving(false);
      router.push('/syllabus-tracker');
      return;
    }

    const currentPlan = academy.plan || 'starter';
    const limit = PRODUCT_LIMITS[currentPlan as keyof typeof PRODUCT_LIMITS] || 500;

    if (limit !== Infinity && subjects.length >= limit) {
      toast({
        variant: 'destructive',
        title: 'Subject Limit Reached',
        description: `You have reached your limit of ${limit} subjects for the ${currentPlan} plan. Please upgrade to add more.`,
      });
      isSubmitting.current = false;
      setIsSaving(false);
      return;
    }

    // Optimistic Add via Context (handles background upload)
    try {
      // Parse expiry date manually if provided
      if (expiryDateInput) {
        const parsedDate = parseDateString(expiryDateInput);
        if (parsedDate) {
          values.expiryDate = parsedDate;
        } else {
          toast({ variant: "destructive", title: "Invalid Date", description: "Please use DD/MM/YY format." });
          isSubmitting.current = false;
          setIsSaving(false);
          return;
        }
      }

      // 1. Prepare data
      const newProductId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

      const dataToSave = {
        ...values,
        id: newProductId,
        academyId: userProfile.academyId,
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(Object.entries(dataToSave).filter(([_, v]) => v !== undefined));

      // 2. Call context function (Fast/Sync initial queueing)
      addProductWithImage({
        ...cleanData,
        stock: cleanData.stock ?? 0,
      }, imageFile);

      // 3. Log Audit Event (Non-blocking)
      logAuditEvent(firestore, academy.id, userProfile, {
        action: 'product.create',
        entity: { type: 'Subject', id: newProductId, name: values.name },
        details: { price: values.price, stock: values.stock || 0, sku: values.sku }
      }).catch(err => console.warn("Audit log background failed:", err));

      // 4. Navigate immediately
      toast({ title: 'Subject Added', description: `${values.name} has been added successfully.` });
      
      // Ensure we release loading states immediately so the button isn't stuck if transition has small lag
      isSubmitting.current = false;
      setIsSaving(false);

      router.push('/syllabus-tracker');

    } catch (error: any) {
      console.error("Failed to prepare product:", error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || "Could not save the product." });
      isSubmitting.current = false;
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid flex-1 auto-rows-max gap-4 w-full max-w-full px-1.5 sm:px-0 overflow-x-hidden">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/syllabus-tracker">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="flex-1 min-w-0 text-xl font-semibold tracking-tight break-words leading-normal md:leading-relaxed">
            Add New {categoryType === 'service' ? 'Service' : 'Subject'}
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="default" type="button" onClick={() => router.push('/syllabus-tracker')}>
              Discard
            </Button>
            <Button size="default" type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {categoryType === 'service' ? 'Service' : 'Subject'}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{categoryType === 'service' ? 'Service' : 'Subject'} Details</CardTitle>
                <CardDescription>
                  Provide the core details for your new {categoryType === 'service' ? 'service' : 'subject'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Quantum HD Monitor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A detailed description of the product." className="min-h-32" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {categoryType === 'product' && (
              <Card>
                <CardHeader>
                  <CardTitle>Syllabus Configuration</CardTitle>
                  <CardDescription>Configure subject details and component dependencies.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Subject Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row gap-4"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="single" />
                              </FormControl>
                              <FormLabel className="font-normal">Standard Item</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="composite" />
                              </FormControl>
                              <FormLabel className="font-normal">Composite (Bundle)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          {productType === 'composite' ? "This item is built from other subjects. Stock is automatically managed." : "Standard individual product with its own stock."}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Academic Units (UoM)</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={() => appendUom({ unitName: "", multiplier: 1 })}>
                        <Plus className="h-4 w-4 mr-2" /> Add Study Unit
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="baseUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Base Study Unit</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Course, Term" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {uomFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 border rounded-lg bg-muted/30">
                        <FormField
                          control={form.control}
                          name={`uomConversions.${index}.unitName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Unit Name</FormLabel>
                              <FormControl><Input placeholder="e.g. Carton" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`uomConversions.${index}.multiplier`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Contains (multiplier)</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <FormField
                            control={form.control}
                            name={`uomConversions.${index}.price`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Price (Opt.)</FormLabel>
                                <FormControl><Input type="number" placeholder="Override" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeUom(index)} className="text-destructive"><Trash className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {productType === 'composite' && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel>Course Bundle Components</FormLabel>
                          <Button type="button" variant="outline" size="sm" onClick={() => appendComponent({ subjectId: "", quantity: 1 })}>
                            <Plus className="h-4 w-4 mr-2" /> Add Component
                          </Button>
                        </div>
                        <FormDescription>Select subjects that make up this course bundle.</FormDescription>

                        {componentFields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-3 border rounded-lg bg-muted/30">
                            <FormField
                              control={form.control}
                              name={`components.${index}.subjectId`}
                              render={({ field }) => (
                                <FormItem className="sm:col-span-3">
                                  <FormLabel className="text-xs">Subject</FormLabel>
                                  <FormControl>
                                    <Combobox
                                      options={subjects?.filter(p => !p.type || p.type === 'single').map(p => ({
                                        label: `${p.name} (Stock: ${p.stock})`,
                                        value: p.id
                                      })) || []}
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      placeholder="Select component"
                                      searchPlaceholder="Search subjects..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`components.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Qty</FormLabel>
                                  <FormControl><Input type="number" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(index)} className="text-destructive"><Trash className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {categoryType === 'product' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Assigned Instructor Profile</CardTitle>
                    <CardDescription>Configure tutor information for this subject. This will be shown on the student's dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="tutorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instructor Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Dr. Arthur Pendelton" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tutorEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instructor Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="e.g. tutor@pinnacle.edu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="tutorBio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor Biography</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief biography and credentials..." className="min-h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Academic Syllabus Outline</CardTitle>
                      <CardDescription>Design modules and nested learning topics for the curriculum.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentModules = form.getValues("modules") || [];
                        form.setValue("modules", [
                          ...currentModules,
                          { title: `Module ${currentModules.length + 1}: New Module`, topics: [] }
                        ], { shouldDirty: true, shouldValidate: true });
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Module
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SyllabusModulesBuilder control={form.control} form={form} disabled={false} />
                  </CardContent>
                </Card>
              </>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Tuition & Seat Capacity</CardTitle>
                <CardDescription>
                  Manage {categoryType === 'service' ? 'tuition details for this academic service' : 'tuition fees and student seat capacity for this subject'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
                  {categoryType === 'product' && (
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject Code (SKU)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="MTH-101" {...field} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setIsScannerOpen(true)}
                              className="shrink-0"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormDescription>
                            This unique code identifies the subject. <Link href="/support#how-barcodes-work" className="text-primary underline">Learn more</Link>.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {categoryType === 'product' && (
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Capacity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="40" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tuition Fee</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="15000" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operational Cost</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="5000" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {categoryType === 'product' && (
                  <div className="mt-6">
                    <div className="space-y-2">
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DD/MM/YY"
                          value={expiryDateInput}
                          onChange={(e) => setExpiryDateInput(e.target.value)}
                          maxLength={10}
                        />
                      </FormControl>
                      <p className="text-[0.8rem] text-muted-foreground">Format: DD/MM/YY or DD/MM/YYYY</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{categoryType === 'service' ? 'Service' : 'Subject'} Category</CardTitle>
                <div className="mt-4 space-y-4 px-2">
                  <FormField
                    control={form.control}
                    name="categoryType"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs">Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="product" />
                              </FormControl>
                              <FormLabel className="font-normal text-xs">Subject</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="service" />
                              </FormControl>
                              <FormLabel className="font-normal text-xs">Service</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academy?.settings?.productCategories && academy.settings.productCategories.length > 0 ? (
                            academy.settings.productCategories.map((cat: string) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No categories defined.
                              <Button variant="link" asChild className="p-0 h-auto ml-1">
                                <Link href="/settings">Create one now</Link>
                              </Button>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>{categoryType === 'service' ? 'Service' : 'Subject'} Image</CardTitle>
                <CardDescription>
                  Upload an image (max 5MB) for your {categoryType === 'service' ? 'service' : 'subject'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div 
                    className="w-full aspect-square rounded-md border-2 border-dashed border-muted-foreground/50 flex items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors"
                    onClick={() => isTauri && handleNativeImageUpload()}
                  >
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Subject preview" fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload className="mx-auto h-8 w-8" />
                        <p className="mt-2 text-sm">Click to upload</p>
                      </div>
                    )}
                    {!isTauri && (
                      <Input
                        id="file-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleImageChange}
                      />
                    )}
                    {isTauri && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                        <span className="text-white text-xs font-bold">Pick Image</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 w-full px-4 md:hidden">
          <Button variant="outline" size="default" type="button" onClick={() => router.push('/syllabus-tracker')}>
            Discard
          </Button>
          <Button size="default" type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save {categoryType === 'service' ? 'Service' : 'Subject'}
          </Button>
        </div>
      </form>
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          form.setValue('sku', code);
          setIsScannerOpen(false);
          toast({
            title: "Barcode Scanned",
            description: `SKU set to: ${code}`,
          });
        }}
      />
    </Form>
  );
}

function SyllabusModulesBuilder({ control, form, disabled }: { control: any; form: any; disabled: boolean }) {
  const modules = form.watch("modules") || [];

  const updateModuleTitle = (mIdx: number, val: string) => {
    const current = [...modules];
    current[mIdx].title = val;
    form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
  };

  const removeModule = (mIdx: number) => {
    const current = modules.filter((_: any, idx: number) => idx !== mIdx);
    form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
  };

  const addTopic = (mIdx: number) => {
    const current = [...modules];
    const topics = current[mIdx].topics || [];
    current[mIdx].topics = [
      ...topics,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        title: `Topic ${topics.length + 1}`
      }
    ];
    form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
  };

  const updateTopicTitle = (mIdx: number, tIdx: number, val: string) => {
    const current = [...modules];
    current[mIdx].topics[tIdx].title = val;
    form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
  };

  const removeTopic = (mIdx: number, tIdx: number) => {
    const current = [...modules];
    current[mIdx].topics = current[mIdx].topics.filter((_: any, idx: number) => idx !== tIdx);
    form.setValue("modules", current, { shouldDirty: true, shouldValidate: true });
  };

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
        <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">No syllabus modules defined</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Click "Add Module" to start structuring the subject learning path.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modules.map((mod: any, mIdx: number) => (
        <div key={mIdx} className="border rounded-lg p-4 bg-muted/10 space-y-4 relative hover:border-primary/20 transition-colors animate-in fade-in-50">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 text-center shrink-0">
              Module {mIdx + 1}
            </span>
            <Input
              placeholder="Module Title"
              value={mod.title}
              onChange={(e) => updateModuleTitle(mIdx, e.target.value)}
              disabled={disabled}
              className="font-medium flex-1 h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive h-8 w-8 hover:bg-destructive/10 shrink-0"
              onClick={() => removeModule(mIdx)}
              disabled={disabled}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>

          <div className="pl-4 border-l-2 border-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Topics Checklist ({mod.topics?.length || 0})</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => addTopic(mIdx)}
                disabled={disabled}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Topic
              </Button>
            </div>

            {mod.topics?.length === 0 ? (
              <p className="text-xs text-muted-foreground/70 italic py-2">No topics added to this module yet.</p>
            ) : (
              <div className="space-y-2">
                {mod.topics.map((topic: any, tIdx: number) => (
                  <div key={topic.id || tIdx} className="flex items-center gap-2 animate-in fade-in-50">
                    <span className="text-xs font-mono text-muted-foreground/60 shrink-0 w-8">{mIdx + 1}.{tIdx + 1}</span>
                    <Input
                      placeholder="Topic Title"
                      value={topic.title}
                      onChange={(e) => updateTopicTitle(mIdx, tIdx, e.target.value)}
                      disabled={disabled}
                      className="h-8 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive h-8 w-8 hover:bg-destructive/10 shrink-0"
                      onClick={() => removeTopic(mIdx, tIdx)}
                      disabled={disabled}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
