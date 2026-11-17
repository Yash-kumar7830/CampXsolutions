"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccess } from '@/utils/toast';
const ContactPosterModal = ({ item, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { currentUser } = useAuth();
    // Simulate a mock email based on the item's user_id
    const mockPosterEmail = `user-${item.user_id.split('-').pop()}@campus.edu`;
    const handleSendMessage = () => {
        // In a real application, this would trigger a backend function
        // to send an anonymous message or reveal a secure contact method.
        showSuccess(`A message has been simulated to ${mockPosterEmail}.`);
        setIsOpen(false);
    };
    return (<Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Poster for: {item.title}</DialogTitle>
          <DialogDescription>
            You can simulate sending a message to the person who posted this item.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">
              Poster ID: {item.user_id}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">
              Simulated Contact: <span className="font-semibold">{mockPosterEmail}</span>
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            In a real application, this would be a secure messaging system or a way to request contact without revealing direct personal information.
          </p>
          <Button onClick={handleSendMessage} className="w-full mt-4">
            Simulate Sending Message
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
};
export default ContactPosterModal;
