"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Scan } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
const AdminScanQRModal = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scannedClaimId, setScannedClaimId] = useState('');
    const [verificationStatus, setVerificationStatus] = useState('idle');
    const handleScan = () => {
        if (!scannedClaimId.trim()) {
            showError("Please enter a Claim ID to simulate scanning.");
            return;
        }
        // In a real application, this would involve:
        // 1. Sending the scannedClaimId to the backend.
        // 2. Backend verifying the claim ID against active claims.
        // 3. Backend updating the item status to 'resolved' and logging the audit.
        // For this simulation, we'll just check for a specific mock ID.
        if (scannedClaimId.startsWith('CLAIM-')) { // Simple check for our mock claim ID format
            setVerificationStatus('success');
            showSuccess(`Claim ID "${scannedClaimId}" verified! Item can be returned.`);
        }
        else {
            setVerificationStatus('failure');
            showError("Invalid or expired Claim ID. Please check again.");
        }
    };
    const handleClose = () => {
        setIsOpen(false);
        setScannedClaimId('');
        setVerificationStatus('idle');
    };
    return (<Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Scan Claim QR Code</DialogTitle>
          <DialogDescription>
            Simulate scanning a student's QR code to verify their item claim.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="claimId" className="text-right">
              Claim ID
            </Label>
            <Input id="claimId" value={scannedClaimId} onChange={(e) => setScannedClaimId(e.target.value)} className="col-span-3" placeholder="Enter Claim ID from student's QR"/>
          </div>
          {verificationStatus === 'success' && (<div className="text-center text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4"/> Claim successfully processed!
            </div>)}
          {verificationStatus === 'failure' && (<div className="text-center text-red-600 flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4"/> Claim verification failed.
            </div>)}
          <Button onClick={handleScan} className="w-full mt-2">
            <Scan className="mr-2 h-4 w-4"/> Verify Claim
          </Button>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>);
};
export default AdminScanQRModal;
