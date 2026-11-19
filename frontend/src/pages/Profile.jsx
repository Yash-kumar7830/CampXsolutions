import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getItems, getMyClaims, deleteItem, updateItemStatus } from '@/lib/campusApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils/toast';
import { demoItems } from '@/data/demoItems';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle2, Clock, MapPin, MessageCircle, Package, Search, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { currentUser } = useAuth();
    const [tab, setTab] = useState('all-items'); // 'all-items', 'lost', 'found', 'claims'
    const [items, setItems] = useState([]);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(async () => {
        if (!currentUser) return;
        if (!isSupabaseConfigured) {
            setItems(demoItems.filter((i) => i.user_id === currentUser.id || i.user_id === 'demo-user'));
            setClaims([]);
            setLoading(false);
            return;
        }
        try {
            const [allItems, allClaims] = await Promise.all([
                getItems(currentUser.id),
                getMyClaims(currentUser.id),
            ]);
            setItems(allItems);
            setClaims(allClaims);
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Could not load your activity.');
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        void refreshData();
    }, [refreshData]);

    const myItems = items.filter((item) => item.user_id === currentUser?.id);
    const myLostItems = myItems.filter((item) => item.type === 'lost');
    const myFoundItems = myItems.filter((item) => item.type === 'found');
    const myClaimRequests = claims.filter((claim) => claim.claimant_id === currentUser?.id);

    const handleToggleReturned = async (item) => {
        if (!currentUser)
            return;
        const nextStatus = item.status === 'resolved' ? 'active' : 'resolved';
        try {
            await updateItemStatus(item.id, nextStatus, currentUser.id);
            showSuccess(nextStatus === 'resolved' ? 'Item marked as returned.' : 'Item marked active.');
            await refreshData();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Status update failed.');
        }
    };

    const handleDelete = async (item) => {
        if (!currentUser)
            return;
        if (!window.confirm(`Delete "${item.title}"?`)) return;
        try {
            await deleteItem(item.id, currentUser.id);
            showSuccess('Item deleted successfully.');
            await refreshData();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Failed to delete.');
        }
    };

    const displayItems =
        tab === 'all-items'
            ? myItems
            : tab === 'lost'
            ? myLostItems
            : tab === 'found'
            ? myFoundItems
            : [];

    return (
        <main className="min-h-screen bg-[#f7f8f5] pb-20 text-[#1d2d24] dark:bg-[#0d1a13] dark:text-[#d4e8d0]">
            <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-7">
                {/* Header Profile Card */}
                <section className="mb-8 rounded-3xl bg-[#183a2f] p-6 text-white sm:p-8 dark:bg-[#122820]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#d2ee82] text-[#183a2f]">
                                <User size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    {currentUser?.username || 'Student Profile'}
                                </h1>
                                <p className="text-xs text-[#c8df9c] sm:text-sm">{currentUser?.email}</p>
                                <span className="mt-1 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/80">
                                    KIET Campus Member
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                                <span className="block text-xl font-bold text-[#d2ee82]">{myItems.length}</span>
                                <span className="text-[10px] text-white/70 uppercase tracking-wider">Reports</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                                <span className="block text-xl font-bold text-[#d2ee82]">{myFoundItems.length}</span>
                                <span className="text-[10px] text-white/70 uppercase tracking-wider">Found</span>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center">
                                <span className="block text-xl font-bold text-[#d2ee82]">{myClaimRequests.length}</span>
                                <span className="text-[10px] text-white/70 uppercase tracking-wider">Claims</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs Selector */}
                <div className="mb-6 flex flex-wrap gap-2 border-b border-[#e1e7df] pb-3 dark:border-[#22362c]">
                    {[
                        { id: 'all-items', label: `My Items (${myItems.length})` },
                        { id: 'lost', label: `Lost (${myLostItems.length})` },
                        { id: 'found', label: `Found (${myFoundItems.length})` },
                        { id: 'claims', label: `My Claims (${myClaimRequests.length})` },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                                tab === id
                                    ? 'bg-[#214b3b] text-white dark:bg-[#2b5e4a]'
                                    : 'bg-white text-[#556959] hover:bg-[#f1f5ee] dark:bg-[#13241b] dark:text-[#8ea594] dark:hover:bg-[#1a3024]'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-44 animate-pulse rounded-2xl bg-white dark:bg-[#14231b]" />
                        ))}
                    </div>
                ) : tab === 'claims' ? (
                    myClaimRequests.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#d7dfd5] bg-white p-12 text-center dark:border-[#23382d] dark:bg-[#13241b]">
                            <Clock className="mx-auto text-[#88988a]" size={28} />
                            <h3 className="mt-3 font-semibold">No claims made yet</h3>
                            <p className="mt-1 text-xs text-[#7e8e81]">
                                When you contact someone to claim a found item, it will be listed here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {myClaimRequests.map((claim) => (
                                <div
                                    key={claim.id}
                                    className="rounded-2xl border border-[#e8ece6] bg-white p-5 shadow-sm dark:border-[#203429] dark:bg-[#14261d]"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold">{claim.item_title || 'Item Claim'}</h3>
                                            <p className="mt-1 text-xs text-[#718078] dark:text-[#8ea594]">
                                                Requested: {new Date(claim.claimed_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge
                                            className={`text-[10px] capitalize ${
                                                claim.status === 'approved'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : claim.status === 'rejected'
                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            }`}
                                        >
                                            {claim.status}
                                        </Badge>
                                    </div>
                                    <Link to="/">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="mt-4 w-full rounded-xl text-xs"
                                        >
                                            <MessageCircle size={14} className="mr-1.5" /> View on board
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )
                ) : displayItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#d7dfd5] bg-white p-12 text-center dark:border-[#23382d] dark:bg-[#13241b]">
                        <Package className="mx-auto text-[#88988a]" size={28} />
                        <h3 className="mt-3 font-semibold">No items under this tab</h3>
                        <p className="mt-1 text-xs text-[#7e8e81]">
                            Items you report as lost or found will appear here.
                        </p>
                        <Link to="/" className="mt-4 inline-block">
                            <Button size="sm" className="rounded-xl bg-[#214b3b] text-xs">
                                Report an item
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {displayItems.map((item) => (
                            <article
                                key={item.id}
                                className="flex flex-col justify-between rounded-2xl border border-[#e8ece6] bg-white p-5 shadow-sm dark:border-[#203429] dark:bg-[#14261d]"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2">
                                        <Badge
                                            className={`text-[10px] uppercase font-semibold ${
                                                item.status === 'resolved'
                                                    ? 'bg-gray-100 text-gray-700 dark:bg-[#1a2d21] dark:text-[#a1b8a5]'
                                                    : item.type === 'lost'
                                                    ? 'bg-[#fff3d9] text-[#956c1f]'
                                                    : 'bg-[#e7f3e4] text-[#47744a]'
                                            }`}
                                        >
                                            {item.status === 'resolved' ? 'Returned' : item.type}
                                        </Badge>
                                        <span className="text-[11px] text-[#859288] dark:text-[#7f9485]">
                                            {item.category}
                                        </span>
                                    </div>
                                    <h3 className="mt-3 font-semibold text-[#25382c] dark:text-[#d0e5cc]">
                                        {item.title}
                                    </h3>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#738276] dark:text-[#8ea594]">
                                        {item.description}
                                    </p>
                                    <p className="mt-2 flex items-center gap-1 text-[11px] text-[#718078] dark:text-[#8ea594]">
                                        <MapPin size={12} className="text-[#658862]" />
                                        {item.location || 'KIET campus'}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-[#edf1ec] pt-3 dark:border-[#22362c]">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => void handleToggleReturned(item)}
                                        className="h-8 rounded-lg text-xs font-medium"
                                    >
                                        <Check size={13} className="mr-1" />
                                        {item.status === 'resolved' ? 'Reopen' : 'Mark returned'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => void handleDelete(item)}
                                        className="h-8 px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                    >
                                        <Trash2 size={13} className="mr-1" /> Delete
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Profile;
