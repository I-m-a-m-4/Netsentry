
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronLeft,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

const blogPostSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters."),
    slug: z.string().min(3, "Slug must be a URL-friendly string.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    excerpt: z.string().optional(),
    content: z.string().default(''),
    imageUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
    published: z.boolean().default(false),
    category: z.string().min(2, "Please select a category."),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

function EditPostSkeleton() {
    return (
        <div className="grid flex-1 auto-rows-max gap-4">
             <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
            </div>
            <Card><CardHeader><Skeleton className="h-6 w-32 mb-2"/><Skeleton className="h-4 w-48"/></CardHeader><CardContent><div className="grid gap-6"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/><Skeleton className="h-32 w-full"/><Skeleton className="h-40 w-full"/></div></CardContent></Card>
        </div>
    )
}

interface ContentBlock {
    type: 'paragraph' | 'image';
    paragraphText?: string;
    imageUrl?: string;
    imageCaption?: string;
}

function EditBlogPostContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const postId = searchParams.get('id') || '';
    const isCreateMode = postId === 'create' || !postId;

    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [isLoading, setIsLoading] = React.useState(!isCreateMode);
    const [isSaving, setIsSaving] = React.useState(false);
    const [blocks, setBlocks] = React.useState<ContentBlock[]>([
        { type: 'paragraph', paragraphText: '' }
    ]);
    const [uploadingIndex, setUploadingIndex] = React.useState<number | null>(null);
    const [imgbbKey, setImgbbKey] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('imgbb_api_key') || process.env.NEXT_PUBLIC_IMGBB_API_KEY || '';
        }
        return '';
    });

    const handleImgbbKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setImgbbKey(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('imgbb_api_key', val);
        }
    };

    const handleImageUpload = async (index: number, file: File | undefined) => {
        if (!file) return;
        if (!imgbbKey) {
            toast({
                variant: 'destructive',
                title: 'Missing ImgBB API Key',
                description: 'Please paste your ImgBB API key in the input field above the block manager to enable image uploads.'
            });
            return;
        }

        setUploadingIndex(index);
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const imageUrl = data.data.url;
            
            if (index === -1) {
                form.setValue('imageUrl', imageUrl);
            } else {
                updateBlockValue(index, 'imageUrl', imageUrl);
            }
            toast({
                variant: 'success',
                title: 'Upload Successful',
                description: 'Image uploaded successfully to ImgBB.'
            });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not upload image. Please verify your ImgBB API key.'
            });
        } finally {
            setUploadingIndex(null);
        }
    };

    const form = useForm<BlogPostFormValues>({
        resolver: zodResolver(blogPostSchema),
        defaultValues: { title: "", slug: "", excerpt: "", content: "", imageUrl: "", published: false, category: "Post-Utme/Screening News" },
    });
    
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric characters
            .trim()
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .slice(0, 50); // limit length
    };

    const addBlock = (type: 'paragraph' | 'image') => {
        if (type === 'paragraph') {
            setBlocks([...blocks, { type: 'paragraph', paragraphText: '' }]);
        } else {
            setBlocks([...blocks, { type: 'image', imageUrl: '', imageCaption: '' }]);
        }
    };

    const removeBlock = (index: number) => {
        const updated = [...blocks];
        updated.splice(index, 1);
        setBlocks(updated);
    };

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === blocks.length - 1) return;

        const updated = [...blocks];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = updated[index];
        updated[index] = updated[swapIndex];
        updated[swapIndex] = temp;
        setBlocks(updated);
    };

    const updateBlockValue = (index: number, field: string, value: string) => {
        const updated = [...blocks];
        updated[index] = { ...updated[index], [field]: value };
        setBlocks(updated);
    };

    const compileBlocksToMarkdown = (blocksList: ContentBlock[]) => {
        return blocksList.map(block => {
            if (block.type === 'paragraph') {
                return block.paragraphText || '';
            } else if (block.type === 'image') {
                const img = block.imageUrl ? `![${block.imageCaption || 'Image'}](${block.imageUrl})` : '';
                const caption = block.imageCaption ? `\n*${block.imageCaption}*` : '';
                return `${img}${caption}`;
            }
            return '';
        }).filter(Boolean).join('\n\n');
    };

    React.useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === 'title' && isCreateMode) {
                form.setValue('slug', generateSlug(value.title || ''));
            }
        });
        return () => subscription.unsubscribe();
    }, [form, isCreateMode]);

    React.useEffect(() => {
        if (!isCreateMode && firestore && postId) {
            const fetchPost = async () => {
                setIsLoading(true);
                try {
                    const postDocRef = doc(firestore, 'blogPosts', postId);
                    const docSnap = await getDoc(postDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        form.reset({
                            title: data.title || '',
                            slug: data.slug || '',
                            excerpt: data.excerpt || '',
                            content: data.content || '',
                            imageUrl: data.imageUrl || '',
                            published: data.published || false,
                            category: data.category || 'Post-Utme/Screening News',
                        });
                        
                        if (data.blocks && Array.isArray(data.blocks)) {
                            setBlocks(data.blocks);
                        } else {
                            setBlocks([
                                { type: 'paragraph', paragraphText: data.content || '' }
                            ]);
                        }
                    } else {
                        toast({ variant: 'destructive', title: 'Not Found', description: 'Blog post not found.' });
                        router.push('/admin-sheun/blog');
                    }
                } catch (e) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch blog post.' });
                } finally {
                    setIsLoading(false);
                }
            }
            fetchPost();
        }
    }, [isCreateMode, firestore, postId, form, toast, router]);

    const onSubmit = async (values: BlogPostFormValues) => {
        if (!firestore || !user) return;
        setIsSaving(true);
        
        const compiledContent = compileBlocksToMarkdown(blocks);
        
        try {
            if (isCreateMode) {
                await addDoc(collection(firestore, 'blogPosts'), {
                    ...values,
                    content: compiledContent,
                    blocks: blocks,
                    authorId: user.uid,
                    authorName: user.displayName || 'Admin',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ variant: 'success', title: 'Post Created', description: 'Your new blog post has been saved.' });
            } else {
                const postDocRef = doc(firestore, 'blogPosts', postId);
                await setDoc(postDocRef, {
                    ...values,
                    content: compiledContent,
                    blocks: blocks,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
                toast({ variant: 'success', title: 'Post Updated', description: 'Your blog post has been updated.' });
            }
            router.push('/admin-sheun/blog');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <EditPostSkeleton />;
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/admin-sheun/blog">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        {isCreateMode ? "Create New Blog Post" : "Edit Blog Post"}
                    </h1>
                    <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Button variant="outline" size="lg" type="button" onClick={() => router.push('/admin-sheun/blog')}>
                            Cancel
                        </Button>
                        <Button size="lg" type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCreateMode ? 'Publish Post' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle>Post Details</CardTitle>
                        <CardDescription>Fill out the main content and metadata for your blog post.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl><Input placeholder="Your Awesome Post Title" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="slug" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Slug</FormLabel>
                                <FormControl><Input placeholder="your-awesome-post-title" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <FormControl>
                                    <select 
                                        className="w-full px-4 py-3 rounded-xl border border-dashed border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all bg-slate-50/50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                                        {...field}
                                    >
                                        <option value="Post-Utme/Screening News">Post-Utme/Screening News (OAU Focus)</option>
                                        <option value="Admission News">Admission News</option>
                                        <option value="Waec/Jamb News">Waec/Jamb News</option>
                                        <option value="Scholarship and Opportunities">Scholarship and Opportunities</option>
                                    </select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="excerpt" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Excerpt</FormLabel>
                                <FormControl><Textarea placeholder="A short summary of your post." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {/* ImgBB Configuration Input */}
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    Configure ImgBB Image Uploads
                                </FormLabel>
                                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded font-mono">localStorage</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Paste your ImgBB API key to enable direct file uploads. The key is saved locally in your browser.
                            </p>
                            <Input
                                type="password"
                                value={imgbbKey}
                                onChange={handleImgbbKeyChange}
                                placeholder="Paste your ImgBB API Key here"
                                className="bg-white border-dashed focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Block-Based Editor UI */}
                        <div className="space-y-4">
                            <FormLabel className="text-base font-bold text-slate-900">Article Blocks (Add paragraphs & insert images with captions)</FormLabel>
                            <div className="space-y-4 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/30">
                                {blocks.map((block, index) => (
                                    <div key={index} className="bg-white border rounded-xl p-4 shadow-sm relative group space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                Block #{index + 1} - {block.type === 'paragraph' ? 'Paragraph' : 'Image with text below'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={index === 0}
                                                    onClick={() => moveBlock(index, 'up')}
                                                >
                                                    Move Up
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={index === blocks.length - 1}
                                                    onClick={() => moveBlock(index, 'down')}
                                                >
                                                    Move Down
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeBlock(index)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>

                                        {block.type === 'paragraph' ? (
                                            <Textarea
                                                value={block.paragraphText || ''}
                                                onChange={(e) => updateBlockValue(index, 'paragraphText', e.target.value)}
                                                placeholder="Write your paragraph content here..."
                                                className="min-h-32 focus:ring-primary focus:border-primary border-dashed"
                                            />
                                        ) : (
                                            <div className="grid gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        type="text"
                                                        value={block.imageUrl || ''}
                                                        onChange={(e) => updateBlockValue(index, 'imageUrl', e.target.value)}
                                                        placeholder="Image URL (or upload image using the file selector)"
                                                        className="flex-1 focus:ring-primary focus:border-primary border-dashed"
                                                    />
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(index, e.target.files?.[0])}
                                                            className="w-48 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                        />
                                                        {uploadingIndex === index && <Loader2 className="animate-spin h-4 w-4 text-primary shrink-0" />}
                                                    </div>
                                                </div>
                                                <Input
                                                    type="text"
                                                    value={block.imageCaption || ''}
                                                    onChange={(e) => updateBlockValue(index, 'imageCaption', e.target.value)}
                                                    placeholder="Text below image (Caption)"
                                                    className="focus:ring-primary focus:border-primary border-dashed"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {blocks.length === 0 && (
                                    <p className="text-center text-sm text-slate-500 py-8">No content blocks added yet. Click one of the buttons below to start writing.</p>
                                )}

                                <div className="flex gap-3 justify-center pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addBlock('paragraph')}
                                        className="border-dashed"
                                    >
                                        + Add Paragraph
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addBlock('image')}
                                        className="border-dashed"
                                    >
                                        + Add Image with Caption
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cover Image URL (Featured Image)</FormLabel>
                                <div className="space-y-2">
                                    <FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl>
                                    <div className="flex items-center gap-3">
                                        <Input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={(e) => handleImageUpload(-1, e.target.files?.[0])}
                                            className="max-w-xs text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        />
                                        {uploadingIndex === -1 && <Loader2 className="animate-spin h-4 w-4 text-primary" />}
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="published" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <FormLabel>Published Status</FormLabel>
                                    <FormMessage>Make this post visible to the public.</FormMessage>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>
                 <div className="flex items-center justify-center gap-2 md:hidden">
                    <Button variant="outline" size="lg" type="button" onClick={() => router.push('/admin-sheun/blog')}>
                        Cancel
                    </Button>
                    <Button size="lg" type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isCreateMode ? 'Publish Post' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export default function EditBlogPostPage() {
    return (
        <React.Suspense fallback={<EditPostSkeleton />}>
            <EditBlogPostContent />
        </React.Suspense>
    );
}
