import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { createMarketplaceListing, getMarketplaceListings, updateMarketplaceListingStatus } from '@/lib/campusApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { showError, showSuccess } from '@/utils/toast';

const initialListing = { title: '', category: '', description: '', price: '', condition: 'good', contact: '' };
const conditions = { new: 'New', like_new: 'Like new', good: 'Good', fair: 'Fair' };

const Marketplace = () => {
    const { currentUser } = useAuth();
    const [listings, setListings] = useState([]);
    const [form, setForm] = useState(initialListing);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('available');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [updating, setUpdating] = useState(null);

    const refresh = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setListings([]);
            setLoading(false);
            return;
        }
        try {
            setListings(await getMarketplaceListings());
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not load student listings.');
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void refresh(); }, [refresh]);

    const visibleListings = useMemo(() => listings.filter((listing) => {
        const text = `${listing.title} ${listing.category} ${listing.description}`.toLowerCase();
        return (filter === 'all' || listing.status === 'active') &&
            text.includes(search.trim().toLowerCase());
    }), [listings, search, filter]);

    const submitListing = async (event) => {
        event.preventDefault();
        if (!currentUser || !isSupabaseConfigured)
            return;
        setSubmitting(true);
        try {
            await createMarketplaceListing(form, currentUser.id);
            setForm(initialListing);
            showSuccess('Your item is now listed in the student marketplace.');
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not publish this listing.');
        }
        finally {
            setSubmitting(false);
        }
    };

    const markSold = async (listing) => {
        setUpdating(listing.id);
        try {
            await updateMarketplaceListingStatus(listing.id, listing.status === 'sold' ? 'active' : 'sold');
            await refresh();
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Could not update this listing.');
        }
        finally {
            setUpdating(null);
        }
    };

    return (
      <main className="min-h-screen bg-[#f7f8f5] pb-20 text-[#1d2d24]">
        <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-7">
          <section className="mb-7 rounded-3xl bg-[#183a2f] p-7 text-white sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c8df9c]">KIET student exchange</p>
            <h1 className="mt-2 text-3xl font-bold">Student marketplace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Buy and sell pre-loved books, gadgets, and campus essentials directly with other students.</p>
          </section>

          {!isSupabaseConfigured && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Marketplace needs a connected Supabase project. Configure the frontend environment variables to publish and browse live listings.</div>}

          <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
            <form onSubmit={submitListing} className="h-fit space-y-4 rounded-2xl border border-[#e9ede7] bg-white p-5">
              <h2 className="text-lg font-semibold">Sell an item</h2>
              <Input aria-label="Item title" placeholder="Item name" minLength={2} maxLength={100} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}/>
              <Input aria-label="Category" placeholder="Category (e.g. Books)" minLength={2} maxLength={50} required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}/>
              <Textarea aria-label="Description" placeholder="Describe the item and its condition" minLength={10} maxLength={1000} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/>
              <div className="grid grid-cols-2 gap-3">
                <Input aria-label="Price in rupees" type="number" min="0" max="1000000" step="1" placeholder="Price (₹)" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })}/>
                <select aria-label="Condition" value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {Object.entries(conditions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <Input aria-label="Contact details" placeholder="Your preferred contact (phone/email)" minLength={3} maxLength={120} required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })}/>
              <p className="text-xs leading-5 text-[#849087]">Contact details are visible to signed-in KIET students. Meet safely in a public campus location.</p>
              <Button type="submit" disabled={!isSupabaseConfigured || submitting} className="w-full rounded-xl bg-[#214b3b] hover:bg-[#2a5a48]">{submitting ? 'Publishing…' : 'Publish listing'}</Button>
            </form>

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <Input aria-label="Search listings" placeholder="Search items..." value={search} onChange={(event) => setSearch(event.target.value)} className="bg-white"/>
                <select aria-label="Listing filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                  <option value="available">Available</option><option value="all">All listings</option>
                </select>
              </div>
              {loading ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#849087]">Loading listings…</p> :
                visibleListings.length === 0 ? <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#849087]">No listings match your search yet.</p> :
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleListings.map((listing) => (
                    <article key={listing.id} className="rounded-2xl border border-[#e9ede7] bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div><h3 className="font-semibold">{listing.title}</h3><p className="mt-1 text-xs text-[#849087]">{listing.category} · {conditions[listing.condition] ?? listing.condition}</p></div>
                        <Badge className={listing.status === 'sold' ? 'bg-gray-100 text-gray-600' : 'bg-[#e7f3e4] text-[#47744a]'}>{listing.status === 'sold' ? 'Sold' : 'Available'}</Badge>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#214b3b]">₹{Number(listing.price).toLocaleString('en-IN')}</p>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-[#718078]">{listing.description}</p>
                      <p className="mt-3 break-words rounded-lg bg-[#f7f9f5] p-3 text-xs text-[#536657]">Contact seller: {listing.contact}</p>
                      {listing.seller_id === currentUser?.id && <Button variant="outline" disabled={updating === listing.id} onClick={() => void markSold(listing)} className="mt-3 w-full">{updating === listing.id ? 'Updating…' : listing.status === 'sold' ? 'Mark available' : 'Mark as sold'}</Button>}
                    </article>
                  ))}
                </div>}
            </section>
          </div>
        </div>
      </main>
    );
};

export default Marketplace;
