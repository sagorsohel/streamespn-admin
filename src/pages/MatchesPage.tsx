import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { ImageUpload } from '../components/ui/ImageUpload';
import {
  Tv,
  RefreshCw,
  Plus,
  Edit3,
  Trash2,
  X,
  Search,
  Trophy,
  Layers,
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
  Image as ImageIcon
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
        api.get('/subcategories'),
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
      let url = '/matches?';
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

  // Delete Match
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;
    try {
      const res = await api.delete(`/matches/${id}`);
      if (res.data?.success) {
        toast.success('Match deleted successfully.');
        fetchMatches();
      }
    } catch (err) {
      toast.error('Failed to delete match.');
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
    const matchSlug = m.slug ? m.slug.toLowerCase().includes(term) : false;

    return matchHome || matchAway || matchTitle || matchVenue || matchCat || matchSlug;
  });

  // Pagination Calculations
  const totalItems = filteredMatches.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedMatches = filteredMatches.slice(startIndex, endIndex);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => setStatusTab('all')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shrink-0 transition-all ${statusTab === 'all'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>All Matches</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('live')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shrink-0 transition-all ${statusTab === 'live'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 animate-pulse'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-rose-400'
              }`}
          >
            <PlayCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>🔴 Live</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTab === 'live' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
              {liveCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('upcoming')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shrink-0 transition-all ${statusTab === 'upcoming'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-indigo-300'
              }`}
          >
            <Clock3 className="h-3.5 w-3.5 text-indigo-400" />
            <span>⏳ Upcoming</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('finished')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shrink-0 transition-all ${statusTab === 'finished'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-emerald-400'
              }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>🏁 Finished</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTab === 'finished' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
              {finishedCount}
            </span>
          </button>
        </div>

        {/* Page Size Selector & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="font-medium">
            Found: <span className="text-white font-bold">{totalItems}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Category Dropdown Selector */}
        <div>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubcategoryId('all');
            }}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 focus:border-rose-500 focus:outline-none"
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
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 focus:border-rose-500 focus:outline-none"
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team, title, slug or venue..."
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

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
              Click "Sync Matches (Today & Tomorrow)" to import Today & Tomorrow matches automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs text-slate-300 min-w-[850px] border-collapse">
              <thead className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 text-center w-16">Copy</th>
                  <th className="py-4 px-4 text-center w-28">Status</th>
                  <th className="py-4 px-4">Match / Event Details</th>
                  <th className="py-4 px-4 w-48">Category & League</th>
                  <th className="py-4 px-4 w-48">Date & Venue</th>
                  <th className="py-4 px-4 w-28 text-center">Stream Link</th>
                  <th className="py-4 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {paginatedMatches.map((m) => {
                  const dateStr = m.matchTime ? new Date(m.matchTime).toISOString().slice(0, 10) : '';
                  const fallbackSlug = m.matchType === 'team_vs_team' ? slugify(`${m.homeTeam}-vs-${m.awayTeam}-${dateStr}`) : slugify(`${m.title || 'match'}-${dateStr}`);
                  const displaySlug = m.slug || fallbackSlug;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/50 transition-colors align-middle">
                      {/* 1. Copy Link Column */}
                      <td className="py-4 px-4 text-center align-middle">
                        <button
                          onClick={() => handleCopyLink(m)}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                            copiedId === m.id
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-900/30'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-rose-500 hover:bg-rose-600 hover:text-white shadow-sm'
                          }`}
                          title={`Copy Link: ${getFullMatchUrl(m)}`}
                        >
                          {copiedId === m.id ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* 2. Status Badge Column */}
                      <td className="py-4 px-4 text-center align-middle">
                        {m.status === 'live' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30 shadow-sm animate-pulse">
                            ● LIVE
                          </span>
                        ) : m.status === 'finished' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-sm">
                            ✓ FINISHED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30 shadow-sm">
                            <Clock3 className="h-3.5 w-3.5 text-indigo-400" /> UPCOMING
                          </span>
                        )}
                      </td>

                      {/* 3. Match / Event Hero Column */}
                      <td className="py-4 px-4 align-middle">
                        {m.matchType === 'team_vs_team' ? (
                          <div className="space-y-1.5">
                            {/* Teams & Scores Row */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {/* Home Team */}
                              <div className="flex items-center gap-2 font-bold text-white text-sm">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 p-1 border border-slate-800 shrink-0">
                                  {m.homeTeamLogo ? (
                                    <img src={m.homeTeamLogo} alt={m.homeTeam || ''} className="h-full w-full object-contain" />
                                  ) : (
                                    <Users className="h-4 w-4 text-slate-500" />
                                  )}
                                </div>
                                <span>{m.homeTeam || 'Home Team'}</span>
                              </div>

                              {/* Scores or VS Badge */}
                              <span className="rounded-md bg-slate-950 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-400 border border-slate-800">
                                {m.homeScore !== null && m.awayScore !== null && m.homeScore !== undefined && m.awayScore !== undefined ? (
                                  <span>{m.homeScore} - {m.awayScore}</span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">VS</span>
                                )}
                              </span>

                              {/* Away Team */}
                              <div className="flex items-center gap-2 font-bold text-white text-sm">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 p-1 border border-slate-800 shrink-0">
                                  {m.awayTeamLogo ? (
                                    <img src={m.awayTeamLogo} alt={m.awayTeam || ''} className="h-full w-full object-contain" />
                                  ) : (
                                    <Users className="h-4 w-4 text-slate-500" />
                                  )}
                                </div>
                                <span>{m.awayTeam || 'Away Team'}</span>
                              </div>
                            </div>

                            {/* Clean Slug Badge */}
                            <div className="flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-800/60 w-fit">
                              <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="truncate max-w-sm">{displaySlug}</span>
                            </div>
                          </div>
                        ) : (
                          /* Title Event Match */
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                              <Award className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-white text-sm">{m.title || 'Title Match Event'}</p>
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Single Title Event</span>
                              <div className="flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-800/60 w-fit">
                                <Globe className="h-3 w-3 text-emerald-400 shrink-0" />
                                <span className="truncate max-w-sm">{displaySlug}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Parent Category & Subcategory Column */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 border border-rose-500/20">
                            <Trophy className="h-3.5 w-3.5 text-rose-400" /> {m.categoryName || 'Sport'}
                          </span>
                          {m.subcategoryName && (
                            <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20 w-fit font-medium">
                              <Layers className="h-3.5 w-3.5 text-indigo-400" /> {m.subcategoryName}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Match Time & Venue Column */}
                      <td className="py-4 px-4 align-middle text-slate-300">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-100 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            <span>{m.matchTime ? new Date(m.matchTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</span>
                          </div>
                          {m.venue ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[150px]">{m.venue}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No Venue Set</span>
                          )}
                        </div>
                      </td>

                      {/* 6. Stream / Referral Link Column */}
                      <td className="py-4 px-4 text-center align-middle">
                        {m.referralLink ? (
                          <a
                            href={m.referralLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-mono text-rose-400 hover:bg-rose-500/20 hover:text-white transition-all shadow-sm"
                          >
                            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>Stream Link</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/50">
                            None
                          </span>
                        )}
                      </td>

                      {/* 7. Action Buttons Column */}
                      <td className="py-4 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(m)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-300 hover:border-rose-500 hover:bg-rose-600 hover:text-white shadow-sm transition-all"
                            title="Edit Match"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 text-slate-400 hover:border-rose-500 hover:bg-rose-900/80 hover:text-rose-300 shadow-sm transition-all"
                            title="Delete Match"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* LUXURY REDESIGNED MODAL WITH SEGMENTED RADIO CARDS & RESPONSIVE LAYOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-xl">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-4 sm:p-6 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 shadow-md shadow-rose-900/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingMatch ? 'Edit Match Event' : 'Add New Custom Match'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure team logos, unique URLs, dates, and media assets</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              
              {/* SECTION 1: MATCH FORMAT SEGMENTED RADIO BUTTON CARDS */}
              <div className="space-y-2">
                <label className="font-bold text-slate-200 text-xs tracking-wide uppercase flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-rose-400" /> Match Format / Event Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, matchType: 'team_vs_team' })}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      formData.matchType === 'team_vs_team'
                        ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-900/20 ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg ${
                      formData.matchType === 'team_vs_team' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}>
                      ⚽
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-white">Team vs Team Match</p>
                      <p className="text-[11px] text-slate-400 truncate">Home vs Away teams with badges & scores</p>
                    </div>
                    {formData.matchType === 'team_vs_team' && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow">
                        ✓
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, matchType: 'title_event' })}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      formData.matchType === 'title_event'
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-900/20 ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-lg ${
                      formData.matchType === 'title_event' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}>
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-white">Title Event Match</p>
                      <p className="text-[11px] text-slate-400 truncate">Single title event (UFC, F1, Boxing, etc.)</p>
                    </div>
                    {formData.matchType === 'title_event' && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold shadow">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* SECTION 2: CATEGORY & SUBCATEGORY SELECTORS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-rose-400" /> Parent Sport Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })}
                    required
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-medium text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="">Select Sport Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.sportName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" /> Subcategory / League
                  </label>
                  <select
                    value={formData.subcategoryId}
                    onChange={(e) => setFormData({ ...formData, subcategoryId: e.target.value })}
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-medium text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="">None / Select Subcategory</option>
                    {availableSubcategoriesInModal.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION 3: TEAM DETAILS OR TITLE INPUT */}
              {formData.matchType === 'team_vs_team' ? (
                <div className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                  <h4 className="font-bold text-slate-200 text-xs tracking-wide uppercase flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-rose-400" /> Teams & Match Details
                  </h4>

                  {/* Team Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">Home Team Name *</label>
                      <input
                        type="text"
                        value={formData.homeTeam}
                        onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                        placeholder="e.g. Manchester United"
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">Away Team Name *</label>
                      <input
                        type="text"
                        value={formData.awayTeam}
                        onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                        placeholder="e.g. Real Madrid"
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Team Logos Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageUpload
                      value={formData.homeTeamLogo}
                      onChange={(url) => setFormData({ ...formData, homeTeamLogo: url })}
                      label="Home Team Logo Badge"
                    />
                    <ImageUpload
                      value={formData.awayTeamLogo}
                      onChange={(url) => setFormData({ ...formData, awayTeamLogo: url })}
                      label="Away Team Logo Badge"
                    />
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">Home Team Score</label>
                      <input
                        type="text"
                        value={formData.homeScore}
                        onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                        placeholder="e.g. 2"
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-mono font-bold text-rose-400 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">Away Team Score</label>
                      <input
                        type="text"
                        value={formData.awayScore}
                        onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                        placeholder="e.g. 1"
                        className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-mono font-bold text-rose-400 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Title Event Input */
                <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-400" /> Title Match Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Formula 1 Grand Prix 2026, UFC 300 Main Card"
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-100 font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* SECTION 4: EDITABLE SLUG & LIVE URL PREVIEW */}
              <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-emerald-400" /> Unique Match URL Slug
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    <Zap className="h-3 w-3" /> Auto-Generate Unique Slug
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                  placeholder="e.g. connecticut-sun-vs-chicago-sky-2026-08-27"
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 font-mono text-[11px] text-slate-400 truncate">
                  Full Web Link:{' '}
                  <span className="text-emerald-400 font-bold">
                    {SITE_URL}/
                    {slugify(categories.find((c) => c.id === Number(formData.categoryId))?.sportName || 'cat')}/
                    {slugify(subcategories.find((s) => s.id === Number(formData.subcategoryId))?.name || 'subcat')}/
                    {formData.slug || 'slug'}
                  </span>
                </div>
              </div>

              {/* SECTION 5: TIME, STATUS & VENUE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-rose-400" /> Match Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.matchTime}
                    onChange={(e) => setFormData({ ...formData, matchTime: e.target.value })}
                    required
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-2 text-slate-100 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Match Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    required
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-100 focus:border-rose-500 focus:outline-none"
                  >
                    <option value="upcoming">⏳ Upcoming</option>
                    <option value="live">🔴 Live</option>
                    <option value="finished">🏁 Finished</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5 text-emerald-400" /> Live Period / Status
                  </label>
                  <input
                    type="text"
                    value={formData.livePeriod}
                    onChange={(e) => setFormData({ ...formData, livePeriod: e.target.value })}
                    placeholder="e.g. 1H, HT, 2H, FT"
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Live Progress / Minute
                  </label>
                  <input
                    type="text"
                    value={formData.liveMinute}
                    onChange={(e) => setFormData({ ...formData, liveMinute: e.target.value })}
                    placeholder="e.g. 45', 74', 90+3"
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" /> Venue / Stadium
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. Old Trafford"
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-slate-100 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 6: CUSTOM MEDIA ASSETS */}
              <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                <h4 className="font-bold text-slate-200 text-xs tracking-wide uppercase flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-indigo-400" /> Custom Media & Banners
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUpload
                    value={formData.playerImage}
                    onChange={(url) => setFormData({ ...formData, playerImage: url })}
                    label="Custom Player Image (Drag & Drop or URL)"
                  />

                  <ImageUpload
                    value={formData.bgImage}
                    onChange={(url) => setFormData({ ...formData, bgImage: url })}
                    label="Custom Background Banner (Drag & Drop or URL)"
                  />
                </div>
              </div>

              {/* SECTION 7: STREAM / REFERRAL LINK */}
              <div className="space-y-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-rose-400" /> Referral / Streaming Link
                </label>
                <input
                  type="url"
                  value={formData.referralLink}
                  onChange={(e) => setFormData({ ...formData, referralLink: e.target.value })}
                  placeholder="https://streamespn.com/live/match-123"
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all"
                >
                  {editingMatch ? 'Save & Lock Changes' : 'Create Match'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
