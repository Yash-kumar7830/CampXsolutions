import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Clock3, MessageCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getMessages, sendMessage, subscribeToMessages } from '@/lib/campusApi';
import { showError } from '@/utils/toast';
const ChatModal = ({ item, claim, currentUserId, open, onOpenChange }) => {
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);
    const claimId = claim.id;
    useEffect(() => {
        if (!open || !claimId)
            return;
        let active = true;
        setLoading(true);
        getMessages(claimId)
            .then((results) => {
            if (active)
                setMessages(results);
        })
            .catch((error) => showError(error instanceof Error ? error.message : 'Could not load messages.'))
            .finally(() => { if (active)
            setLoading(false); });
        const unsubscribe = subscribeToMessages(claimId, (message) => {
            setMessages((existing) => existing.some((entry) => entry.id === message.id) ? existing : [...existing, message]);
        });
        return () => {
            active = false;
            unsubscribe();
        };
    }, [claimId, open]);
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);
    const handleSend = async (event) => {
        event.preventDefault();
        const body = draft.trim();
        if (!claimId || !body || sending)
            return;
        setSending(true);
        try {
            await sendMessage(claimId, currentUserId, body);
            setDraft('');
        }
        catch (error) {
            showError(error instanceof Error ? error.message : 'Message could not be sent.');
        }
        finally {
            setSending(false);
        }
    };
    const stateLabel = claim.status === 'approved' ? 'Claim verified' : claim.status === 'rejected' ? 'Claim declined' : 'Claim pending';
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(680px,88dvh)] max-w-[560px] flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-[#e9ede7] px-5 py-4 text-left">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e9f1e5] text-[#426545]"><MessageCircle size={18}/></div>
            <div>
              <DialogTitle className="text-base text-[#21372a]">{item.title}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-1.5 text-xs">
                <span className={`h-1.5 w-1.5 rounded-full ${claim.status === 'pending' ? 'bg-amber-400' : claim.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-400'}`}/>
                {stateLabel} · {item.location || 'KIET campus'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f8f9f6] px-4 py-5">
          <div className="mx-auto max-w-xs rounded-xl bg-white px-3 py-2 text-center text-[11px] leading-5 text-[#849087] shadow-sm">
            This private chat is only visible to the reporter and claimant. Coordinate a safe campus handover here.
          </div>
          {loading && <p className="py-4 text-center text-xs text-[#829087]">Loading conversation…</p>}
          {!loading && messages.length === 0 && (<p className="py-6 text-center text-sm text-[#829087]">Say hello and coordinate the next step.</p>)}
          {messages.map((message) => {
            const ownMessage = message.sender_id === currentUserId;
            return (<div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${ownMessage ? 'rounded-br-md bg-[#214b3b] text-white' : 'rounded-bl-md border border-[#e8ece5] bg-white text-[#25372d]'}`}>
                  <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.body}</p>
                  <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${ownMessage ? 'text-white/60' : 'text-[#9ba49d]'}`}>
                    {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    {ownMessage && <CheckCheck size={12}/>}
                  </p>
                </div>
              </div>);
        })}
          <div />
        </div>

        {claim.status === 'rejected' ? (<div className="border-t border-[#e9ede7] px-5 py-4 text-center text-sm text-[#7d8980]">This claim was declined. Messaging is closed.</div>) : (<form onSubmit={handleSend} className="flex items-center gap-2 border-t border-[#e9ede7] bg-white p-3">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" maxLength={1000} aria-label="Message" className="h-11 rounded-xl border-[#e1e7df] bg-[#f9faf8] shadow-none focus-visible:ring-[#668362]"/>
            <Button type="submit" size="icon" disabled={!draft.trim() || sending} className="h-11 w-11 shrink-0 rounded-xl bg-[#214b3b] hover:bg-[#2b5d4a]" aria-label="Send message">
              {sending ? <Clock3 size={17}/> : <Send size={17}/>}
            </Button>
          </form>)}
        {claim.status === 'approved' && <div className="flex items-center justify-center gap-1 border-t border-[#edf0eb] py-2 text-[11px] text-[#628163]"><Check size={13}/> The item reporter verified this claim</div>}
      </DialogContent>
    </Dialog>);
};
export default ChatModal;
