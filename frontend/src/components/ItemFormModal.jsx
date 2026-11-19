"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { showSuccess, showError } from '@/utils/toast';
import { getGenericItemImage } from '@/lib/genericItemImage';
// Define the form schema using Zod
const itemFormSchema = z.object({
    type: z.enum(['lost', 'found'], {
        required_error: "You need to select an item type.",
    }),
    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }).max(50, {
        message: "Title must not be longer than 50 characters.",
    }),
    category: z.string().min(2, {
        message: "Category must be at least 2 characters.",
    }).max(50, {
        message: "Category must not be longer than 50 characters.",
    }),
    location: z.string().min(2, {
        message: "Add a campus location.",
    }).max(100, {
        message: "Location must not be longer than 100 characters.",
    }),
    description: z.string().min(10, {
        message: "Description must be at least 10 characters.",
    }).max(500, {
        message: "Description must not be longer than 500 characters.",
    }),
    hidden_detail: z.string().min(5, {
        message: "Hidden detail must be at least 5 characters.",
    }).max(100, {
        message: "Hidden detail must not be longer than 100 characters.",
    }),
    image_url: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
});
const itemCategories = [
    'Electronics & Gadgets',
    'ID Cards & Documents',
    'Keys & Keychains',
    'Bags & Backpacks',
    'Books & Notebooks',
    'Clothing & Wearables',
    'Eyewear & Watches',
    'Bottles & Lunchboxes',
    'Money & Wallets',
    'Sports & Fitness',
    'Other Essentials',
];

const ItemFormModal = ({ children, initialType = 'lost', initialItem, onItemSubmit, open, onOpenChange }) => {
    // Use internal state if not controlled externally
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLock = useRef(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalIsOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalIsOpen;
    const form = useForm({
        resolver: zodResolver(itemFormSchema),
        defaultValues: {
            type: initialItem?.type || initialType,
            title: initialItem?.title || '',
            category: initialItem?.category || '',
            location: initialItem?.location || '',
            description: initialItem?.description || '',
            hidden_detail: initialItem?.hidden_detail || '',
            image_url: initialItem?.image_url || '',
        },
    });
    // Reset form when modal opens or initialItem changes
    useEffect(() => {
        if (isOpen && initialItem) {
            form.reset({
                type: initialItem.type,
                title: initialItem.title,
                category: initialItem.category,
                location: initialItem.location || '',
                description: initialItem.description,
                hidden_detail: initialItem.hidden_detail,
                image_url: initialItem.image_url || '',
            });
        }
        else if (isOpen && !initialItem) {
            // For new item creation, reset to initialType
            form.reset({
                type: initialType,
                title: '',
                category: '',
                location: '',
                description: '',
                hidden_detail: '',
                image_url: '',
            });
        }
    }, [isOpen, initialItem, initialType, form]);
    const onSubmit = async (values) => {
        if (submitLock.current)
            return;
        submitLock.current = true;
        setIsSubmitting(true);
        const imageUrl = values.image_url?.trim();
        const submittedItem = {
            id: initialItem?.id || `item-${Date.now()}`, // Use existing ID or generate new
            status: initialItem?.status || 'active', // Preserve status or default to active
            campus_id: initialItem?.campus_id || 'main-campus', // Preserve or default
            created_at: initialItem?.created_at || new Date().toISOString(), // Preserve or default
            user_id: initialItem?.user_id || 'mock-user-id', // Preserve or default
            // Explicitly set required fields from form values
            type: values.type,
            title: values.title,
            category: values.category,
            location: values.location,
            description: values.description,
            hidden_detail: values.hidden_detail,
            // Optional fields
            image_url: imageUrl || (values.type === 'found' ? getGenericItemImage(values.title, values.category) : undefined),
        };
        try {
            await onItemSubmit(submittedItem);
            showSuccess(`${submittedItem.type === 'lost' ? 'Lost' : 'Found'} item "${submittedItem.title}" ${initialItem ? 'updated' : 'reported'} successfully!`);
            form.reset();
            setIsOpen(false);
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not submit this report.');
        }
        finally {
            submitLock.current = false;
            setIsSubmitting(false);
        }
    };
    return (<Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialItem ? `Edit Item: ${initialItem.title}` : (initialType === 'lost' ? 'Report Lost Item' : 'Report Found Item')}</DialogTitle>
          <DialogDescription>
            {initialItem ? "Update the details of your item." : "Provide details about the item. The hidden detail will be used to verify claims."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Item Type</Label>
            <Select onValueChange={(value) => form.setValue('type', value)} value={form.watch('type')} // Control the select component
    >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select item type"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (<p className="text-sm text-red-500">{form.formState.errors.type.message}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g., Blue Backpack" {...form.register('title')}/>
            {form.formState.errors.title && (<p className="text-sm text-red-500">{form.formState.errors.title.message}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={(value) => form.setValue('category', value, { shouldValidate: true })}
              value={form.watch('category')}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {itemCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (<p className="text-sm text-red-500">{form.formState.errors.category.message}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Where on campus?</Label>
            <Input id="location" placeholder="e.g., Main library, ground floor" {...form.register('location')}/>
            {form.formState.errors.location && (<p className="text-sm text-red-500">{form.formState.errors.location.message}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="Description">Description</Label>
            <Textarea id="description" placeholder="Describe the item, its condition, and where it was lost/found." {...form.register('description')}/>
            {form.formState.errors.description && (<p className="text-sm text-red-500">{form.formState.errors.description.message}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hidden_detail">Hidden Detail (for verification)</Label>
            <Input id="hidden_detail" placeholder="e.g., 'It has a small tear on the left strap.'" {...form.register('hidden_detail')}/>
            {form.formState.errors.hidden_detail && (<p className="text-sm text-red-500">{form.formState.errors.hidden_detail.message}</p>)}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image_url">Image URL (Optional)</Label>
            <Input id="image_url" placeholder="https://example.com/item-image.jpg" {...form.register('image_url')}/>
            <p className="text-xs text-muted-foreground">Found reports get a generic item image when this is left blank.</p>
            {form.formState.errors.image_url && (<p className="text-sm text-red-500">{form.formState.errors.image_url.message}</p>)}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Submitting…" : initialItem ? "Save Changes" : "Submit Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>);
};
export default ItemFormModal;
