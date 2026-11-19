import { supabase } from '@/lib/supabase';
const client = () => {
    if (!supabase) {
        throw new Error('campXsolutions is not connected to Supabase yet. Add the Supabase URL and anon key to .env.local.');
    }
    return supabase;
};
const unwrap = (result) => {
    if (result.error)
        throw new Error(result.error.message);
    return result.data;
};
export async function getItems(userId) {
    const { data, error } = await client()
        .from('items')
        .select('id,type,category,title,description,status,campus_id,created_at,user_id,image_url,location')
        .in('status', ['active', 'resolved', 'archived'])
        .or(`status.eq.active,user_id.eq.${userId}`)
        .order('created_at', { ascending: false });
    return unwrap({ data: (data ?? []), error });
}
export async function archiveOldItems() {
    const { data, error } = await client().rpc('archive_old_unclaimed_items');
    if (error)
        console.warn('Auto-archive check:', error.message);
    return data ?? 0;
}
export async function updateItemStatus(itemId, status, userId) {
    const { data, error } = await client()
        .from('items')
        .update({ status })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data)
        throw new Error('This item could not be found or you do not have permission to update it.');
}
export async function deleteItem(itemId, userId) {
    const { data, error } = await client()
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data)
        throw new Error('This item could not be found or you do not have permission to delete it.');
}
export async function createItem(item) {
    const { error } = await client().from('items').insert({
        type: item.type,
        category: item.category,
        title: item.title,
        description: item.description,
        hidden_detail: item.hidden_detail,
        campus_id: item.campus_id,
        user_id: item.user_id,
        image_url: item.image_url ?? null,
        location: item.location ?? null,
    });
    if (error)
        throw new Error(error.message);
}
export async function createFacilityReport(report) {
    const { error } = await client().from('facility_reports').insert({
        report_type: report.type,
        category: report.category,
        title: report.title.trim(),
        description: report.description.trim(),
        location: report.location.trim() || null,
        priority: report.type === 'issue' ? report.priority : 'normal',
    });
    if (error)
        throw new Error(error.message);
}
export async function getMarketplaceListings() {
    const { data, error } = await client()
        .from('marketplace_listings')
        .select('id,title,category,description,price,condition,contact,status,seller_id,created_at')
        .order('created_at', { ascending: false });
    return unwrap({ data: data ?? [], error });
}
export async function createMarketplaceListing(listing, sellerId) {
    const { error } = await client().from('marketplace_listings').insert({
        title: listing.title.trim(),
        category: listing.category.trim(),
        description: listing.description.trim(),
        price: Number(listing.price),
        condition: listing.condition,
        contact: listing.contact.trim(),
        seller_id: sellerId,
    });
    if (error)
        throw new Error(error.message);
}
export async function updateMarketplaceListingStatus(listingId, status) {
    const { error } = await client()
        .from('marketplace_listings')
        .update({ status })
        .eq('id', listingId);
    if (error)
        throw new Error(error.message);
}
export async function getActiveSurveys() {
    const { data, error } = await client()
        .from('surveys')
        .select('id,title,description,question,options,created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
    return unwrap({ data: data ?? [], error });
}
export async function getMySurveyResponses(userId) {
    const { data, error } = await client()
        .from('survey_responses')
        .select('id,survey_id,answer,created_at')
        .eq('respondent_id', userId);
    return unwrap({ data: data ?? [], error });
}
export async function submitSurveyResponse(surveyId, respondentId, answer) {
    const { error } = await client().from('survey_responses').insert({
        survey_id: surveyId,
        respondent_id: respondentId,
        answer,
    });
    if (error)
        throw new Error(error.message);
}
export async function getFacilityReports() {
    const { data, error } = await client()
        .from('facility_reports')
        .select('id,report_type,category,title,description,location,priority,status,created_at,user_id')
        .order('created_at', { ascending: false });
    return unwrap({ data: data ?? [], error });
}
export async function updateFacilityReportStatus(reportId, status) {
    const { error } = await client()
        .from('facility_reports')
        .update({ status })
        .eq('id', reportId);
    if (error)
        throw new Error(error.message);
}
export async function getAllSurveys() {
    const { data, error } = await client()
        .from('surveys')
        .select('id,title,description,question,options,status,created_at')
        .order('created_at', { ascending: false });
    return unwrap({ data: data ?? [], error });
}
export async function createSurvey(survey, creatorId) {
    const { error } = await client().from('surveys').insert({
        title: survey.title.trim(),
        description: survey.description.trim(),
        question: survey.question.trim(),
        options: survey.options,
        created_by: creatorId,
        status: 'active',
    });
    if (error)
        throw new Error(error.message);
}
export async function updateSurveyStatus(surveyId, status) {
    const { error } = await client()
        .from('surveys')
        .update({ status })
        .eq('id', surveyId);
    if (error)
        throw new Error(error.message);
}
export async function getSurveyResponses(surveyId) {
    const { data, error } = await client()
        .from('survey_responses')
        .select('id,answer,created_at')
        .eq('survey_id', surveyId);
    return unwrap({ data: data ?? [], error });
}
export async function getMyClaims(userId) {
    const db = client();
    const { data: ownItems, error: itemsError } = await db
        .from('items')
        .select('id,title')
        .eq('user_id', userId);
    if (itemsError)
        throw new Error(itemsError.message);
    const itemIds = (ownItems ?? []).map((item) => item.id);
    const [claimsResult, claimantResult] = await Promise.all([
        itemIds.length
            ? db.from('claims').select('id,item_id,claimant_id,status,created_at').in('item_id', itemIds).order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        db.from('claims').select('id,item_id,claimant_id,status,created_at').eq('claimant_id', userId).order('created_at', { ascending: false }),
    ]);
    if (claimsResult.error)
        throw new Error(claimsResult.error.message);
    if (claimantResult.error)
        throw new Error(claimantResult.error.message);
    const names = new Map((ownItems ?? []).map((item) => [item.id, item.title]));
    const claimsById = new Map();
    for (const row of [...(claimsResult.data ?? []), ...(claimantResult.data ?? [])]) {
        const claim = row;
        claimsById.set(claim.id, {
            id: claim.id,
            report_id: claim.item_id,
            claimant_id: claim.claimant_id,
            status: claim.status,
            claimed_at: claim.created_at,
            item_title: names.get(claim.item_id),
        });
    }
    return [...claimsById.values()].sort((a, b) => b.claimed_at.localeCompare(a.claimed_at));
}
export async function startClaim(itemId, claimantId) {
    const db = client();
    const { data: existing, error: lookupError } = await db
        .from('claims')
        .select('id,item_id,claimant_id,status,created_at')
        .eq('item_id', itemId)
        .eq('claimant_id', claimantId)
        .maybeSingle();
    if (lookupError)
        throw new Error(lookupError.message);
    const result = existing
        ? { data: existing, error: null }
        : await db.from('claims')
            .insert({ item_id: itemId, claimant_id: claimantId })
            .select('id,item_id,claimant_id,status,created_at')
            .single();
    const row = unwrap(result);
    return {
        id: row.id,
        report_id: row.item_id,
        claimant_id: row.claimant_id,
        status: row.status,
        claimed_at: row.created_at,
    };
}
export async function updateClaimStatus(claimId, status) {
    const { error } = await client().from('claims').update({ status }).eq('id', claimId);
    if (error)
        throw new Error(error.message);
}
export async function getMessages(claimId) {
    const { data, error } = await client()
        .from('messages')
        .select('id,claim_id,sender_id,body,created_at')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });
    return unwrap({ data: (data ?? []), error });
}
export async function sendMessage(claimId, senderId, body) {
    const { error } = await client().from('messages').insert({ claim_id: claimId, sender_id: senderId, body });
    if (error)
        throw new Error(error.message);
}
export function subscribeToMessages(claimId, onMessage) {
    const channel = client()
        .channel(`claim-messages-${claimId}`)
        .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `claim_id=eq.${claimId}`,
    }, (payload) => onMessage(payload.new))
        .subscribe();
    return () => {
        void client().removeChannel(channel);
    };
}
export function subscribeToItems(onChange) {
    const channel = client()
        .channel('campus-items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, onChange)
        .subscribe();
    return () => {
        void client().removeChannel(channel);
    };
}
export function subscribeToClaims(userId, onChange) {
    const channel = client()
        .channel(`campus-claims-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, onChange)
        .subscribe();
    return () => {
        void client().removeChannel(channel);
    };
}
