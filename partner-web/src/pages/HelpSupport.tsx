import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Smartphone,
  Printer,
  X,
  Loader2,
  Tag,
  AlertTriangle
} from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  timelineJson?: string;
}

interface KBArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
}

export const HelpSupport: React.FC = () => {
  const { user, restaurant } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('ORDERS_KOT');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Detail / Reply Drawer
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  // Selected KB Article Modal
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('dinedeck_token');
      const res = await fetch('/api/support/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error('[HelpSupport] Error loading tickets:', err);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/support/articles');
      const data = await res.json();
      if (data.success && data.data) {
        setArticles(data.data);
      }
    } catch (err) {
      console.error('[HelpSupport] Error loading articles:', err);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchTickets(), fetchArticles()]).finally(() => setIsLoading(false));
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setCreateError('Please provide both an issue title and description.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    // Safe Diagnostic Context (Zero credentials/passwords)
    const diagnosticContext = {
      platform: (window as any).dinedeckDesktop?.isDesktop ? 'WINDOWS_DESKTOP' : 'WEB_BROWSER',
      userAgent: navigator.userAgent,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      restaurantId: restaurant?.id || null,
      restaurantName: restaurant?.name || null,
      staffEmail: user?.email || null,
      staffRole: user?.role || null,
      timestamp: new Date().toISOString()
    };

    try {
      const token = localStorage.getItem('dinedeck_token');
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          priority: newPriority,
          description: newDescription.trim(),
          restaurantId: restaurant?.id,
          diagnosticContext
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        await fetchTickets();
      } else {
        setCreateError(data.message || 'Failed to submit ticket.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error reaching support desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyMessage.trim()) return;
    setIsSendingReply(true);

    try {
      const token = localStorage.getItem('dinedeck_token');
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyMessage.trim() })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setActiveTicket(data.data);
        setReplyMessage('');
        await fetchTickets();
      }
    } catch (err) {
      console.error('[HelpSupport] Reply error:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleReopenTicket = async () => {
    if (!activeTicket) return;
    setIsReopening(true);

    try {
      const token = localStorage.getItem('dinedeck_token');
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reopenReason.trim() || 'Partner requested reopening.' })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setActiveTicket(data.data);
        setReopenReason('');
        await fetchTickets();
      }
    } catch (err) {
      console.error('[HelpSupport] Reopen error:', err);
    } finally {
      setIsReopening(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNumber = t.ticketNumber.toLowerCase().includes(q);
      const matchCategory = t.category.toLowerCase().includes(q);
      return matchTitle || matchNumber || matchCategory;
    }
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'IN_REVIEW':
      case 'ASSIGNED':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#1E293B]/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm dark:shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 dark:border-orange-500/40 flex items-center justify-center text-orange-500 dark:text-orange-400 shadow-md shadow-orange-500/10 dark:shadow-orange-500/20 shrink-0">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Partner Help & Support Desk</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct connection to DineDeck Super Admin Operations, Hardware & Billing Teams
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Knowledge Base Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <BookOpen className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <span>Operational Guides & Troubleshooting</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Official Platform Documentation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E293B]/70 hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition cursor-pointer space-y-2 group shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {art.category}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:translate-x-0.5 transition" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition leading-snug">
                {art.title}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {art.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tickets Management Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Your Restaurant Tickets ({filteredTickets.length})</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket # or subject..."
                className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition w-48 sm:w-64 shadow-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Ticket List Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-[#1E293B]/40 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">All Clear! No Active Tickets</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You do not have any open incidents. If your kitchen, thermal printers, or billing encounters an issue, tap "Raise Support Ticket" above.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTicket(t)}
                className="p-4 rounded-2xl bg-white dark:bg-[#1E293B]/80 hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm dark:shadow-md group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-orange-600 dark:text-orange-400">
                      #{t.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {t.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition truncate">
                    {t.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {t.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-mono">
                    {new Date(t.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Details & Conversation Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#1E293B] border-l border-slate-200 dark:border-slate-700 h-full flex flex-col justify-between p-6 overflow-y-auto space-y-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-orange-600 dark:text-orange-400">
                  #{activeTicket.ticketNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getPriorityBadge(activeTicket.priority)}`}>
                    {activeTicket.priority} Priority
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase ${getStatusBadge(activeTicket.status)}`}>
                    {activeTicket.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {activeTicket.category}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                  {activeTicket.title}
                </h2>
              </div>
            </div>

            {/* Conversation Timeline */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conversation & Diagnostic Timeline
              </div>

              {(() => {
                let timeline: any[] = [];
                try {
                  timeline = activeTicket.timelineJson ? JSON.parse(activeTicket.timelineJson) : [];
                } catch {
                  timeline = [];
                }

                if (timeline.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {activeTicket.description}
                    </div>
                  );
                }

                return timeline.map((msg, idx) => {
                  const isStaff = msg.senderRole !== 'DINEDECK_SUPER_ADMIN';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-3.5 rounded-2xl text-xs space-y-1.5 ${
                        isStaff
                          ? 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 ml-4'
                          : 'bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 text-cyan-900 dark:text-cyan-100 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-orange-600 dark:text-orange-400">
                          {msg.senderName} ({msg.senderRole})
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(msg.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Reply Composer or Reopen Option */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              {activeTicket.status === 'RESOLVED' || activeTicket.status === 'CLOSED' ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs space-y-2">
                  <div className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    This issue was marked resolved by Super Admin
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    If this problem is still occurring or you require additional assistance, you can reopen it below.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Reason for reopening..."
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleReopenTicket}
                      disabled={isReopening}
                      className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isReopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>Reopen</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type reply or provide requested diagnostics to Super Admin..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none shadow-inner"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={isSendingReply || !replyMessage.trim()}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      {isSendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raise Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in zoom-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Submit Support Incident</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Routes to Super Admin 24/7 Operations Team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Incident Subject *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. KDS station 2 not receiving Curry tickets"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ORDERS_KOT">Orders & KOT</option>
                    <option value="KITCHEN_KDS">Kitchen / KDS Station</option>
                    <option value="PRINTERS_DEVICES">Printers & Hardware Fleet</option>
                    <option value="BILLING_PAYMENTS">Billing & Payments</option>
                    <option value="SETTLEMENTS">Settlements & Payouts</option>
                    <option value="MENU_QR">Menu & Table QR</option>
                    <option value="STAFF_IAM">Staff Access & Permissions</option>
                    <option value="TECHNICAL_ERRORS">Technical Errors</option>
                    <option value="OTHER">Other Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Priority / Urgency</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="LOW">Low (Routine query)</option>
                    <option value="MEDIUM">Medium (Minor disruption)</option>
                    <option value="HIGH">High (Kitchen/Billing impacted)</option>
                    <option value="CRITICAL">Critical (Total operations halt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Description & Details *</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide exact details of what happened, table/station affected, and error messages..."
                  rows={3}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>
                  Safe diagnostic metadata (platform, device screen, and restaurant reference) will be automatically attached.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Dispatch Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KB Article Reading Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                {selectedArticle.category}
              </span>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
              {selectedArticle.title}
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 leading-relaxed space-y-2">
              <p>{selectedArticle.content}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
