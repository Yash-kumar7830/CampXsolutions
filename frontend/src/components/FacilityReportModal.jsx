import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess } from '@/utils/toast';

const issueCategories = [
    ['electrical', 'Electrical'],
    ['water_supply', 'Water supply'],
    ['washroom', 'Washroom'],
    ['classroom', 'Classroom'],
    ['internet', 'Wi-Fi / network'],
    ['furniture', 'Furniture'],
    ['cleanliness', 'Cleanliness'],
    ['safety', 'Safety'],
    ['campus_services', 'Campus services / other campus problem'],
    ['other', 'Other'],
];

const feedbackCategories = [
    ['general_feedback', 'General feedback'],
    ['campus_services', 'Campus services'],
    ['accessibility', 'Accessibility'],
    ['other', 'Other'],
];

const initialForm = {
    type: 'issue',
    category: 'electrical',
    title: '',
    location: '',
    description: '',
    priority: 'normal',
};

const FacilityReportModal = ({ children, onReportSubmit }) => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const categories = form.type === 'issue' ? issueCategories : feedbackCategories;

    const updateField = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
            ...(name === 'type' ? { category: value === 'issue' ? 'electrical' : 'general_feedback' } : {}),
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        try {
            await onReportSubmit(form);
            showSuccess(form.type === 'issue' ? 'Facility issue submitted. Thank you for letting us know.' : 'Your feedback has been submitted. Thank you!');
            setForm(initialForm);
            setOpen(false);
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not submit your report.');
        }
        finally {
            setSubmitting(false);
        }
    };

    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Campus facility report</DialogTitle>
          <DialogDescription>Report any campus facility or service problem. Only college management can view these reports and update their status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="facility-type">What would you like to send?</Label>
            <select id="facility-type" name="type" value={form.type} onChange={updateField} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="issue">Report a facility issue</option>
              <option value="feedback">Share feedback</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facility-category">Category</Label>
            <select id="facility-category" name="category" value={form.category} onChange={updateField} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facility-title">Short summary</Label>
            <Input id="facility-title" name="title" value={form.title} onChange={updateField} placeholder="e.g., Projector not working in Block A" minLength={2} maxLength={100} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facility-location">Campus location {form.type === 'issue' ? '(required)' : '(optional)'}</Label>
            <Input id="facility-location" name="location" value={form.location} onChange={updateField} placeholder="e.g., Block A, Room 204" maxLength={100} required={form.type === 'issue'} />
          </div>
          {form.type === 'issue' && (<div className="grid gap-2">
            <Label htmlFor="facility-priority">Urgency</Label>
            <select id="facility-priority" name="priority" value={form.priority} onChange={updateField} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent / safety concern</option>
            </select>
          </div>)}
          <div className="grid gap-2">
            <Label htmlFor="facility-description">Details</Label>
            <Textarea id="facility-description" name="description" value={form.description} onChange={updateField} placeholder="Describe the issue or feedback, including when it happens." minLength={10} maxLength={2000} required />
          </div>
          <Button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#214b3b] font-semibold hover:bg-[#2a5a48]">
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>);
};

export default FacilityReportModal;
