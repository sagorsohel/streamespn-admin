import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  Tv,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  X,
  Search,
  Trophy,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlayCircle,
  CheckCircle2,
  Clock3,
  Users,
  Award,
  Copy,
  Check,
  Globe,
  Sparkles,
  Zap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://streamespn.com').replace(/\/$/, '');

// Slug generator helper
const slugify = (text: string) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

export interface SportCategory {
  id: number;
  sportName: string;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
}

export interface MatchItem {
  id: number;
  sportsdbEventId?: string | null;
  categoryId: number;
  subcategoryId?: number | null;
  matchType: 'team_vs_team' | 'title_event';
  slug?: string | null;
  title?: string | null;
  homeTeam?: string | null;
  homeTeamLogo?: string | null;
  awayTeam?: string | null;
  awayTeamLogo?: string | null;
  homeScore?: string | null;
  awayScore?: string | null;
  livePeriod?: string | null;
  liveMinute?: string | null;
  matchTime: string;
  status: 'upcoming' | 'live' | 'finished';
  venue?: string | null;
  playerImage?: string | null;
  bgImage?: string | null;
  referralLink?: string | null;
  displayOrder: number;
  isCustomized: boolean;
  categoryName?: string;
  subcategoryName?: string;
}

export const MatchesPage: React.FC = () => {
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [matchesList, setMatchesList] = useState<MatchItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Checkbox Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);

  // Sorting States
  const [sortField, setSortField] = useState<'time' | 'match' | 'category' | 'status' | null>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'emerald' | 'amber';
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'primary',
    loading: false,
    onConfirm: () => {},
  });

  const askConfirm = ({
    title = 'Please Confirm',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    onConfirm,
  }: {
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary' | 'emerald' | 'amber';
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      loading: false,
      onConfirm,
    });
  };

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    subcategoryId: '',
    matchType: 'team_vs_team' as 'team_vs_team' | 'title_event',
    slug: '',
    title: '',
    homeTeam: '',
    homeTeamLogo: '',
    awayTeam: '',
    awayTeamLogo: '',
    homeScore: '',
    awayScore: '',
    livePeriod: '',
    liveMinute: '',
    matchTime: new Date().toISOString().slice(0, 16),
    status: 'upcoming' as 'upcoming' | 'live' | 'finished',
    venue: '',
    playerImage: '',
    bgImage: '',
    referralLink: '',
  });

  // Fetch Categories & Subcategories
  const fetchFilterOptions = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        api.get('/sports'),
        api.get('/subcategories?all=true'),
      ]);

      if (catRes.data?.success) setCategories(catRes.data.data.sports || []);
      if (subRes.data?.success) setSubcategories(subRes.data.data.subcategories || []);
    } catch (err) {
      toast.error('Failed to fetch category options.');
    }
  };

  // Fetch Matches
  const fetchMatches = async () => {
    setLoading(true);
    try {
      let url = '/matches?all=true&';
      if (selectedCategoryId !== 'all') url += `categoryId=${selectedCategoryId}&`;
      if (selectedSubcategoryId !== 'all') url += `subcategoryId=${selectedSubcategoryId}&`;
      if (statusTab !== 'all') url += `status=${statusTab}&`;

      const response = await api.get(url);
      if (response.data?.success) {
        setMatchesList(response.data.data.matches || []);
      }
    } catch (err) {
      toast.error('Failed to fetch matches from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchMatches();
    setCurrentPage(1);
  }, [selectedCategoryId, selectedSubcategoryId, statusTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Copy Full Match Web URL to Clipboard
  const getFullMatchUrl = (m: MatchItem) => {
    const catSlug = slugify(m.categoryName || 'sport');
    const subcatSlug = slugify(m.subcategoryName || 'general');
    const dateStr = m.matchTime ? new Date(m.matchTime).toISOString().slice(0, 10) : '';
    const fallbackSlug = m.matchType === 'team_vs_team' ? slugify(`${m.homeTeam}-vs-${m.awayTeam}-${dateStr}`) : slugify(`${m.title || 'match'}-${dateStr}`);
    const matchSlug = m.slug || fallbackSlug;
    return `${SITE_URL}/${catSlug}/${subcatSlug}/${matchSlug}`;
  };

  const handleCopyLink = (m: MatchItem) => {
    const url = getFullMatchUrl(m);
    navigator.clipboard.writeText(url);
    setCopiedId(m.id);
    toast.success(`Copied match link: ${url}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sync Matches from TheSportsDB (Yesterday, Today, Tomorrow)
  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading('Syncing matches (Yesterday, Today, Tomorrow) from TheSportsDB...');

    try {
      const response = await api.post('/matches/sync');
      if (response.data?.success) {
        toast.success(response.data.message || 'Matches synced successfully!', { id: toastId });
        fetchMatches();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed. Ensure backend is running.', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingMatch(null);
    setFormData({
      categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?.id?.toString() || ''),
      subcategoryId: '',
      matchType: 'team_vs_team',
      slug: '',
      title: '',
      homeTeam: '',
      homeTeamLogo: '',
      awayTeam: '',
      awayTeamLogo: '',
      homeScore: '',
      awayScore: '',
      livePeriod: '',
      liveMinute: '',
      matchTime: new Date().toISOString().slice(0, 16),
      status: 'upcoming',
      venue: '',
      playerImage: '',
      bgImage: '',
      referralLink: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (match: MatchItem) => {
    setEditingMatch(match);

    let formattedTime = new Date().toISOString().slice(0, 16);
    if (match.matchTime) {
      try {
        formattedTime = new Date(match.matchTime).toISOString().slice(0, 16);
      } catch (e) { }
    }

    const dateStr = match.matchTime ? new Date(match.matchTime).toISOString().slice(0, 10) : '';
    const defaultSlug = match.slug || (match.matchType === 'team_vs_team' ? slugify(`${match.homeTeam}-vs-${match.awayTeam}-${dateStr}`) : slugify(`${match.title || 'match'}-${dateStr}`));

    setFormData({
      categoryId: match.categoryId ? match.categoryId.toString() : '',
      subcategoryId: match.subcategoryId ? match.subcategoryId.toString() : '',
      matchType: match.matchType || 'team_vs_team',
      slug: defaultSlug,
      title: match.title || '',
      homeTeam: match.homeTeam || '',
      homeTeamLogo: match.homeTeamLogo || '',
      awayTeam: match.awayTeam || '',
      awayTeamLogo: match.awayTeamLogo || '',
      homeScore: match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : '',
      awayScore: match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : '',
      livePeriod: match.livePeriod || '',
      liveMinute: match.liveMinute || '',
      matchTime: formattedTime,
      status: match.status || 'upcoming',
      venue: match.venue || '',
      playerImage: match.playerImage || '',
      bgImage: match.bgImage || '',
      referralLink: match.referralLink || '',
    });
    setIsModalOpen(true);
  };

  // Auto generate slug in form when team, title or match time changes
  const handleAutoSlug = () => {
    const datePart = formData.matchTime ? formData.matchTime.slice(0, 10) : new Date().toISOString().slice(0, 10);
    if (formData.matchType === 'team_vs_team' && formData.homeTeam && formData.awayTeam) {
      setFormData({ ...formData, slug: slugify(`${formData.homeTeam}-vs-${formData.awayTeam}-${datePart}`) });
    } else if (formData.title) {
      setFormData({ ...formData, slug: slugify(`${formData.title}-${datePart}`) });
    }
  };

  // Submit Create / Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Parent Sport Category is required.');
      return;
    }

    if (formData.matchType === 'team_vs_team' && (!formData.homeTeam.trim() || !formData.awayTeam.trim())) {
      toast.error('Both Home Team and Away Team names are required for Team vs Team matches.');
      return;
    }

    if (formData.matchType === 'title_event' && !formData.title.trim()) {
      toast.error('Title is required for Title Event matches.');
      return;
    }

    try {
      if (editingMatch) {
        const res = await api.put(`/matches/${editingMatch.id}`, formData);
        if (res.data?.success) {
          toast.success('Match updated and locked against sync overwrites!');
        }
      } else {
        const res = await api.post('/matches', formData);
        if (res.data?.success) {
          toast.success('New match created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchMatches();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  // Delete Match with custom ConfirmModal
  const handleDelete = (match: MatchItem) => {
    const matchLabel = match.matchType === 'team_vs_team'
      ? `${match.homeTeam || 'Home'} vs ${match.awayTeam || 'Away'}`
      : (match.title || 'Event');

    askConfirm({
      title: 'Delete Match Event',
      variant: 'danger',
      confirmText: 'Yes, Delete Match',
      message: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>Are you sure you want to permanently delete this match?</p>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
            <p className="font-bold text-white text-sm">{matchLabel}</p>
            <p className="text-[11px] text-rose-300/80 font-mono mt-0.5">
              {match.categoryName || 'Sport'} &bull; {match.subcategoryName || 'General'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">This will remove the match from schedule and public web pages.</p>
        </div>
      ),
      onConfirm: async () => {
        try {
          const res = await api.delete(`/matches/${match.id}`);
          if (res.data?.success) {
            toast.success('Match deleted successfully.');
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(match.id);
              return next;
            });
            fetchMatches();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        } catch (err) {
          toast.error('Failed to delete match.');
        }
      },
    });
  };

  // Bulk Delete Selected Matches
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;

    askConfirm({
      title: `Delete ${count} Matches`,
      variant: 'danger',
      confirmText: `Yes, Delete ${count} Matches`,
      message: (
        <div className="space-y-2 text-xs text-slate-300">
          <p>
            Are you sure you want to permanently delete the{' '}
            <span className="font-bold text-white">{count}</span> selected matches?
          </p>
          <p className="text-rose-400 font-semibold text-[11px]">
            This action is irreversible and will delete them from the database.
          </p>
        </div>
      ),
      onConfirm: async () => {
        setBulkLoading(true);
        try {
          const ids = Array.from(selectedIds);
          await Promise.all(ids.map((id) => api.delete(`/matches/${id}`)));
          toast.success(`Successfully deleted ${count} matches.`);
          setSelectedIds(new Set());
          fetchMatches();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error('Failed to delete some matches.');
        } finally {
          setBulkLoading(false);
        }
      },
    });
  };

  // Bulk Change Status (live, upcoming, finished)
  const handleBulkStatusChange = (newStatus: 'live' | 'upcoming' | 'finished') => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const statusLabel = newStatus.toUpperCase();

    askConfirm({
      title: `Set Status to ${statusLabel}`,
      variant: newStatus === 'live' ? 'danger' : newStatus === 'finished' ? 'emerald' : 'primary',
      confirmText: `Set ${count} Matches to ${statusLabel}`,
      message: (
        <p className="text-xs text-slate-300">
          Change status of <span className="font-bold text-white">{count}</span> selected matches to{' '}
          <span className="font-bold text-white uppercase">{newStatus}</span>?
        </p>
      ),
      onConfirm: async () => {
        setBulkLoading(true);
        try {
          const ids = Array.from(selectedIds);
          await Promise.all(ids.map((id) => api.put(`/matches/${id}`, { status: newStatus })));
          toast.success(`Updated ${count} matches to ${statusLabel}.`);
          setSelectedIds(new Set());
          fetchMatches();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error('Failed to update matches status.');
        } finally {
          setBulkLoading(false);
        }
      },
    });
  };

  // Wipe / Clear All Matches from DB
  const handleClearAllMatches = () => {
    askConfirm({
      title: '⚠️ Wipe All Matches',
      variant: 'danger',
      confirmText: 'Yes, Wipe All Matches',
      message: (
        <div className="space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-rose-300">
            This will permanently delete ALL {matchesList.length} matches and reset subcategory status!
          </p>
          <p className="text-slate-400 text-[11px]">
            Use this if you want to reset everything and start a fresh SportsDB auto-sync.
          </p>
        </div>
      ),
      onConfirm: async () => {
        try {
          const res = await api.delete('/matches/all');
          if (res.data?.success) {
            toast.success(res.data.message || 'All matches wiped successfully.');
            setSelectedIds(new Set());
            fetchMatches();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to wipe matches.');
        }
      },
    });
  };

  // Selection Helpers
  const toggleSelectRow = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Sorting Handler
  const handleSort = (field: 'time' | 'match' | 'category' | 'status') => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Safe Date & Time Formatter
  const formatMatchDate = (isoStr?: string | null) => {
    if (!isoStr) return 'N/A';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'N/A';
    }
  };

  // Filter Subcategories by Selected Category in Form Modal
  const availableSubcategoriesInModal = subcategories.filter(
    (s) => !formData.categoryId || s.categoryId === Number(formData.categoryId)
  );

  // Status Tab Counts
  const totalCount = matchesList.length;
  const liveCount = matchesList.filter((m) => m.status === 'live').length;
  const upcomingCount = matchesList.filter((m) => m.status === 'upcoming').length;
  const finishedCount = matchesList.filter((m) => m.status === 'finished').length;

  // Filter Matches by Search Term
  const filteredMatches = matchesList.filter((m) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchHome = m.homeTeam ? m.homeTeam.toLowerCase().includes(term) : false;
    const matchAway = m.awayTeam ? m.awayTeam.toLowerCase().includes(term) : false;
    const matchTitle = m.title ? m.title.toLowerCase().includes(term) : false;
    const matchVenue = m.venue ? m.venue.toLowerCase().includes(term) : false;
    const matchCat = m.categoryName ? m.categoryName.toLowerCase().includes(term) : false;
    const matchSubcat = m.subcategoryName ? m.subcategoryName.toLowerCase().includes(term) : false;
    const matchSlug = m.slug ? m.slug.toLowerCase().includes(term) : false;

    return matchHome || matchAway || matchTitle || matchVenue || matchCat || matchSubcat || matchSlug;
  });

  // Sort Matches
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (!sortField) return 0;
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'time') {
      valA = a.matchTime ? new Date(a.matchTime).getTime() : 0;
      valB = b.matchTime ? new Date(b.matchTime).getTime() : 0;
    } else if (sortField === 'match') {
      valA = (a.homeTeam || a.title || '').toLowerCase();
      valB = (b.homeTeam || b.title || '').toLowerCase();
    } else if (sortField === 'category') {
      valA = `${a.categoryName || ''} ${a.subcategoryName || ''}`.toLowerCase();
      valB = `${b.categoryName || ''} ${b.subcategoryName || ''}`.toLowerCase();
    } else if (sortField === 'status') {
      const orderMap: Record<string, number> = { live: 1, upcoming: 2, finished: 3 };
      valA = orderMap[a.status] || 4;
      valB = orderMap[b.status] || 4;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Calculations
  const totalItems = sortedMatches.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedMatches = sortedMatches.slice(startIndex, endIndex);

  // Checkbox helpers for current page
  const areAllPageSelected =
    paginatedMatches.length > 0 &&
    paginatedMatches.every((m) => selectedIds.has(m.id));

  const isIndeterminate =
    paginatedMatches.some((m) => selectedIds.has(m.id)) && !areAllPageSelected;

  const toggleSelectAllCurrentPage = () => {
    const next = new Set(selectedIds);
    if (areAllPageSelected) {
      paginatedMatches.forEach((m) => next.delete(m.id));
    } else {
      paginatedMatches.forEach((m) => next.add(m.id));
    }
    setSelectedIds(next);
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredMatches.forEach((m) => next.add(m.id));
    setSelectedIds(next);
  };

  // Numeric 1 2 3 4 5... Page Numbers Generator
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, validCurrentPage - 2);
      let end = Math.min(totalPages, validCurrentPage + 2);

      if (validCurrentPage <= 3) {
        start = 1;
        end = maxButtons;
      } else if (validCurrentPage >= totalPages - 2) {
        start = totalPages - maxButtons + 1;
        end = totalPages;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Mobile Responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <Tv className="h-4 w-4" /> Live Matches Management
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">Sports Matches & Streaming Events</h1>
          <p className="text-xs text-slate-400">
            Auto-sync Yesterday, Today & Tomorrow matches from SportsDB with scores, team logos & unique links.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {matchesList.length > 0 && (
            <button
              onClick={handleClearAllMatches}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20"
              title="Wipe all matches from database and reset subcategory status"
            >
              <Trash2 className="h-4 w-4" />
              <span>Wipe All</span>
            </button>
          )}

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Matches (Today & Tomorrow)'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500"
          >
            <Plus className="h-4 w-4" /> Add Match
          </button>
        </div>
      </div>

      {/* STATUS FILTER TABS - Mobile Scrollable */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 max-w-full no-scrollbar">
          <button
            onClick={() => setStatusTab('all')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${statusTab === 'all'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 border border-rose-500'
              : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-700/60'
              }`}
          >
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span>All Matches</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${statusTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('live')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${statusTab === 'live'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 border border-rose-500 animate-pulse'
              : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-rose-400 hover:border-slate-700/60'
              }`}
          >
            <PlayCircle className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'live' ? 'text-white' : 'text-rose-400'}`} />
            <span>Live</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${statusTab === 'live' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
              }`}>
              {liveCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('upcoming')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${statusTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 border border-indigo-500'
              : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-indigo-300 hover:border-slate-700/60'
              }`}
          >
            <Clock3 className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'upcoming' ? 'text-white' : 'text-indigo-400'}`} />
            <span>Upcoming</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${statusTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
              }`}>
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('finished')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${statusTab === 'finished'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 border border-emerald-500'
              : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-emerald-400 hover:border-slate-700/60'
              }`}
          >
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'finished' ? 'text-white' : 'text-emerald-400'}`} />
            <span>Finished</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${statusTab === 'finished' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              }`}>
              {finishedCount}
            </span>
          </button>
        </div>

        {/* Page Size Selector & Count */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400 shrink-0 self-end lg:self-auto">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-800 bg-slate-900/90 px-2 text-xs font-semibold text-slate-200 focus:border-rose-500 focus:outline-none cursor-pointer hover:border-slate-700 transition-all"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Found:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 text-xs">
              {totalItems}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Category Dropdown Selector */}
        <div>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubcategoryId('all');
            }}
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 text-xs font-semibold text-slate-200 focus:border-rose-500 focus:outline-none hover:border-slate-700 transition-all"
          >
            <option value="all">🌐 All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                ⚽ {cat.sportName}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Dropdown Selector */}
        <div>
          <select
            value={selectedSubcategoryId}
            onChange={(e) => setSelectedSubcategoryId(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 text-xs font-semibold text-slate-200 focus:border-rose-500 focus:outline-none hover:border-slate-700 transition-all"
          >
            <option value="all">🏆 All Subcategories</option>
            {subcategories
              .filter((s) => selectedCategoryId === 'all' || s.categoryId === Number(selectedCategoryId))
              .map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team, title, slug or venue..."
            className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-8.5 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 hover:border-slate-700 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SORT INDICATOR CHIP */}
      {sortField && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSortField(null);
              setSortOrder('asc');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/25 transition-all cursor-pointer"
            title="Click to reset sorting"
          >
            <span>
              Sorted by: <span className="font-bold text-white capitalize">{sortField === 'time' ? 'Date & Time' : sortField}</span> ({sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'})
            </span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* BULK SELECTION ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 p-3 sm:px-5 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-xs font-black text-white shadow-md shadow-rose-600/40">
              {selectedIds.size}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {selectedIds.size} {selectedIds.size === 1 ? 'match' : 'matches'} selected
                </span>
                <span className="text-[10px] text-slate-400">
                  (out of {filteredMatches.length} filtered)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {selectedIds.size < filteredMatches.length ? (
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
                  >
                    Select all {filteredMatches.length} filtered matches
                  </button>
                ) : (
                  <span className="text-emerald-400 font-semibold">✓ All {filteredMatches.length} filtered matches selected</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Status Changers */}
            <div className="inline-flex rounded-xl border border-slate-700/80 bg-slate-950/70 p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => handleBulkStatusChange('live')}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="Mark selected matches as LIVE"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>Set Live</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('upcoming')}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="Mark selected matches as UPCOMING"
              >
                <Clock3 className="h-3 w-3 text-indigo-400" />
                <span>Set Upcoming</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange('finished')}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="Mark selected matches as FINISHED"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Set Finished</span>
              </button>
            </div>

            {/* Bulk Delete Button */}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-600/20 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-md shadow-rose-950/30 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete ({selectedIds.size})</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* LUXURY ALIGNED & HIGH CONTRAST MATCHES TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin text-rose-500" /> Loading matches...
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Tv className="h-10 w-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No matches found</p>
            <p className="text-xs text-slate-500">
              {searchTerm
                ? `No matches matching "${searchTerm}". Try clearing the search or filters.`
                : 'Click "Sync Matches" to import matches from SportsDB automatically.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-300 min-w-[900px] border-collapse">
              <thead className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                <tr>
                  {/* 0. Master Checkbox */}
                  <th className="py-2.5 px-3 w-10 text-center select-none">
                    <input
                      type="checkbox"
                      checked={areAllPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={toggleSelectAllCurrentPage}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 accent-rose-600 focus:ring-0 focus:outline-none cursor-pointer"
                      title={areAllPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                    />
                  </th>

                  {/* 1. Status */}
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 w-28 text-center cursor-pointer hover:text-white transition-colors group select-none"
                    title="Click to sort by Status"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span className={sortField === 'status' ? 'text-rose-400 font-bold' : ''}>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 2. Match / Event Details */}
                  <th
                    onClick={() => handleSort('match')}
                    className="py-2.5 px-3 min-w-[280px] cursor-pointer hover:text-white transition-colors group select-none"
                    title="Click to sort alphabetically by Match"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={sortField === 'match' ? 'text-rose-400 font-bold' : ''}>Match / Event Details</span>
                      {sortField === 'match' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 3. Category & League */}
                  <th
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 w-44 cursor-pointer hover:text-white transition-colors group select-none"
                    title="Click to sort by Category & League"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={sortField === 'category' ? 'text-rose-400 font-bold' : ''}>Category & League</span>
                      {sortField === 'category' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 4. Date & Venue */}
                  <th
                    onClick={() => handleSort('time')}
                    className="py-2.5 px-3 w-40 cursor-pointer hover:text-white transition-colors group select-none"
                    title="Click to sort by Date / Time"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={sortField === 'time' ? 'text-rose-400 font-bold' : ''}>Date & Venue</span>
                      {sortField === 'time' ? (
                        sortOrder === 'desc' ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 border border-rose-500/30 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                            <ArrowDown className="h-2.5 w-2.5 text-rose-400 shrink-0" />
                            <span>New</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 border border-rose-500/30 px-1 py-0.2 text-[9px] font-bold text-rose-300">
                            <ArrowUp className="h-2.5 w-2.5 text-rose-400 shrink-0" />
                            <span>Old</span>
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 5. Stream Link */}
                  <th className="py-2.5 px-3 w-24 text-center">Stream</th>

                  {/* 6. Actions */}
                  <th className="py-2.5 px-3 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedMatches.map((m) => {
                  const dateStr = m.matchTime ? new Date(m.matchTime).toISOString().slice(0, 10) : '';
                  const fallbackSlug = m.matchType === 'team_vs_team'
                    ? slugify(`${m.homeTeam}-vs-${m.awayTeam}-${dateStr}`)
                    : slugify(`${m.title || 'match'}-${dateStr}`);
                  const displaySlug = m.slug || fallbackSlug;
                  const isSelected = selectedIds.has(m.id);

                  return (
                    <tr
                      key={m.id}
                      className={`transition-colors align-middle ${
                        isSelected
                          ? 'bg-rose-500/[0.08] hover:bg-rose-500/[0.12]'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* 0. Row Checkbox */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(m.id)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 accent-rose-600 focus:ring-0 focus:outline-none cursor-pointer"
                        />
                      </td>

                      {/* 1. Status Column */}
                      <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap">
                        {m.status === 'live' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30 shadow-sm animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>LIVE</span>
                            {m.liveMinute && <span className="font-mono text-rose-300">({m.liveMinute}')</span>}
                          </span>
                        ) : m.status === 'finished' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700/60">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            <span>FT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                            <Clock3 className="h-3 w-3 text-indigo-400" />
                            <span>UPCOMING</span>
                          </span>
                        )}
                      </td>

                      {/* 2. Match / Event Hero Column */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="space-y-1">
                          {m.matchType === 'team_vs_team' ? (
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              {/* Home Team */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-950 p-0.5 border border-slate-800 shrink-0">
                                  {m.homeTeamLogo ? (
                                    <img src={m.homeTeamLogo} alt="" className="h-full w-full object-contain" />
                                  ) : (
                                    <Users className="h-3 w-3 text-slate-600" />
                                  )}
                                </div>
                                <span className="font-semibold text-white text-xs truncate max-w-[130px] sm:max-w-[160px]" title={m.homeTeam || ''}>
                                  {m.homeTeam || 'Home'}
                                </span>
                              </div>

                              {/* Scores or VS Badge */}
                              <span className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-400 border border-slate-800 shrink-0">
                                {m.homeScore !== null && m.awayScore !== null && m.homeScore !== undefined && m.awayScore !== undefined ? (
                                  <span>{m.homeScore} - {m.awayScore}</span>
                                ) : (
                                  <span className="text-slate-500 text-[10px] font-sans">VS</span>
                                )}
                              </span>

                              {/* Away Team */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-950 p-0.5 border border-slate-800 shrink-0">
                                  {m.awayTeamLogo ? (
                                    <img src={m.awayTeamLogo} alt="" className="h-full w-full object-contain" />
                                  ) : (
                                    <Users className="h-3 w-3 text-slate-600" />
                                  )}
                                </div>
                                <span className="font-semibold text-white text-xs truncate max-w-[130px] sm:max-w-[160px]" title={m.awayTeam || ''}>
                                  {m.awayTeam || 'Away'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Title Event Match */
                            <div className="flex items-center gap-2">
                              <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                                <Award className="h-3 w-3" />
                              </div>
                              <span className="font-semibold text-white text-xs truncate max-w-[280px]" title={m.title || ''}>
                                {m.title || 'Event'}
                              </span>
                            </div>
                          )}

                          {/* Clean Slug Badge with Instant Copy Button */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(m)}
                              className="group/slug inline-flex items-center gap-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400 border border-slate-800/70 hover:border-emerald-500/40 transition-all cursor-pointer"
                              title={`Click to copy: ${getFullMatchUrl(m)}`}
                            >
                              <Globe className="h-2.5 w-2.5 text-emerald-400/80 group-hover/slug:text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[200px] sm:max-w-[260px]">{displaySlug}</span>
                              {copiedId === m.id ? (
                                <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0 ml-0.5" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 opacity-40 group-hover/slug:opacity-100 shrink-0 ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 3. Category & League Column */}
                      <td className="py-2.5 px-3 align-middle">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/20 shrink-0">
                              <Trophy className="h-2.5 w-2.5 text-rose-400" />
                              <span>{m.categoryName || 'Sport'}</span>
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-300 truncate max-w-[170px]" title={m.subcategoryName || ''}>
                            {m.subcategoryName || <span className="text-slate-600">—</span>}
                          </div>
                        </div>
                      </td>

                      {/* 4. Match Time & Venue Column */}
                      <td className="py-2.5 px-3 align-middle text-slate-300">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-200">
                            <Calendar className="h-3 w-3 text-rose-400 shrink-0" />
                            <span>{formatMatchDate(m.matchTime)}</span>
                          </div>
                          {m.venue ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[150px]" title={m.venue}>
                              <MapPin className="h-2.5 w-2.5 text-slate-500 shrink-0" />
                              <span className="truncate">{m.venue}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* 5. Stream / Referral Link Column */}
                      <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap">
                        {m.referralLink ? (
                          <a
                            href={m.referralLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/20 hover:text-white transition-all shadow-sm"
                            title={m.referralLink}
                          >
                            <LinkIcon className="h-3 w-3" />
                            <span>Watch</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* 6. Action Buttons Column */}
                      <td className="py-2.5 px-3 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyLink(m)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                              copiedId === m.id
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-400'
                            }`}
                            title="Copy Match URL"
                          >
                            {copiedId === m.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-indigo-500/60 hover:bg-indigo-500/15 hover:text-indigo-300 transition-all"
                            title="Edit Match"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:border-rose-500/60 hover:bg-rose-500/15 hover:text-rose-400 transition-all"
                            title="Delete Match"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER - Responsive */}
        {!loading && totalItems > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 bg-slate-950/90 px-4 sm:px-6 py-4">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Showing <span className="font-semibold text-white">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-white">{endIndex}</span> of{' '}
              <span className="font-semibold text-white">{totalItems}</span> entries
            </div>

            <div className="flex items-center justify-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={validCurrentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`dots-${idx}`} className="px-1 text-slate-500 font-bold">...</span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-bold transition-all ${validCurrentPage === page
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LUXURY EXPANDED MODAL WITH 2-COLUMN DASHBOARD LAYOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 md:p-6 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-800/90 bg-slate-900/95 shadow-2xl shadow-rose-950/20 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 sm:px-7 py-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-lg shadow-rose-950/40 border border-rose-400/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                      {editingMatch ? 'Edit Match Event' : 'Add New Custom Match'}
                    </h3>
                    <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                      {formData.matchType === 'team_vs_team' ? 'Team Fixture' : 'Title Event'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure team rosters, live scores, unique slugs, broadcast links & banners
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-6 text-xs">
              
              {/* SECTION 1: MATCH FORMAT SELECTOR CARDS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-rose-400" /> Match Format / Event Type <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Select match structure</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Team vs Team Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, matchType: 'team_vs_team' })}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.matchType === 'team_vs_team'
                        ? 'border-rose-500/80 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent text-white shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/40'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-xl transition-transform ${
                      formData.matchType === 'team_vs_team' ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-md shadow-rose-900/40 scale-105' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                      ⚽
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs ${formData.matchType === 'team_vs_team' ? 'text-white' : 'text-slate-300'}`}>
                        Team vs Team Match
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Home vs Away lineups with team logos & live scores
                      </p>
                    </div>
                    {formData.matchType === 'team_vs_team' && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black shadow-md shadow-rose-900/50">
                        ✓
                      </span>
                    )}
                  </button>

                  {/* Title Event Option */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, matchType: 'title_event' })}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      formData.matchType === 'title_event'
                        ? 'border-amber-500/80 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent text-white shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-xl transition-transform ${
                      formData.matchType === 'title_event' ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-900/40 scale-105' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs ${formData.matchType === 'title_event' ? 'text-white' : 'text-slate-300'}`}>
                        Title Event Match
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Single title event (UFC 300, Formula 1, Boxing Championship)
                      </p>
                    </div>
                    {formData.matchType === 'title_event' && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shadow-md shadow-amber-900/50">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2-COLUMN MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* === LEFT COLUMN: TEAMS / EVENT & SLUG (7 Cols) === */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* CARD: TEAMS FIXTURE OR TITLE EVENT */}
                  {formData.matchType === 'team_vs_team' ? (
                    <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 sm:p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
                        <h4 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-rose-400" /> Match Lineup & Live Scores
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">Home vs Away</span>
                      </div>

                      {/* Visual Fixture Matchup Box */}
                      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-start">
                        {/* Home Team Column (5 cols) */}
                        <div className="md:col-span-5 space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-rose-500" /> Home Team <span className="text-rose-400">*</span>
                            </span>
                            <span className="text-[10px] text-slate-500">Host</span>
                          </div>

                          <input
                            type="text"
                            value={formData.homeTeam}
                            onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                            placeholder="e.g. Manchester City"
                            className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 font-semibold focus:border-rose-500 focus:outline-none"
                          />

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Home Score</label>
                            <input
                              type="text"
                              value={formData.homeScore}
                              onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                              placeholder="0"
                              className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono font-bold text-sm text-amber-400 text-center focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <ImageUpload
                            value={formData.homeTeamLogo}
                            onChange={(url) => setFormData({ ...formData, homeTeamLogo: url })}
                            label="Home Team Logo"
                          />
                        </div>

                        {/* Center VS Indicator (1 col) */}
                        <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-1.5 py-2 md:py-8 self-center">
                          <div className="h-8 w-8 rounded-full bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-[10px] font-black text-rose-400 shadow-md">
                            VS
                          </div>
                        </div>

                        {/* Away Team Column (5 cols) */}
                        <div className="md:col-span-5 space-y-3 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Away Team <span className="text-rose-400">*</span>
                            </span>
                            <span className="text-[10px] text-slate-500">Visitor</span>
                          </div>

                          <input
                            type="text"
                            value={formData.awayTeam}
                            onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                            placeholder="e.g. Real Madrid"
                            className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 font-semibold focus:border-rose-500 focus:outline-none"
                          />

                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Away Score</label>
                            <input
                              type="text"
                              value={formData.awayScore}
                              onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                              placeholder="0"
                              className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono font-bold text-sm text-amber-400 text-center focus:border-rose-500 focus:outline-none"
                            />
                          </div>

                          <ImageUpload
                            value={formData.awayTeamLogo}
                            onChange={(url) => setFormData({ ...formData, awayTeamLogo: url })}
                            label="Away Team Logo"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Title Event Card */
                    <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 sm:p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
                        <label className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-amber-400" /> Title Match Event Name <span className="text-rose-400">*</span>
                        </label>
                        <span className="text-[10px] text-amber-400 font-bold uppercase">Single Event</span>
                      </div>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Formula 1 Monaco Grand Prix 2026, UFC 310 Championship"
                        className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 text-sm text-slate-100 font-bold focus:border-amber-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400">
                        For single headline competitions with multiple racers, fighters, or general championship events.
                      </p>
                    </div>
                  )}

                  {/* CARD: UNIQUE URL SLUG & LIVE PREVIEW */}
                  <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 sm:p-5 space-y-3 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-800/70 pb-3">
                      <label className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-emerald-400" /> Unique Match URL Slug
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoSlug}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> Auto-Generate From Match Details
                      </button>
                    </div>

                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                      placeholder="e.g. manchester-city-vs-real-madrid-2026-09-24"
                      className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />

                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-2.5 font-mono text-[11px] text-slate-300">
                      <Globe className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <div className="truncate flex-1">
                        <span className="text-slate-500">Live Web URL: </span>
                        <span className="text-emerald-400 font-semibold">
                          {SITE_URL}/
                          {slugify(categories.find((c) => c.id === Number(formData.categoryId))?.sportName || 'cat')}/
                          {slugify(subcategories.find((s) => s.id === Number(formData.subcategoryId))?.name || 'subcat')}/
                          {formData.slug || 'slug'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* === RIGHT COLUMN: CLASSIFICATION, TIMING & MEDIA (5 Cols) === */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* CARD: CATEGORY & SUBCATEGORY / LEAGUE */}
                  <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <h4 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/70 pb-3">
                      <Trophy className="h-4 w-4 text-rose-400" /> Sport & League Classification
                    </h4>

                    {/* Category Selector */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 flex items-center justify-between text-xs">
                        <span>Parent Sport Category <span className="text-rose-400">*</span></span>
                        <span className="text-[10px] text-slate-500">Required</span>
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                        required
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-semibold text-xs text-slate-100 focus:border-rose-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">Select Sport Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            ⚽ {cat.sportName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory / League Selector */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 flex items-center justify-between text-xs">
                        <span>Subcategory / League</span>
                        <span className="text-[10px] text-slate-500">Optional</span>
                      </label>
                      <select
                        value={formData.subcategoryId}
                        onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-semibold text-xs text-slate-100 focus:border-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">None / Select Subcategory</option>
                        {availableSubcategoriesInModal.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            🏆 {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CARD: TIMING, STATUS & VENUE */}
                  <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <h4 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/70 pb-3">
                      <Calendar className="h-4 w-4 text-rose-400" /> Match Schedule & Live Progress
                    </h4>

                    {/* Date Time Picker */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 flex items-center gap-1 text-xs">
                        <Clock3 className="h-3.5 w-3.5 text-rose-400" /> Match Time <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.matchTime}
                        onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })}
                        required
                        className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    {/* Status Segmented Buttons */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 text-xs">Match Status <span className="text-rose-400">*</span></label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'upcoming' })}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            formData.status === 'upcoming'
                              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-sm ring-1 ring-indigo-500/30'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Clock3 className="h-3.5 w-3.5" />
                          <span>Upcoming</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'live' })}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            formData.status === 'live'
                              ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-sm ring-1 ring-rose-500/30 animate-pulse'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                          <span>Live</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'finished' })}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            formData.status === 'finished'
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Finished</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Period & Live Minute side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 text-xs">Period / Half</label>
                        <input
                          type="text"
                          value={formData.livePeriod}
                          onChange={(e) => setFormData({ ...formData, livePeriod: e.target.value })}
                          placeholder="e.g. 1H, HT, 2H, Q3"
                          className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono font-bold text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-300 text-xs">Minute / Progress</label>
                        <input
                          type="text"
                          value={formData.liveMinute}
                          onChange={(e) => setFormData({ ...formData, liveMinute: e.target.value })}
                          placeholder="e.g. 45', 78', 90+2"
                          className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono font-bold text-xs text-amber-400 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Venue */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-300 flex items-center gap-1 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> Venue / Stadium
                      </label>
                      <input
                        type="text"
                        value={formData.venue}
                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                        placeholder="e.g. Wembley Stadium, London"
                        className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* CARD: STREAMING & MEDIA ASSETS */}
                  <div className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <h4 className="font-bold text-slate-200 text-xs tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/70 pb-3">
                      <LinkIcon className="h-4 w-4 text-rose-400" /> Streaming Link & Media Assets
                    </h4>

                    {/* Referral / Stream Link */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 text-xs">Streaming / Referral URL</label>
                      <input
                        type="url"
                        value={formData.referralLink}
                        onChange={(e) => setFormData({ ...formData, referralLink: e.target.value })}
                        placeholder="https://streamespn.com/live/stream-abc"
                        className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 font-mono text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    {/* Media Uploads: Player Image & BG Banner */}
                    <div className="space-y-3 pt-1">
                      <ImageUpload
                        value={formData.playerImage}
                        onChange={(url) => setFormData({ ...formData, playerImage: url })}
                        label="Featured Player Banner (Optional)"
                      />

                      <ImageUpload
                        value={formData.bgImage}
                        onChange={(url) => setFormData({ ...formData, bgImage: url })}
                        label="Match Background Banner (Optional)"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* STICKY MODAL FOOTER */}
              <div className="sticky bottom-0 -mx-5 sm:-mx-7 -mb-6 mt-6 border-t border-slate-800/90 bg-slate-950/90 px-5 sm:px-7 py-4 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  {editingMatch ? (
                    <span className="text-amber-400 font-semibold">Editing locked match event #{editingMatch.id}</span>
                  ) : (
                    <span>Ready to create new sports match</span>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/50 hover:from-rose-500 hover:to-rose-400 transition-all cursor-pointer"
                  >
                    {editingMatch ? 'Save & Lock Changes' : 'Create Match'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        loading={confirmModal.loading || bulkLoading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
