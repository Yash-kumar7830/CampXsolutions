"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
const MyClaims = () => {
    const { currentUser } = useAuth();
    const [userClaims, setUserClaims] = useState([]);
    const [allItems, setAllItems] = useState([]);
    useEffect(() => {
        if (currentUser) {
            const storedClaims = JSON.parse(localStorage.getItem('allFindItClaims') || '[]');
            const claimsForUser = storedClaims.filter((claim) => claim.claimant_id === currentUser.id);
            setUserClaims(claimsForUser);
            const storedItems = JSON.parse(localStorage.getItem('allFindItItems') || '[]');
            setAllItems(storedItems);
        }
        else {
            setUserClaims([]);
            setAllItems([]);
        }
    }, [currentUser]);
    const getItemDetails = (itemId) => {
        return allItems.find(item => item.id === itemId);
    };
    if (!currentUser) {
        return (<div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4"/>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view your claims.</CardDescription>
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
        <h1 className="text-3xl font-bold mb-6">My Claims</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Hello, {currentUser.username}! Here are the claims you've made on lost items.
        </p>

        {userClaims.length === 0 ? (<Card className="text-center py-8">
            <CardTitle className="text-xl mb-2">No Claims Made Yet</CardTitle>
            <CardDescription>You haven't claimed any items yet. Explore the public feed to find items!</CardDescription>
            <Button asChild className="mt-4">
              <Link to="/">Browse Items</Link>
            </Button>
          </Card>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userClaims.map((claim) => {
                const item = getItemDetails(claim.report_id);
                const claimTime = parseISO(claim.claimed_at);
                const timeAgo = formatDistanceToNow(claimTime, { addSuffix: true });
                let statusBadgeVariant = 'outline';
                let statusIcon = <Clock className="h-4 w-4 mr-1"/>;
                switch (claim.status) {
                    case 'pending':
                        statusBadgeVariant = 'secondary';
                        statusIcon = <Clock className="h-4 w-4 mr-1"/>;
                        break;
                    case 'approved':
                        statusBadgeVariant = 'default';
                        statusIcon = <CheckCircle className="h-4 w-4 mr-1"/>;
                        break;
                    case 'rejected':
                        statusBadgeVariant = 'destructive';
                        statusIcon = <XCircle className="h-4 w-4 mr-1"/>;
                        break;
                }
                return (<Card key={claim.report_id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{item ? item.title : 'Unknown Item'}</CardTitle>
                      <Badge variant={statusBadgeVariant} className="flex items-center">
                        {statusIcon} {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription>Claimed {timeAgo}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="mb-2">**Your Answer:** {claim.answer_text}</p>
                    {item && (<p className="mb-2 text-sm text-muted-foreground">
                        **Item Description:** {item.description}
                      </p>)}
                    <p className="mb-4 text-sm text-muted-foreground">
                      **Match Score:** {(claim.match_score * 100).toFixed(0)}%
                    </p>
                    {item && (<Button asChild variant="outline" size="sm">
                        <Link to={`/items/${item.id}`}>View Item Details</Link>
                      </Button>)}
                  </CardContent>
                </Card>);
            })}
          </div>)}
      </div>
      <MadeWithDyad />
    </div>);
};
export default MyClaims;
