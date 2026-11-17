"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Flag, MessageSquare } from 'lucide-react'; // Import MessageSquare icon
import { redactDescription } from '@/lib/verification';
import ClaimVerificationModal from '@/components/ClaimVerificationModal';
import ContactPosterModal from '@/components/ContactPosterModal'; // Import ContactPosterModal
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useAuth } from '@/contexts/AuthContext';
const ItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (id) {
            const storedItems = JSON.parse(localStorage.getItem('allFindItItems') || '[]');
            const foundItem = storedItems.find((i) => i.id === id);
            if (foundItem) {
                setItem(foundItem);
            }
            else {
                setError("Item not found.");
            }
        }
        else {
            setError("No item ID provided.");
        }
        setLoading(false);
    }, [id]);
    const handleReportAbuse = () => {
        if (item) {
            console.log(`Reporting abuse for item: ${item.id}`);
            alert(`Item "${item.title}" has been reported for abuse.`);
        }
    };
    const isPoster = currentUser && item && currentUser.id === item.user_id;
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <p>Loading item details...</p>
      </div>);
    }
    if (error) {
        return (<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4"/> Back to Home
            </Button>
          </CardContent>
        </Card>
        <MadeWithDyad />
      </div>);
    }
    if (!item) {
        return (<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Item Not Found</CardTitle>
            <CardDescription>The item you are looking for does not exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4"/> Back to Home
            </Button>
          </CardContent>
        </Card>
        <MadeWithDyad />
      </div>);
    }
    return (<div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4"/> Back to Public Feed
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl">{item.title}</CardTitle>
              <Badge variant={item.type === 'lost' ? 'destructive' : 'default'}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Badge>
            </div>
            <CardDescription className="text-lg">Category: {item.category}</CardDescription>
          </CardHeader>
          <CardContent>
            {item.image_url && (<img src={item.image_url} alt={item.title} className="w-full h-64 object-cover rounded-md mb-6"/>)}
            <p className="mb-4 text-muted-foreground">
              **Status:** <Badge variant="outline">{item.status.replace('_', ' ')}</Badge>
            </p>
            <p className="mb-6 text-base leading-relaxed">
              **Description:** {redactDescription(item.description)}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {!isPoster && ( // Only show Claim button if not the poster
        <ClaimVerificationModal item={item}>
                  <Button className="w-full sm:w-auto flex-grow" disabled={!currentUser}>
                    {currentUser ? "Claim This Item" : "Login to Claim"}
                  </Button>
                </ClaimVerificationModal>)}
              {!isPoster && ( // Only show Contact Poster button if not the poster
        <ContactPosterModal item={item}>
                  <Button variant="outline" className="w-full sm:w-auto flex-grow" disabled={!currentUser}>
                    <MessageSquare className="mr-2 h-4 w-4"/> {currentUser ? "Contact Poster" : "Login to Contact"}
                  </Button>
                </ContactPosterModal>)}
              <Button variant="outline" className="w-full sm:w-auto flex-grow" onClick={handleReportAbuse}>
                <Flag className="mr-2 h-4 w-4"/> Report Abuse
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>);
};
export default ItemDetail;
