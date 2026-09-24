import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { ImageUpload } from '../components/ui/ImageUpload';
import { ConfirmModal } from '../components/ui/ConfirmModal';
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
  Flame,
  Star,
  Zap,
  Ban,
  Power,
  Home,
  Link as LinkIcon,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  isHomeBanner?: boolean; // Default false
  showOnHome?: boolean; // Default true (Home ON)
  referralLink?: string | null;
  displayOrder: number;
  isCustomized: boolean;
  categoryName?: string;
  matchCount?: number;
  liveMatchCount?: number;
  totalMatchCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const SubcategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<SportCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Status Filter Tab State ('all' | 'new' | 'active' | 'inactive' | 'trending' | 'banner' | 'home_off')
  const [statusTab, setStatusTab] = useState<'all' | 'new' | 'active' | 'inactive' | 'trending' | 'banner' | 'home_off'>('all');

  // Sorting States
  const [sortField, setSortField] = useState<'date' | 'name' | 'category' | 'matches' | 'home' | 'trending' | 'banner' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  // Track subcategories synced in current session
  const [newlySyncedIds, setNewlySyncedIds] = useState<Set<number>>(new Set());

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Checkbox Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubcat, setEditingSubcat] = useState<Subcategory | null>(null);

  // Quick Status Manager Modal States
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusModalCategory, setStatusModalCategory] = useState<string>('all');
  const [statusModalSearch, setStatusModalSearch] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);

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

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    logoUrl: '',
    status: false, // Default OFF
    isHomeBanner: false,
    showOnHome: true, // Default ON (true)
    referralLink: '',
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
  const fetchSubcategories = async (): Promise<Subcategory[]> => {
    setLoading(true);
    try {
      const url = selectedCategoryId !== 'all' 
        ? `/subcategories?categoryId=${selectedCategoryId}&all=true` 
        : '/subcategories?all=true';
      const response = await api.get(url);
      if (response.data?.success) {
        const list = response.data.data.subcategories || [];
        setSubcategories(list);
        return list;
      }
    } catch (err) {
      toast.error('Failed to fetch subcategories from server.');
    } finally {
      setLoading(false);
    }
    return [];
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Clear row selection when category filter or status tab changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedCategoryId, statusTab]);

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
        if (newStatus) {
          toast.success(`"${subcat.name}" is now ENABLED (Active on website & sync)`);
        } else {
          toast.warning(`"${subcat.name}" is now DISABLED (Permanently removed from website & sync)`);
        }
      }
    } catch (err: any) {
      // Rollback on error
      setSubcategories((prev) =>
        prev.map((item) => (item.id === subcat.id ? { ...item, status: originalStatus } : item))
      );
      toast.error('Failed to toggle status.');
    }
  };

  // Bulk Status Change for Category (All sports or specific sport)
  const handleBulkStatusChange = (targetStatus: boolean) => {
    const isAll = statusModalCategory === 'all';
    const catObj = categories.find((c) => c.id === Number(statusModalCategory));
    const targetName = isAll ? 'ALL sports' : (catObj?.sportName || 'this sport');

    askConfirm({
      title: targetStatus ? 'Enable All Subcategories' : 'Disable All Subcategories',
      message: (
        <span>
          Are you sure you want to <b>{targetStatus ? 'ENABLE / ACTIVE' : 'DISABLE / INACTIVE'}</b> all subcategories for <span className="text-white font-bold">{targetName}</span>?
          {!targetStatus && (
            <span className="block mt-1 text-rose-400 text-[11px]">
              Note: Any existing matches for these subcategories will also be deleted from the database.
            </span>
          )}
        </span>
      ),
      confirmText: targetStatus ? 'Yes, Enable All' : 'Yes, Disable All',
      variant: targetStatus ? 'emerald' : 'danger',
      onConfirm: async () => {
        setBulkLoading(true);
        const toastId = toast.loading(`Updating all subcategories for ${targetName}...`);
        try {
          const response = await api.post('/subcategories/bulk-status', {
            categoryId: isAll ? 'all' : Number(statusModalCategory),
            status: targetStatus,
          });
          if (response.data?.success) {
            toast.success(response.data.message, { id: toastId });
            fetchSubcategories();
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to update bulk status.', { id: toastId });
        } finally {
          setBulkLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Checkbox Selection Handlers
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredSubcategories.map((s) => s.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Unified Bulk Update for Selected Subcategories or Filtered Group
  const handleBulkUpdate = ({
    type,
    value,
    ids,
    targetAll = false,
    label,
  }: {
    type: 'status' | 'home' | 'banner' | 'trending';
    value: boolean;
    ids?: number[];
    targetAll?: boolean;
    label: string;
  }) => {
    const targetIds = ids || (targetAll ? filteredSubcategories.map((s) => s.id) : Array.from(selectedIds));
    if (targetIds.length === 0) {
      toast.error('No subcategories selected.');
      return;
    }

    const count = targetIds.length;
    let variant: 'danger' | 'primary' | 'emerald' | 'amber' = 'primary';
    if (type === 'status') {
      variant = value ? 'emerald' : 'danger';
    } else if (type === 'home') {
      variant = value ? 'emerald' : 'danger';
    } else if (type === 'banner' || type === 'trending') {
      variant = value ? 'amber' : 'danger';
    }

    askConfirm({
      title: `Bulk Update (${label})`,
      message: (
        <span>
          Are you sure you want to set <b className="text-white">"{label}"</b> for{' '}
          <b className="text-rose-400">{count}</b> subcategories?
          {type === 'status' && !value && (
            <span className="block mt-1 text-rose-400 text-[11px]">
              Note: Disabling will also clean up active matches from the platform.
            </span>
          )}
        </span>
      ),
      confirmText: `Confirm (${count})`,
      variant,
      onConfirm: async () => {
        setBulkLoading(true);
        const toastId = toast.loading(`Updating ${count} subcategories (${label})...`);
        try {
          const res = await api.post('/subcategories/bulk-status', {
            ids: targetIds,
            type,
            value,
            status: value,
          });
          if (res.data?.success) {
            toast.success(res.data.message || `Successfully updated ${count} subcategories!`, { id: toastId });
            clearSelection();
            fetchSubcategories();
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to update subcategories.', { id: toastId });
        } finally {
          setBulkLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
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

  // Toggle Home Banner Status (by default false)
  const handleToggleHomeBanner = async (subcat: Subcategory) => {
    const originalBanner = !!subcat.isHomeBanner;
    const newBanner = !originalBanner;

    // Optimistic UI update
    setSubcategories((prev) =>
      prev.map((item) => (item.id === subcat.id ? { ...item, isHomeBanner: newBanner } : item))
    );

    try {
      const response = await api.patch(`/subcategories/${subcat.id}/toggle-banner`);
      if (response.data?.success) {
        toast.success(
          `"${subcat.name}" home banner set to ${newBanner ? 'ON ⭐ (Shown in Home Banner Carousel)' : 'OFF (Normal)'}`
        );
      }
    } catch (err: any) {
      // Rollback on error
      setSubcategories((prev) =>
        prev.map((item) => (item.id === subcat.id ? { ...item, isHomeBanner: originalBanner } : item))
      );
      toast.error('Failed to toggle home banner status.');
    }
  };

  // Toggle Home Visibility Status (showOnHome: by default true / ON)
  const handleToggleHomeVisibility = async (subcat: Subcategory) => {
    const originalShowOnHome = subcat.showOnHome !== false; // true unless explicitly false
    const newShowOnHome = !originalShowOnHome;

    // Optimistic UI update
    setSubcategories((prev) =>
      prev.map((item) => (item.id === subcat.id ? { ...item, showOnHome: newShowOnHome } : item))
    );

    try {
      const response = await api.patch(`/subcategories/${subcat.id}/toggle-home`);
      if (response.data?.success) {
        toast.success(
          `"${subcat.name}" homepage events visibility set to ${newShowOnHome ? 'ON 🏠 (Shown on Homepage)' : 'OFF (Hidden from Homepage)'}`
        );
      }
    } catch (err: any) {
      // Rollback on error
      setSubcategories((prev) =>
        prev.map((item) => (item.id === subcat.id ? { ...item, showOnHome: originalShowOnHome } : item))
      );
      toast.error('Failed to toggle homepage visibility.');
    }
  };

  // Sync Subcategories / Leagues from TheSportsDB (Supports both Single Category and All Categories)
  const handleSync = async () => {
    const isAll = selectedCategoryId === 'all';
    const categoryObj = categories.find((c) => c.id === Number(selectedCategoryId));
    const catName = isAll ? 'All Sports Categories' : (categoryObj ? categoryObj.sportName : 'Category');

    setSyncing(true);
    const toastId = toast.loading(
      isAll
        ? 'Syncing all subcategories & leagues across all sports from TheSportsDB...'
        : `Syncing subcategories for "${catName}"...`
    );

    try {
      const prevIds = new Set(subcategories.map((s) => s.id));
      const response = await api.post('/subcategories/sync', {
        categoryId: isAll ? 'all' : Number(selectedCategoryId),
      });

      if (response.data?.success) {
        toast.success(response.data.message || 'Subcategories synced!', { id: toastId });
        const refreshed = await fetchSubcategories();
        if (refreshed && refreshed.length > 0) {
          const freshIds = new Set<number>();
          refreshed.forEach((s) => {
            if (!prevIds.has(s.id)) freshIds.add(s.id);
          });
          if (freshIds.size > 0) {
            setNewlySyncedIds((prev) => new Set([...prev, ...freshIds]));
          }
        }
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
      isHomeBanner: false,
      showOnHome: true, // Default ON
      referralLink: '',
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
      isHomeBanner: !!subcat.isHomeBanner,
      showOnHome: subcat.showOnHome !== false, // default true
      referralLink: subcat.referralLink || '',
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
          toast.success('Subcategory created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchSubcategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  // Delete Subcategory
  const handleDelete = (id: number, name: string) => {
    askConfirm({
      title: 'Delete Subcategory',
      message: (
        <span>
          Are you sure you want to delete subcategory <b className="text-white">"{name}"</b>?
          <span className="block mt-1 text-rose-400 text-[11px]">
            This action cannot be undone and will permanently remove this league.
          </span>
        </span>
      ),
      confirmText: 'Yes, Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await api.delete(`/subcategories/${id}`);
          if (res.data?.success) {
            toast.success(`Subcategory "${name}" deleted.`);
            fetchSubcategories();
          }
        } catch (err) {
          toast.error('Failed to delete subcategory.');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Check if subcategory is new (created in last 72 hours or synced in current session)
  const isNewSubcat = (item: Subcategory) => {
    if (newlySyncedIds.has(item.id)) return true;
    if (!item.createdAt) return false;
    const createdTime = new Date(item.createdAt).getTime();
    if (isNaN(createdTime)) return false;
    return Date.now() - createdTime <= 72 * 60 * 60 * 1000;
  };

  // Status Tab Counts
  const totalCount = subcategories.length;
  const newCount = subcategories.filter(isNewSubcat).length;
  const activeCount = subcategories.filter((s) => s.status).length;
  const inactiveCount = subcategories.filter((s) => !s.status).length;
  const trendingCount = subcategories.filter((s) => s.isTrending || (s.matchCount && s.matchCount >= 10)).length;
  const bannerCount = subcategories.filter((s) => s.isHomeBanner).length;
  const homeOffCount = subcategories.filter((s) => s.showOnHome === false).length;

  // Filter Subcategories by Status Tab & Search Term
  const filteredSubcategories = subcategories.filter((item) => {
    // 1. Status Filter Tab
    if (statusTab === 'new' && !isNewSubcat(item)) return false;
    if (statusTab === 'active' && !item.status) return false;
    if (statusTab === 'inactive' && item.status) return false;
    if (statusTab === 'trending' && !item.isTrending && !(item.matchCount && item.matchCount >= 10)) return false;
    if (statusTab === 'banner' && !item.isHomeBanner) return false;
    if (statusTab === 'home_off' && item.showOnHome !== false) return false;

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(term);
      const matchCat = item.categoryName ? item.categoryName.toLowerCase().includes(term) : false;
      return matchName || matchCat;
    }

    return true;
  });

  // Handle Column Header Sort Toggle
  const handleSort = (field: 'date' | 'name' | 'category' | 'matches' | 'home' | 'trending' | 'banner' | 'status') => {
    if (sortField !== field) {
      setSortField(field);
      // For date & matches, default to highest/newest first ('desc')! For others, default to ascending!
      setSortOrder(field === 'date' || field === 'matches' ? 'desc' : 'asc');
    } else {
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else if (sortOrder === 'asc') {
        setSortField(null);
        setSortOrder(null);
      } else {
        setSortOrder('desc');
      }
    }
  };

  // Sort Filtered Subcategories
  const sortedSubcategories = [...filteredSubcategories].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let compareVal = 0;

    if (sortField === 'date') {
      const aNew = newlySyncedIds.has(a.id) ? 1 : 0;
      const bNew = newlySyncedIds.has(b.id) ? 1 : 0;
      if (aNew !== bNew) {
        compareVal = aNew - bNew;
      } else {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTime && bTime && aTime !== bTime) {
          compareVal = aTime - bTime;
        } else {
          compareVal = a.id - b.id;
        }
      }
    } else if (sortField === 'matches') {
      const aMatches = a.matchCount || 0;
      const bMatches = b.matchCount || 0;
      compareVal = aMatches - bMatches;
      if (compareVal === 0) {
        compareVal = (a.liveMatchCount || 0) - (b.liveMatchCount || 0);
      }
    } else if (sortField === 'name') {
      compareVal = a.name.localeCompare(b.name);
    } else if (sortField === 'category') {
      const aCat = a.categoryName || '';
      const bCat = b.categoryName || '';
      compareVal = aCat.localeCompare(bCat);
    } else if (sortField === 'status') {
      compareVal = (a.status ? 1 : 0) - (b.status ? 1 : 0);
    } else if (sortField === 'home') {
      compareVal = (a.showOnHome !== false ? 1 : 0) - (b.showOnHome !== false ? 1 : 0);
    } else if (sortField === 'trending') {
      const aTrend = a.isTrending || (a.matchCount && a.matchCount >= 10);
      const bTrend = b.isTrending || (b.matchCount && b.matchCount >= 10);
      compareVal = (aTrend ? 1 : 0) - (bTrend ? 1 : 0);
    } else if (sortField === 'banner') {
      compareVal = (a.isHomeBanner ? 1 : 0) - (b.isHomeBanner ? 1 : 0);
    }

    return sortOrder === 'desc' ? -compareVal : compareVal;
  });

  // Pagination Calculations
  const totalItems = sortedSubcategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSubcategories = sortedSubcategories.slice(startIndex, endIndex);

  // Checkbox helpers based on current page items
  const areAllPageSelected =
    paginatedSubcategories.length > 0 &&
    paginatedSubcategories.every((s) => selectedIds.has(s.id));

  const isIndeterminate =
    paginatedSubcategories.some((s) => selectedIds.has(s.id)) && !areAllPageSelected;

  const toggleSelectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (areAllPageSelected) {
        paginatedSubcategories.forEach((s) => next.delete(s.id));
      } else {
        paginatedSubcategories.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

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
            Manage subcategories for each sport (Soccer, Tennis, etc.), toggle ON / OFF status, and pin or auto-feature trending leagues based on active matches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/25 hover:border-emerald-400 shadow-sm shadow-emerald-500/10 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            title={selectedCategoryId === 'all' ? 'Sync all sports subcategories from TheSportsDB' : 'Sync subcategories for this sport'}
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
            <span>
              {syncing
                ? (selectedCategoryId === 'all' ? 'Syncing All...' : 'Syncing...')
                : (selectedCategoryId === 'all' ? 'Sync All Subcategories' : 'Sync Subcategories')}
            </span>
          </button>

          <button
            onClick={() => {
              setStatusModalCategory(selectedCategoryId);
              setIsStatusModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20 shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            title="Open Quick Disable / Enable Manager"
          >
            <Power className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Disable / Enable Manager</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>Add Subcategory</span>
          </button>
        </div>
      </div>

      {/* STATUS FILTER TABS */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 max-w-full no-scrollbar">
          <button
            onClick={() => setStatusTab('all')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
              statusTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 border border-rose-500'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-700/60'
            }`}
          >
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span>All</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {totalCount}
            </span>
          </button>

          {newCount > 0 && (
            <button
              onClick={() => setStatusTab('new')}
              className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
                statusTab === 'new'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 border border-emerald-500'
                  : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-emerald-400 hover:border-slate-700/60'
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'new' ? 'text-white' : 'text-emerald-400'}`} />
              <span>New</span>
              <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                statusTab === 'new' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              }`}>
                {newCount}
              </span>
            </button>
          )}

          <button
            onClick={() => setStatusTab('active')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
              statusTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 border border-emerald-500'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-emerald-400 hover:border-slate-700/60'
            }`}
          >
            <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'active' ? 'text-white' : 'text-emerald-400'}`} />
            <span>Active</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusTab === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            }`}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('inactive')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
              statusTab === 'inactive'
                ? 'bg-slate-700 text-white shadow-sm shadow-slate-700/30 border border-slate-600'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-700/60'
            }`}
          >
            <XCircle className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'inactive' ? 'text-white' : 'text-slate-400'}`} />
            <span>Inactive</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusTab === 'inactive' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {inactiveCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('trending')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
              statusTab === 'trending'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30 border border-amber-400'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-amber-400 hover:border-slate-700/60'
            }`}
          >
            <Flame className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'trending' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
            <span>Trending</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusTab === 'trending' ? 'bg-black/20 text-slate-950' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
            }`}>
              {trendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('banner')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
              statusTab === 'banner'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/30 border border-amber-300'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-amber-300 hover:border-slate-700/60'
            }`}
          >
            <Star className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'banner' ? 'text-slate-950 fill-slate-950' : 'text-amber-400 fill-amber-400/40'}`} />
            <span>Home Banner</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusTab === 'banner' ? 'bg-black/20 text-slate-950' : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
            }`}>
              {bannerCount}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('home_off')}
            className={`inline-flex items-center gap-1.5 rounded-lg h-8 px-2.5 sm:px-3 text-xs font-medium shrink-0 whitespace-nowrap transition-all ${
              statusTab === 'home_off'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 border border-rose-500'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800/60 hover:bg-slate-800/80 hover:text-rose-400 hover:border-slate-700/60'
            }`}
          >
            <Home className={`h-3.5 w-3.5 shrink-0 ${statusTab === 'home_off' ? 'text-white' : 'text-rose-400'}`} />
            <span>Home Hidden</span>
            <span className={`min-w-[18px] text-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusTab === 'home_off' ? 'bg-white/20 text-white' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
            }`}>
              {homeOffCount}
            </span>
          </button>
        </div>

        {/* Page Size Selector & Counters */}
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
            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Filtered:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 text-xs">
              {totalItems}
            </span>
          </div>

          {sortField && (
            <button
              onClick={() => {
                setSortField(null);
                setSortOrder(null);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-semibold hover:bg-rose-500/25 transition-all cursor-pointer"
              title="Click to reset sorting"
            >
              <span>
                Sort: {sortField === 'date' ? (sortOrder === 'desc' ? 'Newest' : 'Oldest') : sortField === 'matches' ? 'Matches' : sortField} ({sortField === 'date' ? (sortOrder === 'desc' ? 'New ↓' : 'Old ↑') : (sortOrder === 'desc' ? 'High ↓' : 'Low ↑')})
              </span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* CONTEXTUAL TAB BULK BARS */}
      {statusTab === 'home_off' && homeOffCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-cyan-900/15 to-slate-900 p-3 sm:px-5 text-xs text-cyan-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Home Hidden Leagues ({homeOffCount})</p>
              <p className="text-[11px] text-cyan-300/80">These leagues are hidden from the homepage live schedule.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkUpdate({ type: 'home', value: true, targetAll: true, label: 'Show on Homepage (Home ON)' })}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 transition-all cursor-pointer shadow-md shadow-cyan-950/30 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Unhide All ({homeOffCount}) &rarr; Turn Home ON</span>
            </button>
          </div>
        </div>
      )}

      {statusTab === 'banner' && bannerCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-amber-900/15 to-slate-900 p-3 sm:px-5 text-xs text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Star className="h-4 w-4 fill-amber-400" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Home Banner Carousel ({bannerCount})</p>
              <p className="text-[11px] text-amber-300/80">Featured in hero carousel at the top of homepage.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkUpdate({ type: 'banner', value: false, targetAll: true, label: 'Remove from Banner Carousel' })}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer shadow-md shadow-amber-950/30 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              <span>Remove All ({bannerCount}) from Banner</span>
            </button>
          </div>
        </div>
      )}

      {statusTab === 'trending' && trendingCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-amber-900/15 to-slate-900 p-3 sm:px-5 text-xs text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="h-4 w-4 fill-amber-400" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Trending Leagues ({trendingCount})</p>
              <p className="text-[11px] text-amber-300/80">Currently flagged or auto-calculated as trending.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkUpdate({ type: 'trending', value: false, targetAll: true, label: 'Remove from Trending' })}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all cursor-pointer shadow-md shadow-amber-950/30 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              <span>Clear All ({trendingCount}) from Trending</span>
            </button>
          </div>
        </div>
      )}

      {statusTab === 'inactive' && inactiveCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/30 via-rose-900/15 to-slate-900 p-3 sm:px-5 text-xs text-rose-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Ban className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Inactive Leagues ({inactiveCount})</p>
              <p className="text-[11px] text-rose-300/80">These leagues are disabled and hidden from the platform.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkUpdate({ type: 'status', value: true, targetAll: true, label: 'Enable / Active' })}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer shadow-md shadow-emerald-950/30 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Enable All ({inactiveCount}) &rarr; Turn Active ON</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center w-full max-w-2xl">
          {/* Category Dropdown Selector */}
          <div className="w-full sm:w-72 shrink-0">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/90 px-3 pr-8 text-xs font-medium text-slate-200 focus:border-rose-500 focus:outline-none hover:border-slate-700 transition-all cursor-pointer"
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
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search subcategory or league..."
              className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-8.5 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 hover:border-slate-700 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

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
                  {selectedIds.size} {selectedIds.size === 1 ? 'league' : 'leagues'} selected
                </span>
                <span className="text-[10px] text-slate-400">
                  (out of {filteredSubcategories.length} filtered)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {selectedIds.size < filteredSubcategories.length ? (
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
                  >
                    Select all {filteredSubcategories.length} filtered leagues
                  </button>
                ) : (
                  <span className="text-emerald-400 font-semibold">✓ All {filteredSubcategories.length} filtered leagues selected</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Home Visibility Buttons */}
            <div className="inline-flex rounded-xl border border-cyan-500/30 bg-cyan-950/50 p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'home', value: true, label: 'Show on Homepage (Home ON)' })}
                disabled={bulkLoading}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  statusTab === 'home_off'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                    : 'text-cyan-300 hover:bg-cyan-500/20'
                }`}
                title="Show selected leagues on homepage"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home ON</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'home', value: false, label: 'Hide from Homepage (Home OFF)' })}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Hide selected leagues from homepage"
              >
                <span>Home OFF</span>
              </button>
            </div>

            {/* 2. Banner Buttons */}
            <div className="inline-flex rounded-xl border border-amber-500/30 bg-amber-950/50 p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'banner', value: true, label: 'Show in Banner Carousel' })}
                disabled={bulkLoading}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  statusTab !== 'banner'
                    ? 'text-amber-300 hover:bg-amber-500/20'
                    : 'text-amber-300 hover:bg-amber-500/20'
                }`}
                title="Add selected leagues to Home Banner Carousel"
              >
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Banner ON</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'banner', value: false, label: 'Remove from Banner Carousel' })}
                disabled={bulkLoading}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  statusTab === 'banner'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                }`}
                title="Remove selected leagues from Home Banner Carousel"
              >
                <span>Banner OFF</span>
              </button>
            </div>

            {/* 3. Trending Buttons */}
            <div className="inline-flex rounded-xl border border-amber-500/30 bg-amber-950/50 p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'trending', value: true, label: 'Pin as Trending' })}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer"
                title="Pin selected leagues as Trending"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>Trend ON</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'trending', value: false, label: 'Remove Trending' })}
                disabled={bulkLoading}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  statusTab === 'trending'
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                }`}
                title="Unpin selected leagues from Trending"
              >
                <span>Trend OFF</span>
              </button>
            </div>

            {/* 4. Active / Inactive Buttons */}
            <div className="inline-flex rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-0.5 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'status', value: true, label: 'Active (Enable)' })}
                disabled={bulkLoading}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  statusTab === 'inactive'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-emerald-300 hover:bg-emerald-500/20'
                }`}
                title="Set selected leagues status to Active (ON)"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Active ON</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdate({ type: 'status', value: false, label: 'Inactive (Disable)' })}
                disabled={bulkLoading}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold transition-all cursor-pointer ${
                  statusTab === 'active'
                    ? 'bg-rose-500 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                }`}
                title="Set selected leagues status to Inactive (OFF)"
              >
                <Ban className="h-3.5 w-3.5 text-rose-400" />
                <span>Inactive OFF</span>
              </button>
            </div>

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
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
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

                  {/* 1. Subcategory / League */}
                  <th 
                    onClick={() => handleSort('date')}
                    className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors group select-none"
                    title="Click to sort by Newest / Oldest"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={sortField === 'date' ? 'text-rose-400 font-bold' : ''}>Subcategory / League</span>
                      {sortField === 'date' ? (
                        sortOrder === 'desc' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                            <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" />
                            <span>New</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                            <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                            <span>Old</span>
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 2. Category */}
                  <th 
                    onClick={() => handleSort('category')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
                    title="Click to sort by Sport Category"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={sortField === 'category' ? 'text-rose-400 font-bold' : ''}>Category</span>
                      {sortField === 'category' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" /> : <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 3. Matches */}
                  <th 
                    onClick={() => handleSort('matches')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
                    title="Click to sort by Matches (High to Low / Low to High)"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span className={sortField === 'matches' ? 'text-rose-400 font-bold' : ''}>Matches</span>
                      {sortField === 'matches' ? (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" /> : <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 4. Home */}
                  <th 
                    onClick={() => handleSort('home')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
                    title="Click to sort by Home Visibility"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span className={sortField === 'home' ? 'text-rose-400 font-bold' : ''}>Home</span>
                      {sortField === 'home' ? (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" /> : <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 5. Trending */}
                  <th 
                    onClick={() => handleSort('trending')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
                    title="Click to sort by Trending status"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span className={sortField === 'trending' ? 'text-rose-400 font-bold' : ''}>Trending</span>
                      {sortField === 'trending' ? (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" /> : <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 6. Banner */}
                  <th 
                    onClick={() => handleSort('banner')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
                    title="Click to sort by Banner status"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span className={sortField === 'banner' ? 'text-rose-400 font-bold' : ''}>Banner</span>
                      {sortField === 'banner' ? (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" /> : <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 7. Status */}
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition-colors group whitespace-nowrap"
                    title="Click to sort by Status (Active / Inactive)"
                  >
                    <div className="inline-flex items-center justify-center gap-1">
                      <span className={sortField === 'status' ? 'text-rose-400 font-bold' : ''}>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'desc' ? <ArrowDown className="h-3 w-3 text-rose-400 shrink-0" /> : <ArrowUp className="h-3 w-3 text-rose-400 shrink-0" />
                      ) : (
                        <ArrowUpDown className="h-2.5 w-2.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                      )}
                    </div>
                  </th>

                  {/* 8. Actions */}
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedSubcategories.map((subcat) => (
                  <tr
                    key={subcat.id}
                    className={`transition-colors ${
                      selectedIds.has(subcat.id)
                        ? 'bg-rose-500/10 hover:bg-rose-500/15'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* 0. Row Checkbox */}
                    <td className="py-2 px-3 w-10 text-center select-none" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(subcat.id)}
                        onChange={() => toggleSelect(subcat.id)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-600 accent-rose-600 focus:ring-0 focus:outline-none cursor-pointer"
                      />
                    </td>

                    {/* 1. Subcategory Name & Logo */}
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2.5">
                        {subcat.logoUrl ? (
                          <img
                            src={subcat.logoUrl}
                            alt={subcat.name}
                            className="h-7 w-7 rounded-lg object-contain border border-slate-800 bg-slate-950 p-0.5 shrink-0"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400 border border-slate-700/60">
                            <Tag className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => openEditModal(subcat)}
                              className="font-semibold text-white text-xs hover:text-rose-400 transition-colors text-left block truncate max-w-[170px] sm:max-w-[240px]"
                              title={subcat.name}
                            >
                              {subcat.name}
                            </button>
                            {isNewSubcat(subcat) && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 tracking-wider shadow-sm shadow-emerald-500/10 shrink-0 animate-pulse">
                                <Sparkles className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                NEW
                              </span>
                            )}
                          </div>
                          {subcat.referralLink && (
                            <div className="flex items-center gap-1 mt-0.5" title={`Referral: ${subcat.referralLink}`}>
                              <span className="inline-flex items-center gap-1 text-[9px] text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 font-mono truncate max-w-[160px]">
                                <LinkIcon className="h-2 w-2 shrink-0" />
                                {subcat.referralLink}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Parent Sport Category */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
                        <Trophy className="h-3 w-3 text-rose-400 shrink-0" />
                        <span>{subcat.categoryName || 'Sport'}</span>
                      </span>
                    </td>

                    {/* 3. Active Match Count Badge */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {(subcat.matchCount || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-500/20">
                            <Zap className="h-3 w-3 text-indigo-400 shrink-0" />
                            <span>{subcat.matchCount}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium">0</span>
                        )}
                        {Boolean(subcat.liveMatchCount && subcat.liveMatchCount > 0) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-bold text-rose-400 border border-rose-500/30 animate-pulse">
                            ● {subcat.liveMatchCount} Live
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Home Visibility (showOnHome) Toggle */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleHomeVisibility(subcat)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                          subcat.showOnHome !== false
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                        title={
                          subcat.showOnHome !== false
                            ? 'Visible on Homepage (Click to hide)'
                            : 'Hidden from Homepage (Click to show)'
                        }
                      >
                        <Home className="h-3 w-3 shrink-0" />
                        <span>{subcat.showOnHome !== false ? 'Visible' : 'Hidden'}</span>
                      </button>
                    </td>

                    {/* 5. Trending Toggle */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleToggleTrending(subcat)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                            subcat.isTrending
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-sm'
                              : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                          title={subcat.isTrending ? 'Manual Trending active (Click to disable)' : 'Click to pin as Trending'}
                        >
                          <Flame className={`h-3 w-3 shrink-0 ${subcat.isTrending ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
                          <span>{subcat.isTrending ? 'Trending' : 'Off'}</span>
                        </button>
                        {Boolean(subcat.matchCount && subcat.matchCount >= 10) && !subcat.isTrending && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20"
                            title="Auto Trending (10+ active matches)"
                          >
                            <Zap className="h-2.5 w-2.5 shrink-0" />
                            Auto
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Home Banner Toggle */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleHomeBanner(subcat)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                          subcat.isHomeBanner
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm hover:bg-amber-400/30'
                            : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:bg-slate-700 hover:text-slate-300'
                        }`}
                        title={
                          subcat.isHomeBanner
                            ? 'Home Banner active (Click to disable)'
                            : 'Banner off (Click to show in Homepage Carousel)'
                        }
                      >
                        <Star className={`h-3 w-3 shrink-0 ${subcat.isHomeBanner ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                        <span>{subcat.isHomeBanner ? 'Active' : 'Off'}</span>
                      </button>
                    </td>

                    {/* 7. Status Toggle Switch */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(subcat)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all cursor-pointer ${
                          subcat.status
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                        title={subcat.status ? 'Status: Active (Click to disable)' : 'Status: Inactive (Click to enable)'}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${subcat.status ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                        <span>{subcat.status ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* 8. Action Buttons */}
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(subcat)}
                          className="rounded-lg border border-slate-700/80 bg-slate-800/80 p-1.5 text-slate-400 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                          title="Edit Subcategory"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(subcat.id, subcat.name)}
                          className="rounded-lg border border-slate-700/80 bg-slate-800/80 p-1.5 text-slate-400 hover:border-rose-500/50 hover:bg-rose-500/15 hover:text-rose-400 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900 shadow-2xl shadow-black/70 overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 text-rose-400 shadow-sm shadow-rose-950/40">
                  {editingSubcat ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {editingSubcat ? 'Edit Subcategory' : 'Add New Subcategory'}
                    </h3>
                    {editingSubcat && (
                      <span className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 max-w-[280px] truncate">
                        {editingSubcat.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingSubcat
                      ? 'Configure league details, branding, visibility & affiliate referral settings'
                      : 'Create a new sports league or tournament subcategory'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                {/* Section 1: Basic Information (2 Columns Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Parent Sport Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Parent Sport Category <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-slate-500">Required</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        required
                        className="h-10 w-full appearance-none rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 pr-9 text-xs font-medium text-slate-100 shadow-inner focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all cursor-pointer"
                      >
                        <option value="">Select Parent Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.sportName}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Subcategory / League Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Subcategory / League Name <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-slate-500">Required</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. English Premier League, UEFA Champions League"
                      required
                      className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 text-xs font-medium text-slate-100 placeholder-slate-600 shadow-inner focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
                    />
                  </div>
                </div>

                {/* Section 2: Logo / Badge Upload */}
                <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5">
                  <ImageUpload
                    value={formData.logoUrl}
                    onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                    label="Subcategory Logo / Badge"
                    placeholder="https://www.thesportsdb.com/images/media/league/badge/..."
                  />
                </div>

                {/* Section 3: Feature & Visibility Switches (2 Columns Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Home Banner Carousel Option */}
                  <div className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                    formData.isHomeBanner
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-lg shadow-amber-950/20'
                      : 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700/80'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                            formData.isHomeBanner
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                          }`}>
                            <Star className={`h-4 w-4 ${formData.isHomeBanner ? 'fill-amber-400' : ''}`} />
                          </div>
                          <span className={`text-xs font-bold ${formData.isHomeBanner ? 'text-amber-400' : 'text-slate-200'}`}>
                            Home Banner Carousel
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isHomeBanner: !formData.isHomeBanner })}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                            formData.isHomeBanner
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {formData.isHomeBanner ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-amber-400" />
                              <span>ON</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-slate-500" />
                              <span>OFF</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        Featured prominently in the hero carousel at the top of the homepage.
                      </p>
                    </div>
                  </div>

                  {/* Show Events on Homepage (Home ON / OFF) */}
                  <div className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                    formData.showOnHome
                      ? 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent shadow-lg shadow-cyan-950/20'
                      : 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
                            formData.showOnHome
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          }`}>
                            <Home className="h-4 w-4" />
                          </div>
                          <span className={`text-xs font-bold ${formData.showOnHome ? 'text-cyan-400' : 'text-rose-400'}`}>
                            Homepage Visibility
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, showOnHome: !formData.showOnHome })}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                            formData.showOnHome
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                          }`}
                        >
                          {formData.showOnHome ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-cyan-400" />
                              <span>ON</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-rose-400" />
                              <span>OFF</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-400">
                        {formData.showOnHome
                          ? 'Matches of this league appear in the live schedule on homepage.'
                          : 'Hidden from homepage, visible only inside sport category.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Initial Status & Affiliate Link (2 Columns Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Toggle Card */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Publish Status</label>
                      <span className={`text-[11px] font-bold ${formData.status ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {formData.status ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: false })}
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
                          !formData.status
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>OFF (Inactive)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: true })}
                        className={`flex items-center justify-center gap-1.5 h-9 rounded-xl border text-xs font-semibold transition-all ${
                          formData.status
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/30'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>ON (Active)</span>
                      </button>
                    </div>
                  </div>

                  {/* Referral Link Card */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Referral / Affiliate Link</label>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        Protected
                      </span>
                    </div>
                    <div className="relative">
                      <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="url"
                        value={formData.referralLink}
                        onChange={(e) => setFormData({ ...formData, referralLink: e.target.value })}
                        placeholder="https://example.com/affiliate-link"
                        className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Footer (Always visible at bottom) */}
              <div className="px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-sm flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/40 hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingSubcat ? 'Save Changes' : 'Create Subcategory'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK DISABLE / ENABLE MANAGER MODAL */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Power className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Subcategory Status Manager</h3>
                  <p className="text-xs text-slate-400">Quickly enable or permanently disable subcategories</p>
                </div>
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Filter Sport</label>
                <select
                  value={statusModalCategory}
                  onChange={(e) => setStatusModalCategory(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs font-semibold text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="all">🌐 All Sports Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      ⚽ {cat.sportName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Search League</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={statusModalSearch}
                    onChange={(e) => setStatusModalSearch(e.target.value)}
                    placeholder="Search league name..."
                    className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Action Buttons in Status Manager Modal */}
            <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs shrink-0">
              <span className="text-slate-300 font-medium">
                Bulk Action for <span className="font-bold text-white">
                  {statusModalCategory === 'all'
                    ? '🌐 All Sports Categories'
                    : categories.find((c) => c.id === Number(statusModalCategory))?.sportName}
                </span>:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange(true)}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Enable All</span>
                </button>
                <button
                  onClick={() => handleBulkStatusChange(false)}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Disable All</span>
                </button>
              </div>
            </div>

            {/* Quick List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1 divide-y divide-slate-800/40">
              {(() => {
                const list = subcategories.filter((s) => {
                  const matchCat = statusModalCategory === 'all' || s.categoryId === Number(statusModalCategory);
                  const matchQuery = !statusModalSearch || s.name.toLowerCase().includes(statusModalSearch.toLowerCase());
                  return matchCat && matchQuery;
                });

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No subcategories match your search.
                    </div>
                  );
                }

                return list.map((subcat) => (
                  <div key={subcat.id} className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/30 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      {subcat.logoUrl ? (
                        <img src={subcat.logoUrl} alt="" className="h-6 w-6 object-contain rounded shrink-0" />
                      ) : (
                        <div className="h-6 w-6 rounded bg-slate-800 flex items-center justify-center text-[10px] shrink-0">🏆</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{subcat.name}</p>
                        <p className="text-[10px] text-slate-400">{subcat.categoryName || 'Sport'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(subcat)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        subcat.status
                          ? 'border border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                          : 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                      }`}
                    >
                      {subcat.status ? (
                        <>
                          <Ban className="h-3.5 w-3.5" />
                          <span>Disable</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Enable</span>
                        </>
                      )}
                    </button>
                  </div>
                ));
              })()}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end shrink-0">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
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
