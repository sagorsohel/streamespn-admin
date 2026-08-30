import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { ImageUpload } from '../components/ui/ImageUpload';
import { 
  Trophy, 
  RefreshCw, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Trash2, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Lock, 
  X, 
  Search,
  ShieldCheck
} from 'lucide-react';

export interface SportCategory {
  id: number;
  sportName: string;
  sportFormat: string;
  thumbUrl: string | null;
  iconUrl: string | null;
  description: string | null;
  playerImage: string | null;
  bgImage: string | null;
  referralLink: string | null;
  displayOrder: number;
  isCustomized: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const SportsPage: React.FC = () => {
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSport, setEditingSport] = useState<SportCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sportName: '',
    sportFormat: 'Team',
    thumbUrl: '',
    iconUrl: '',
    description: '',
    playerImage: '',
    bgImage: '',
    referralLink: '',
  });

  const fetchSports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sports');
      if (response.data?.success) {
        setSports(response.data.data.sports || []);
      }
    } catch (err: any) {
      toast.error('Failed to fetch sports categories from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  // Sync from TheSportsDB
  const handleSync = async () => {
    setSyncing(true);
    const toastId = toast.loading('Syncing target sports from TheSportsDB...');
    try {
      const response = await api.post('/sports/sync');
      if (response.data?.success) {
        toast.success(response.data.message || 'Sports synced successfully!', { id: toastId });
        fetchSports();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed. Ensure backend is running.', { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Move Item UP in Serial
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSports = [...sports];
    // Swap items
    const tempOrder = newSports[index].displayOrder;
    newSports[index].displayOrder = newSports[index - 1].displayOrder;
    newSports[index - 1].displayOrder = tempOrder;

    // Swap position in array
    const temp = newSports[index];
    newSports[index] = newSports[index - 1];
    newSports[index - 1] = temp;

    setSports(newSports);
    await saveReorder(newSports);
  };

  // Move Item DOWN in Serial
  const handleMoveDown = async (index: number) => {
    if (index === sports.length - 1) return;
    const newSports = [...sports];
    // Swap items
    const tempOrder = newSports[index].displayOrder;
    newSports[index].displayOrder = newSports[index + 1].displayOrder;
    newSports[index + 1].displayOrder = tempOrder;

    // Swap position in array
    const temp = newSports[index];
    newSports[index] = newSports[index + 1];
    newSports[index + 1] = temp;

    setSports(newSports);
    await saveReorder(newSports);
  };

  // Save new serial reorder to API
  const saveReorder = async (updatedList: SportCategory[]) => {
    try {
      const payload = updatedList.map((item, idx) => ({
        id: item.id,
        displayOrder: idx + 1,
      }));
      const res = await api.put('/sports/reorder', { items: payload });
      if (res.data?.success) {
        toast.success('Serial order updated successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save reordered serial numbers.');
    }
  };

  // Open Modal for Create or Edit
  const openCreateModal = () => {
    setEditingSport(null);
    setFormData({
      sportName: '',
      sportFormat: 'Team',
      thumbUrl: '',
      iconUrl: '',
      description: '',
      playerImage: '',
      bgImage: '',
      referralLink: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sport: SportCategory) => {
    setEditingSport(sport);
    setFormData({
      sportName: sport.sportName || '',
      sportFormat: sport.sportFormat || 'Team',
      thumbUrl: sport.thumbUrl || '',
      iconUrl: sport.iconUrl || '',
      description: sport.description || '',
      playerImage: sport.playerImage || '',
      bgImage: sport.bgImage || '',
      referralLink: sport.referralLink || '',
    });
    setIsModalOpen(true);
  };

  // Handle Create / Edit Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sportName.trim()) {
      toast.error('Sport Name is required');
      return;
    }

    try {
      if (editingSport) {
        // PUT update
        const response = await api.put(`/sports/${editingSport.id}`, formData);
        if (response.data?.success) {
          toast.success('Sport category updated and locked against sync overwrites!');
        }
      } else {
        // POST create
        const response = await api.post('/sports', formData);
        if (response.data?.success) {
          toast.success('New sport category created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchSports();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  // Delete Sport Category
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const response = await api.delete(`/sports/${id}`);
      if (response.data?.success) {
        toast.success(`Category "${name}" deleted successfully.`);
        fetchSports();
      }
    } catch (err: any) {
      toast.error('Failed to delete category');
    }
  };

  const filteredSports = sports.filter((item) =>
    item.sportName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <Trophy className="h-4 w-4" /> Category Management
          </div>
          <h1 className="text-xl font-extrabold text-white">Sports & Stream Categories</h1>
          <p className="text-xs text-slate-400">
            Sync from TheSportsDB, customize player/bg images & referral links, and manage serial ordering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Target Sports...' : 'Sync from TheSportsDB'}</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500"
          >
            <Plus className="h-4 w-4" /> Add Custom Category
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sports categories..."
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total Categories: <span className="text-white font-bold">{filteredSports.length}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-xs text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin text-rose-500" /> Loading sports categories...
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
            <Trophy className="h-10 w-10 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No sports categories found</p>
            <p className="text-xs text-slate-500">Click "Sync from TheSportsDB" to import target sports automatically.</p>
            <button
              onClick={handleSync}
              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-rose-500"
            >
              Sync Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="py-3.5 px-4 text-center">Serial Order</th>
                  <th className="py-3.5 px-4">Sport Name</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Images (Player / BG)</th>
                  <th className="py-3.5 px-4">Referral Link</th>
                  <th className="py-3.5 px-4">Sync Lock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSports.map((sport, index) => (
                  <tr key={sport.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Serial Order with UP / DOWN Reordering */}
                    <td className="py-3 px-4 text-center font-mono">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 font-bold text-white text-[11px]">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === filteredSports.length - 1}
                            title="Move Down"
                            className="rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Sport Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {sport.thumbUrl ? (
                          <img
                            src={sport.thumbUrl}
                            alt={sport.sportName}
                            className="h-9 w-9 rounded-lg object-cover border border-slate-700 bg-slate-950"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                            <Trophy className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white text-sm">{sport.sportName}</p>
                          <p className="line-clamp-1 text-[11px] text-slate-400 max-w-xs">
                            {sport.description || 'No description available'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Format */}
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60">
                        {sport.sportFormat || 'Team'}
                      </span>
                    </td>

                    {/* Images (Player / Background) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {sport.playerImage ? (
                          <a
                            href={sport.playerImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400 border border-indigo-500/20 hover:underline"
                          >
                            <ImageIcon className="h-3 w-3" /> Player Img
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500">No Player Img</span>
                        )}

                        {sport.bgImage && (
                          <a
                            href={sport.bgImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400 border border-purple-500/20 hover:underline"
                          >
                            <ImageIcon className="h-3 w-3" /> BG Img
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Referral Link */}
                    <td className="py-3 px-4">
                      {sport.referralLink ? (
                        <a
                          href={sport.referralLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-rose-400 hover:underline truncate max-w-[140px]"
                        >
                          <LinkIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{sport.referralLink}</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500">None</span>
                      )}
                    </td>

                    {/* Sync Lock Status */}
                    <td className="py-3 px-4">
                      {sport.isCustomized ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          <Lock className="h-3 w-3" /> ADMIN LOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" /> SportsDB Synced
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(sport)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:border-rose-500 hover:bg-rose-600 hover:text-white transition-all"
                          title="Edit Category"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sport.id, sport.sportName)}
                          className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 hover:border-rose-500 hover:bg-rose-900/60 hover:text-rose-300 transition-all"
                          title="Delete Category"
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
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingSport ? `Edit Sport Category: ${editingSport.sportName}` : 'Add New Custom Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Sport Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Sport Name *</label>
                  <input
                    type="text"
                    value={formData.sportName}
                    onChange={(e) => setFormData({ ...formData, sportName: e.target.value })}
                    placeholder="e.g. Cricket, Soccer"
                    required
                    className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                {/* Format */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Sport Format</label>
                  <input
                    type="text"
                    value={formData.sportFormat}
                    onChange={(e) => setFormData({ ...formData, sportFormat: e.target.value })}
                    placeholder="Team / Event / Individual"
                    className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Player Image Upload / URL */}
              <ImageUpload
                value={formData.playerImage}
                onChange={(url) => setFormData({ ...formData, playerImage: url })}
                label="Player Image (Drag & Drop or URL)"
                placeholder="https://example.com/player-image.png"
              />

              {/* Background Image Upload / URL */}
              <ImageUpload
                value={formData.bgImage}
                onChange={(url) => setFormData({ ...formData, bgImage: url })}
                label="Background Banner Image (Drag & Drop or URL)"
                placeholder="https://example.com/bg-banner.jpg"
              />

              {/* Referral Link */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Referral / Stream Link</label>
                <input
                  type="url"
                  value={formData.referralLink}
                  onChange={(e) => setFormData({ ...formData, referralLink: e.target.value })}
                  placeholder="https://streamespn.com/ref/soccer"
                  className="h-9 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Main Thumbnail Upload / URL */}
              <ImageUpload
                value={formData.thumbUrl}
                onChange={(url) => setFormData({ ...formData, thumbUrl: url })}
                label="Category Badge / Thumbnail (Drag & Drop or URL)"
                placeholder="https://www.thesportsdb.com/images/media/sport/thumb/..."
              />

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Sports category overview..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                />
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
                  {editingSport ? 'Save & Lock Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
