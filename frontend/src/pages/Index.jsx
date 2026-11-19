import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Check, CheckCircle2, MapPin, MessageCircle, Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, X, } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ItemFormModal from '@/components/ItemFormModal';
import ChatModal from '@/components/ChatModal';
import { useAuth } from '@/contexts/AuthContext';
<<<<<<< HEAD
import { createItem, deleteItem, getItems, getMyClaims, startClaim, subscribeToClaims, subscribeToItems, updateClaimStatus, } from '@/lib/campusApi';
=======
import { archiveOldItems, createItem, deleteItem, getItems, getMyClaims, startClaim, subscribeToClaims, subscribeToItems, updateClaimStatus, updateItemStatus, } from '@/lib/campusApi';
>>>>>>> dec0b634f579602640f3784b12d47a6807ea7e86
import { isSupabaseConfigured } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils/toast';
import { demoItems } from '@/data/demoItems';
import { getGenericItemImage } from '@/lib/genericItemImage';
function imageFor(item) {
    if (item.image_url)
        return item.image_url;
    return getGenericItemImage(item.title, item.category);
}
function timeAgo(isoDate) {
    const minutes = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000));
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
const CATEGORIES = [
    'All Categories',
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

const Index = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [claims, setClaims] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [loading, setLoading] = useState(true);
    const [busyClaim, setBusyClaim] = useState(null);
    const [busyReturned, setBusyReturned] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const refresh = useCallback(async () => {
        if (!currentUser)
            return;
        if (!isSupabaseConfigured) {
            setItems(demoItems);
            setClaims([]);
            setLoading(false);
            return;
        }
        try {
            await archiveOldItems();
            const [itemRows, claimRows] = await Promise.all([getItems(), getMyClaims(currentUser.id)]);
            setItems(itemRows);
            setClaims(claimRows);
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not load campus reports.');
        }
        finally {
            setLoading(false);
        }
    }, [currentUser]);
    useEffect(() => {
        void refresh();
        if (!currentUser || !isSupabaseConfigured)
            return;
        const unsubscribeItems = subscribeToItems(() => { void refresh(); });
        const unsubscribeClaims = subscribeToClaims(currentUser.id, () => { void refresh(); });
        return () => {
            unsubscribeItems();
            unsubscribeClaims();
        };
    }, [currentUser, refresh]);
    const visibleItems = useMemo(() => items.filter((item) => {
        const query = search.trim().toLowerCase();
        const matchesText = !query || `${item.title} ${item.category} ${item.description} ${item.location ?? ''}`.toLowerCase().includes(query);
        const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
        const matchesTab =
            filter === 'all'
                ? item.status === 'active'
                : filter === 'returned'
                ? item.status === 'resolved'
                : filter === 'archived'
                ? item.status === 'archived'
                : item.type === filter && item.status === 'active';
        return matchesText && matchesCategory && matchesTab;
    }), [items, search, filter, selectedCategory]);
    const ownClaims = claims.filter((claim) => claim.claimant_id === currentUser?.id);
    const incomingClaims = claims.filter((claim) => {
        const item = items.find((entry) => entry.id === claim.report_id);
        return item?.user_id === currentUser?.id && claim.claimant_id !== currentUser?.id;
    });
    const pendingCount = incomingClaims.filter((claim) => claim.status === 'pending').length;
    const reportItem = async (reportedItem) => {
        if (!currentUser)
            throw new Error('Please sign in with your KIET email to report an item.');
        if (!isSupabaseConfigured)
            throw new Error('Reporting is unavailable in demo mode. Configure Supabase to enable backend features.');
        await createItem({ ...reportedItem, user_id: currentUser.id });
        await refresh();
    };
    const openClaimChat = async (item) => {
        if (!currentUser || !isSupabaseConfigured)
            return;
        setBusyClaim(item.id);
        try {
            const claim = await startClaim(item.id, currentUser.id);
            setActiveChat({ item, claim });
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not start a claim conversation.');
        }
        finally {
            setBusyClaim(null);
        }
    };
    const changeClaim = async (claim, status) => {
        if (!claim.id)
            return;
        setBusyClaim(claim.id);
        try {
            await updateClaimStatus(claim.id, status);
            showSuccess(status === 'approved' ? 'Claim verified. The claimant has been notified.' : 'Claim declined.');
            await refresh();
            if (activeChat?.claim.id === claim.id) {
                setActiveChat({ ...activeChat, claim: { ...claim, status } });
            }
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not update this claim.');
        }
        finally {
            setBusyClaim(null);
        }
    };
<<<<<<< HEAD
    const markItemReturned = async (item) => {
        if (!currentUser)
            return;
        setBusyReturned(item.id);
        try {
            await deleteItem(item.id, currentUser.id);
            showSuccess('Item marked as returned and removed from the reports.');
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not mark this item as returned.');
        }
        finally {
            setBusyReturned(null);
=======
    const toggleItemReturned = async (item) => {
        if (!item.id)
            return;
        const nextStatus = item.status === 'resolved' ? 'active' : 'resolved';
        try {
            await updateItemStatus(item.id, nextStatus);
            showSuccess(nextStatus === 'resolved' ? 'Item marked as returned!' : 'Item marked as active again.');
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not update item status.');
        }
    };
    const handleDeleteItem = async (item) => {
        if (!item.id)
            return;
        const confirmed = window.confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`);
        if (!confirmed)
            return;
        try {
            await deleteItem(item.id);
            showSuccess(`"${item.title}" was deleted successfully.`);
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not delete item.');
>>>>>>> dec0b634f579602640f3784b12d47a6807ea7e86
        }
    };
    const openExistingChat = (claim) => {
        const item = items.find((entry) => entry.id === claim.report_id);
        if (item)
            setActiveChat({ item, claim });
    };
    return (<main className="min-h-screen bg-[#f7f8f5] pb-12 text-[#1d2d24] dark:bg-[#0d1a13] dark:text-[#d4e8d0]">
      <div className="mx-auto max-w-[1320px] px-4 py-7 sm:px-7 lg:px-10">
        {!isSupabaseConfigured && (<div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
        Sample lost-and-found reports are shown in demo mode. Claims and realtime chat require a configured Supabase backend.
          </div>)}
        <section className="relative overflow-hidden rounded-[28px] bg-[#183a2f] px-6 py-8 text-white sm:px-10 sm:py-11">
          <div className="absolute -right-16 -top-36 h-[430px] w-[430px] rounded-full border border-white/[0.08]"/>
          <div className="absolute -right-2 -top-24 h-[300px] w-[300px] rounded-full border border-white/[0.08]"/>
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs text-[#d7edba]">
                <Sparkles size={14}/> Your campus, looking out for you
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Good things find their way <span className="font-serif italic text-[#d2ee82]">back.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">Browse what&apos;s been lost or found around KIET, and help reunite campus items with their owners.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <ItemFormModal initialType="lost" onItemSubmit={reportItem}>
                <Button disabled={!isSupabaseConfigured} className="h-11 rounded-xl bg-[#d2ee82] px-4 font-semibold text-[#1c382a] hover:bg-[#e0f6a0]"><Plus size={17} className="mr-1.5"/> Report an item</Button>
              </ItemFormModal>
            </div>
          </div>
          <div className="relative mt-9 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-5 text-xs text-white/65">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#d2ee82]"/> KIET verified community</span>
            <span className="flex items-center gap-2"><MessageCircle size={15} className="text-[#d2ee82]"/> Private, real-time chat</span>
            <span className="flex items-center gap-2"><MapPin size={15} className="text-[#d2ee82]"/> Find it near you</span>
          </div>
        </section>

        <div className="mt-8 grid gap-8 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#769071]">Community board</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Recently reported</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 sm:w-56">
                  <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b978e]"/>
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search items or locations" className="h-10 rounded-xl border-[#e1e7df] bg-white pl-9 shadow-none focus-visible:ring-[#668362] dark:border-[#2a3c32] dark:bg-[#13241b] dark:text-white"/>
                </div>
                <select
                  aria-label="Filter by category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 rounded-xl border border-[#e1e7df] bg-white px-3 text-xs text-[#536657] shadow-none outline-none focus:ring-1 focus:ring-[#668362] dark:border-[#2a3c32] dark:bg-[#13241b] dark:text-[#a2c89f]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1 rounded-xl border border-[#e1e7df] bg-white p-1 dark:border-[#2a3c32] dark:bg-[#13241b]">
                  {[
                    { key: 'all', label: 'All active' },
                    { key: 'lost', label: 'Lost' },
                    { key: 'found', label: 'Found' },
                    { key: 'returned', label: 'Returned' },
                    { key: 'archived', label: 'Archived' },
                  ].map(({ key, label }) => (<button key={key} onClick={() => setFilter(key)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === key ? 'bg-[#214b3b] text-white dark:bg-[#2b5e4a]' : 'text-[#728077] hover:bg-[#f1f4ef] dark:text-[#8ea594] dark:hover:bg-[#1a3024]'}`}>
                      {label}
                    </button>))}
                </div>
              </div>
            </div>

            {loading ? (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((value) => <div key={value} className="h-[325px] animate-pulse rounded-2xl bg-white"/>)}
              </div>) : visibleItems.length === 0 ? (<div className="rounded-2xl border border-dashed border-[#d7dfd5] bg-white px-5 py-14 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eff4ea] text-[#65815d]"><Search size={21}/></div>
                <h3 className="mt-4 font-semibold text-[#304238]">{search ? 'No matching reports' : 'The board is clear for now'}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#849087]">{search ? 'Try a different search or clear your filters.' : 'When something is lost or found on campus, its report will show up here.'}</p>
                {!search && <div className="mt-5 flex justify-center">
                  <ItemFormModal initialType="found" onItemSubmit={reportItem}>
                    <Button disabled={!isSupabaseConfigured} variant="outline" className="rounded-xl border-[#d9e2d6]"><Plus size={16} className="mr-2"/> Share the first report</Button>
                  </ItemFormModal>
                </div>}
              </div>) : (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => {
                const ownReport = item.user_id === currentUser?.id;
                const myClaim = ownClaims.find((claim) => claim.report_id === item.id);
                const isLost = item.type === 'lost';
                return (<article key={item.id} className="group overflow-hidden rounded-2xl border border-[#e9ede7] bg-white shadow-[0_4px_18px_rgba(35,55,42,0.035)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(35,55,42,0.09)]">
                      <div className="relative h-44 overflow-hidden bg-[#edf0eb]">
                        <img src={imageFor(item)} alt={`Generic photo of ${item.category.toLowerCase()}`} onError={(event) => {
                        const fallbackImage = getGenericItemImage('', '');
                        if (event.currentTarget.src !== fallbackImage) {
                            event.currentTarget.src = fallbackImage;
                        }
                    }} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy"/>
                        <Badge className={`absolute left-3 top-3 border-0 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.status === 'archived' ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400' : item.status === 'resolved' ? 'bg-[#e2e8e0] text-[#56685a] dark:bg-[#1a2d21] dark:text-[#a1b8a5]' : isLost ? 'bg-[#fff3d9] text-[#956c1f] hover:bg-[#fff3d9]' : 'bg-[#e7f3e4] text-[#47744a] hover:bg-[#e7f3e4]'}`}>
                          {item.status === 'archived' ? 'Archived (30d+)' : item.status === 'resolved' ? 'Returned' : isLost ? 'Lost' : 'Found'}
                        </Badge>
                        {ownReport && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#47634a]">Your report</span>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-[#25382c]">{item.title}</h3>
                            <p className="mt-1 text-xs text-[#849087]">{item.category}</p>
                          </div>
                          <span className="shrink-0 rounded-lg bg-[#f5f7f3] px-2 py-1 text-[10px] text-[#78857b]">{timeAgo(item.created_at)}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-[#78857b]">{item.description}</p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#718078]"><MapPin size={13} className="shrink-0 text-[#79936f]"/><span className="truncate">{item.location || 'KIET campus'}</span></div>
<<<<<<< HEAD
                        <div className="mt-4 border-t border-[#eef1ec] pt-3">
                          {ownReport ? (<div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-[#7c897f]"><CheckCircle2 size={15} className="text-[#6f9468]"/> Your report is visible to campus</div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={busyReturned === item.id} className="w-full rounded-lg border-[#dce5d9] text-xs font-semibold text-[#416245]">
                                  <CheckCircle2 size={15} className="mr-2"/> Mark as returned
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Mark this item as returned?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently deletes {item.title} and its related claim conversations from the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction disabled={busyReturned === item.id} onClick={() => void markItemReturned(item)}>
                                    {busyReturned === item.id ? 'Removing...' : 'Mark as returned'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>) : myClaim ? (<Button variant="outline" onClick={() => openExistingChat(myClaim)} className="h-9 w-full rounded-lg border-[#dce5d9] text-xs font-semibold text-[#416245]">
=======
                        <div className="mt-4 border-t border-[#eef1ec] pt-3 dark:border-[#203429]">
                          {ownReport ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between text-xs text-[#7c897f] dark:text-[#8ea594]">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 size={14} className="text-[#6f9468]"/>
                                  {item.status === 'resolved' ? 'Returned to owner' : 'Visible on campus'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteItem(item)}
                                  className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                                  title="Delete this report"
                                >
                                  <Trash2 size={13}/> Delete
                                </button>
                              </div>
                              <Button
                                size="sm"
                                variant={item.status === 'resolved' ? 'outline' : 'secondary'}
                                onClick={() => void toggleItemReturned(item)}
                                className={`h-8 w-full rounded-lg text-xs font-semibold ${
                                  item.status === 'resolved'
                                    ? 'border-[#dce5d9] text-[#536657] hover:bg-[#f1f5ee] dark:border-[#2a3c32] dark:text-[#a2c89f]'
                                    : 'bg-[#eaf3e6] text-[#2c5f38] hover:bg-[#dbebd5] dark:bg-[#1a3828] dark:text-[#9fe2ab]'
                                }`}
                              >
                                <Check size={14} className="mr-1.5"/>
                                {item.status === 'resolved' ? 'Re-open item' : 'Mark as returned'}
                              </Button>
                            </div>
                          ) : myClaim ? (<Button variant="outline" onClick={() => openExistingChat(myClaim)} className="h-9 w-full rounded-lg border-[#dce5d9] text-xs font-semibold text-[#416245]">
>>>>>>> dec0b634f579602640f3784b12d47a6807ea7e86
                              <MessageCircle size={15} className="mr-2"/> {myClaim.status === 'pending' ? 'Continue conversation' : `Claim ${myClaim.status}`}
                            </Button>) : (<Button onClick={() => void openClaimChat(item)} disabled={!isSupabaseConfigured || busyClaim === item.id || item.status === 'resolved'} className="h-9 w-full rounded-lg bg-[#214b3b] text-xs font-semibold hover:bg-[#2a5a48]">
                              <MessageCircle size={15} className="mr-2"/> {busyClaim === item.id ? 'Opening chat…' : isLost ? 'I found this' : 'This could be mine'}
                            </Button>)}
                        </div>
                      </div>
                    </article>);
            })}
              </div>)}
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#82917f]">Your inbox</p>
                  <h3 className="mt-1 text-lg font-semibold">Claim requests</h3>
                </div>
                <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#eff4ea] text-[#597554]">
                  <Bell size={18}/>
                  {pendingCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#d87654] px-1 text-[9px] font-bold text-white">{pendingCount}</span>}
                </div>
              </div>
              {incomingClaims.length === 0 ? (<div className="mt-5 rounded-xl bg-[#f7f9f5] px-4 py-5 text-center">
                  <MessageCircle size={19} className="mx-auto text-[#9aaa95]"/>
                  <p className="mt-2 text-xs leading-5 text-[#879188]">When someone contacts you about one of your reports, it will appear here.</p>
                </div>) : (<div className="mt-4 space-y-3">
                  {incomingClaims.map((claim) => {
                const report = items.find((item) => item.id === claim.report_id);
                if (!report)
                    return null;
                return (<div key={claim.id} className="rounded-xl border border-[#edf0eb] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#33463a]">{report.title}</p>
                            <p className="mt-0.5 text-[11px] text-[#8b958c]">Request {timeAgo(claim.claimed_at)}</p>
                          </div>
                          <Badge className={`border-0 text-[10px] capitalize ${claim.status === 'pending' ? 'bg-[#fff3dc] text-[#946d26]' : claim.status === 'approved' ? 'bg-[#e8f2e4] text-[#4e744d]' : 'bg-[#f8e9e6] text-[#a0564b]'}`}>{claim.status}</Badge>
                        </div>
                        <Button variant="ghost" onClick={() => openExistingChat(claim)} className="mt-2 h-8 w-full justify-start rounded-lg px-2 text-xs text-[#527450] hover:bg-[#f4f7f1]">
                          <MessageCircle size={14} className="mr-2"/> Open private chat
                        </Button>
                        {claim.status === 'pending' && (<div className="mt-2 grid grid-cols-2 gap-2">
                            <Button disabled={busyClaim === claim.id} onClick={() => void changeClaim(claim, 'approved')} className="h-8 rounded-lg bg-[#e9f2e6] text-[11px] font-semibold text-[#477148] hover:bg-[#dcebd7]"><Check size={13} className="mr-1"/> Verify</Button>
                            <Button disabled={busyClaim === claim.id} onClick={() => void changeClaim(claim, 'rejected')} variant="outline" className="h-8 rounded-lg border-[#eee1de] text-[11px] font-semibold text-[#a45b50] hover:bg-[#fbf1ef]"><X size={13} className="mr-1"/> Decline</Button>
                          </div>)}
                      </div>);
            })}
                </div>)}
            </div>

            <div className="rounded-2xl bg-[#eaf0e5] p-5">
              <div className="flex items-center gap-2 text-[#4d714a]"><ShieldCheck size={17}/><span className="text-sm font-semibold">Safe handover tips</span></div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-[#72836f]">
                <li className="flex gap-2"><span>•</span> Meet in a public campus location.</li>
                <li className="flex gap-2"><span>•</span> Ask for a detail only the owner would know.</li>
                <li className="flex gap-2"><span>•</span> Keep personal contact details private.</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 px-1 text-[11px] text-[#98a197]"><SlidersHorizontal size={13}/> Reports are visible to signed-in KIET members</div>
          </aside>
        </div>

        {activeChat && currentUser && activeChat.claim.id && (<ChatModal item={activeChat.item} claim={activeChat.claim} currentUserId={currentUser.id} open={Boolean(activeChat)} onOpenChange={(open) => { if (!open)
            setActiveChat(null); }}/>)}
      </div>
    </main>);
};
export default Index;
