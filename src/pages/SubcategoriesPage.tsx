import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { ImageUpload } from '../components/ui/ImageUpload';
import { 
  Layers, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Search, 
  Trophy,
  ToggleLeft,
  ToggleRight,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  XCircle,
  Filter,
  Flame
} from 'lucide-react';

export interface SportCategory {
  id: number;
  sportName: string;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  logoUrl: string | null;
  status: boolean; // ON (true) or OFF (false)
  isTrending?: boolean; // Default false
  displayOrder: number;
  isCustomized: boolean;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const SubcategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Status Filter Tab State ('all' | 'active' | 'inactive')
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'inactive'>('all');

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubcat, setEditingSubcat] = useState<Subcategory | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    logoUrl: '',
    status: false, // Default OFF
  });

  // Fetch Sports Categories for Filter & Dropdown
  const fetchCategories = async () => {
    try {
      const response = await api.get('/sports');
      if (response.data?.success) {
        setCategories(response.data.data.sports || []);
      }
    } catch (err) {
      toast.error('Failed to fetch parent sports categories.');
    }
  };

  // Fetch Subcategories
  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const url = selectedCategoryId !== 'all' 
        ? `/subcategories?categoryId=${selectedCategoryId}&all=true` 
        : '/subcategories?all=true';
      const response = await api.get(url);
      if (response.data?.success) {
        setSubcategories(response.data.data.subcategories || []);
      }
    } catch (err) {
      toast.error('Failed to fetch subcategories from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSubcategories();
    setCurrentPage(1); // Reset page on category filter change
  }, [selectedCategoryId]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on search or status tab change
  }, [searchTerm, statusTab, itemsPerPage]);

  // Toggle ON / OFF Status
  const handleToggleStatus = async (subcat: Subcategory) => {
    const originalStatus = subcat.status;
    const newStatus = !originalStatus;

    // Optimistic UI update
    setSubcategories((prev) =>
      prev.map((item) => (item.id === subcat.id ? { ...item, status: newStatus } : item))
    );

    try {
      const response = await api.patch(`/subcategories/${subcat.id}/toggle`);
      if (response.data?.success) {
        toast.success(
          `"${subcat.name}" is now ${newStatus ? 'ON (Active)' : 'OFF (Inactive)'}`
        );
      }
    } catch (err: any) {
      // Rollback on error
      setSubcategories((prev) =>
        prev.map((item) => (item.id === subcat.id ? { ...item, status: originalStatus } : item))
      );
      toast.error('Failed to toggle status.');
    }
  };

  // Toggle Trending Status (by default all false)
  const handleToggleTrending = async (subcat: Subcategory) => {
    const originalTrending = !!subcat.isTrending;
    const newTrending = !originalTrending;

    // Optimistic UI update
    setSubcategories((prev) =>
      prev.map((item) => (item.id === subcat.id ? { ...item, isTrending: newTrending } : item))
    );

    try {
      const response = await api.patch(`/subcategories/${subcat.id}/toggle-trending`);
      if (response.data?.success) {
        toast.success(
          `"${subcat.name}" trending set to ${newTrending ? 'ON 🔥 (Shown in Trending List)' : 'OFF (Normal)'}`
        );
      }
    } catch (err: any) {
      // Rollback on error
      setSubcategories((prev) =>
        prev.map((item) => (item.id === subcat.id ? { ...item, isTrending: originalTrending } : item))
      );
      toast.error('Failed to toggle trending status.');
    }
  };

  // Sync Subcategories / Leagues from TheSportsDB
  const handleSync = async () => {
    if (selectedCategoryId === 'all') {
      toast.error('Please select a specific parent category (e.g. Soccer) to sync subcategories.');
      return;
    }

    const categoryObj = categories.find((c) => c.id === Number(selectedCategoryId));
    const catName = categoryObj ? categoryObj.sportName : 'Category';

    setSyncing(true);
    const toastId = toast.loading(`Syncing subcategories for "${catName}"...`);

    try {
      const response = await api.post('/subcategories/sync', {
        categoryId: Number(selectedCategoryId),
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Subcategories synced!', { id: toastId });
        fetchSubcategories();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed.', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingSubcat(null);
    setFormData({
      categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : (categories[0]?.id?.toString() || ''),
      name: '',
      logoUrl: '',
      status: false, // Default OFF
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (subcat: Subcategory) => {
    setEditingSubcat(subcat);
    setFormData({
      categoryId: subcat.categoryId.toString(),
      name: subcat.name || '',
      logoUrl: subcat.logoUrl || '',
      status: subcat.status,
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error('Subcategory Name and Parent Category are required.');
      return;
    }

    try {
      if (editingSubcat) {
        const res = await api.put(`/subcategories/${editingSubcat.id}`, formData);
        if (res.data?.success) {
          toast.success('Subcategory updated successfully!');
        }
      } else {
        const res = await api.post('/subcategories', formData);
        if (res.data?.success) {
          toast.success('Subcategory created successfully (Status: OFF)!');
        }
      }
      setIsModalOpen(false);
      fetchSubcategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  // Delete Subcategory
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete subcategory "${name}"?`)) return;
    try {
      const res = await api.delete(`/subcategories/${id}`);
      if (res.data?.success) {
        toast.success(`Subcategory "${name}" deleted.`);
        fetchSubcategories();
      }
    } catch (err) {
      toast.error('Failed to delete subcategory.');
    }
  };

  // Status Tab Counts
  const totalCount = subcategories.length;
  const activeCount = subcategories.filter((s) => s.status).length;
  const inactiveCount = subcategories.filter((s) => !s.status).length;

  // Filter Subcategories by Status Tab & Search Term
  const filteredSubcategories = subcategories.filter((item) => {
    // 1. Status Filter Tab
    if (statusTab === 'active' && !item.status) return false;
    if (statusTab === 'inactive' && item.status) return false;

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(term);
      const matchCat = item.categoryName ? item.categoryName.toLowerCase().includes(term) : false;
      return matchName || matchCat;
    }

    return true;
  });

  // Pagination Calculations
  const totalItems = filteredSubcategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSubcategories = filteredSubcategories.slice(startIndex, endIndex);

  // Generate 1, 2, 3, 4, 5 Page Buttons List
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
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <Layers className="h-4 w-4" /> Subcategory Management
          </div>
          <h1 className="text-xl font-extrabold text-white">Sports Subcategories & Leagues</h1>
          <p className="text-xs text-slate-400">
            Manage subcategories for each sport (Soccer, Tennis, etc.), toggle ON / OFF status (default OFF), and sync from SportsDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing || selectedCategoryId === 'all'}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
            title={selectedCategoryId === 'all' ? 'Select a category first to sync' : 'Sync subcategories'}
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Subcategories'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500"
          >
            <Plus className="h-4 w-4" /> Add Subcategory
          </button>
        </div>
      </div>

      {/* STATUS FILTER TABS (All / Active (ON) / Inactive (OFF)) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setStatusTab('all')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              statusTab === 'all'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>All Subcategories</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              statusTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('active')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              statusTab === 'active'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Active (ON)</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              statusTab === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('inactive')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              statusTab === 'inactive'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <XCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>Inactive (OFF)</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              statusTab === 'inactive' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Page Size Selector & Counters */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
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
            Filtered: <span className="text-white font-bold">{totalItems}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full max-w-xl">
          {/* Category Dropdown Selector */}
          <div className="w-full sm:w-64">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 text-xs font-semibold text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              <option value="all">🌐 All Sports Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  ⚽ {cat.sportName}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input with Clear Button */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subcategory or league..."
              className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Subcategories Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin text-rose-500" /> Loading subcategories...
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Layers className="h-10 w-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No subcategories found</p>
            <p className="text-xs text-slate-500">
              {searchTerm 
                ? `No results matching "${searchTerm}". Try clearing search.`
                : 'Select a category and click "Sync Subcategories" or click "Add Subcategory" to create manually.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-3.5 px-4 text-center">ON / OFF Toggle</th>
                  <th className="py-3.5 px-4 text-center">🔥 Trending</th>
                  <th className="py-3.5 px-4">Subcategory / League</th>
                  <th className="py-3.5 px-4">Parent Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedSubcategories.map((subcat) => (
                  <tr key={subcat.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Interactive ON / OFF Toggle Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(subcat)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                          subcat.status
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:bg-slate-700'
                        }`}
                        title="Click to toggle status ON or OFF"
                      >
                        {subcat.status ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-emerald-400" />
                            <span>ON</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-slate-500" />
                            <span>OFF</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Interactive Trending Toggle Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleTrending(subcat)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                          subcat.isTrending
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 shadow-sm'
                            : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                        title="Click to toggle Trending status (Default OFF)"
                      >
                        <Flame className={`h-3.5 w-3.5 ${subcat.isTrending ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
                        <span>{subcat.isTrending ? 'Trending' : 'Normal'}</span>
                      </button>
                    </td>

                    {/* Subcategory Name & Logo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {subcat.logoUrl ? (
                          <img
                            src={subcat.logoUrl}
                            alt={subcat.name}
                            className="h-8 w-8 rounded-lg object-contain border border-slate-700 bg-slate-950 p-0.5"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                            <Tag className="h-4 w-4" />
                          </div>
                        )}
                        <span className="font-bold text-white text-sm">{subcat.name}</span>
                      </div>
                    </td>

                    {/* Parent Sport Category */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 border border-rose-500/20">
                        <Trophy className="h-3 w-3" />
                        {subcat.categoryName || 'Sport'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {subcat.status ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          ● ACTIVE (ON)
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                          ○ INACTIVE (OFF)
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(subcat)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:border-rose-500 hover:bg-rose-600 hover:text-white transition-all"
                          title="Edit Subcategory"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(subcat.id, subcat.name)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 hover:border-rose-500 hover:bg-rose-900/60 hover:text-rose-300 transition-all"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER WITH 1, 2, 3, 4, 5 PAGE BUTTONS */}
        {!loading && totalItems > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
            <div className="text-xs text-slate-400">
              Showing <span className="font-semibold text-white">{totalItems > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-white">{endIndex}</span> of{' '}
              <span className="font-semibold text-white">{totalItems}</span> entries
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900"
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={validCurrentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900"
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* NUMERIC PAGE BUTTONS [1] [2] [3] [4] [5] */}
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`dots-${idx}`} className="px-1 text-slate-500 font-bold">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${page}`}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      validCurrentPage === page
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900"
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900"
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingSubcat ? `Edit Subcategory: ${editingSubcat.name}` : 'Add New Subcategory'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Parent Category Selector */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Parent Sport Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100 focus:border-rose-500 focus:outline-none"
                >
                  <option value="">Select Parent Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.sportName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Name */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Subcategory / League Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. English Premier League, UEFA Champions League"
                  required
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Logo URL / Drag & Drop Upload */}
              <ImageUpload
                value={formData.logoUrl}
                onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                label="Subcategory Logo / Badge"
                placeholder="https://www.thesportsdb.com/images/media/league/badge/..."
              />

              {/* Default Status Radio / Toggle */}
              <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <label className="font-semibold text-slate-300">Initial Status</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      checked={!formData.status}
                      onChange={() => setFormData({ ...formData, status: false })}
                      className="accent-rose-500"
                    />
                    <span>OFF (Default / Inactive)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status}
                      onChange={() => setFormData({ ...formData, status: true })}
                      className="accent-emerald-500"
                    />
                    <span className="text-emerald-400 font-semibold">ON (Active)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white shadow-lg hover:bg-rose-500"
                >
                  {editingSubcat ? 'Save Changes' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
