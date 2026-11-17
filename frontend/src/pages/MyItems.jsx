"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Edit, Trash2, PlusCircle } from 'lucide-react'; // Import PlusCircle icon
import { showSuccess, showError } from '@/utils/toast';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import ItemFormModal from '@/components/ItemFormModal'; // Reusing the ItemFormModal for editing and new item creation
const MyItems = () => {
    const { currentUser } = useAuth();
    const [userItems, setUserItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false); // State for new item modal
    // In a real app, this would fetch items from a backend based on currentUser.id
    useEffect(() => {
        if (currentUser) {
            // Simulate fetching user-specific items
            const storedItems = JSON.parse(localStorage.getItem('allFindItItems') || '[]');
            const itemsForUser = storedItems.filter((item) => item.user_id === currentUser.id);
            setUserItems(itemsForUser);
        }
        else {
            setUserItems([]);
        }
    }, [currentUser]);
    const handleUpdateItem = (updatedItem) => {
        setUserItems((prevItems) => prevItems.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
        // Also update global mock storage
        const allItems = JSON.parse(localStorage.getItem('allFindItItems') || '[]');
        const updatedAllItems = allItems.map((item) => (item.id === updatedItem.id ? updatedItem : item));
        localStorage.setItem('allFindItItems', JSON.stringify(updatedAllItems));
        showSuccess(`Item "${updatedItem.title}" updated successfully.`);
        setEditingItem(null);
        setIsEditModalOpen(false); // Close modal after update
    };
    const handleNewItemSubmit = (newItem) => {
        if (!currentUser) {
            showError("You must be logged in to report an item.");
            return;
        }
        const itemWithUserId = { ...newItem, user_id: currentUser.id };
        setUserItems((prevItems) => [itemWithUserId, ...prevItems]);
        // Update localStorage
        const allItems = JSON.parse(localStorage.getItem('allFindItItems') || '[]');
        localStorage.setItem('allFindItItems', JSON.stringify([itemWithUserId, ...allItems]));
        setIsNewItemModalOpen(false); // Close new item modal
    };
    const handleDeleteItem = (itemId) => {
        setUserItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        // Also update global mock storage
        const allItems = JSON.parse(localStorage.getItem('allFindItItems') || '[]');
        const updatedAllItems = allItems.filter((item) => item.id !== itemId);
        localStorage.setItem('allFindItItems', JSON.stringify(updatedAllItems));
        showSuccess("Item deleted successfully.");
    };
    const openEditModal = (item) => {
        setEditingItem(item);
        setIsEditModalOpen(true);
    };
    if (!currentUser) {
        return (<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view your reported items.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
          </CardContent>
        </Card>
        <MadeWithDyad />
      </div>);
    }
    return (<div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Reported Items</h1>
          <ItemFormModal onItemSubmit={handleNewItemSubmit} open={isNewItemModalOpen} onOpenChange={setIsNewItemModalOpen}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4"/> Report New Item
            </Button>
          </ItemFormModal>
        </div>
        <p className="text-lg text-muted-foreground mb-8">
          Hello, {currentUser.username}! Here are the items you've reported.
        </p>

        {userItems.length === 0 ? (<Card className="text-center py-8">
            <CardTitle className="text-xl mb-2">No Items Reported Yet</CardTitle>
            <CardDescription>You haven't posted any lost or found items. Start by reporting one!</CardDescription>
          </Card>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userItems.map((item) => (<Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{item.title}</CardTitle>
                    <Badge variant={item.type === 'lost' ? 'destructive' : 'default'}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>Category: {item.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.image_url && (<img src={item.image_url} alt={item.title} className="w-full h-48 object-cover rounded-md mb-4"/>)}
                  <p className="mb-2">**Description:** {item.description}</p>
                  <p className="mb-4 text-sm text-muted-foreground">**Hidden Detail:** {item.hidden_detail}</p>
                  <Badge variant="outline" className="mb-4">Status: {item.status.replace('_', ' ')}</Badge>
                  <div className="flex gap-2 mt-4">
                    <ItemFormModal initialItem={editingItem} onItemSubmit={handleUpdateItem} initialType={item.type} open={isEditModalOpen && editingItem?.id === item.id} onOpenChange={(open) => {
                    if (!open) {
                        setIsEditModalOpen(false);
                        setEditingItem(null);
                    }
                }}>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                        <Edit className="mr-2 h-4 w-4"/> Edit
                      </Button>
                    </ItemFormModal>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="mr-2 h-4 w-4"/> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your item
                            and remove its data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>))}
          </div>)}
      </div>
      <MadeWithDyad />
    </div>);
};
export default MyItems;
