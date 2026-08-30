import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api';
import { 
  Megaphone, 
  Save, 
  RefreshCw, 
  Code, 
  Link as LinkIcon, 
  Smartphone, 
  Monitor, 
  Layout, 
  Sparkles, 
  Activity, 
  Globe, 
  FileCode
} from 'lucide-react';

export const AdsControlPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'scripts' | 'display' | 'floating' | 'referrals'>('scripts');

  const [formData, setFormData] = useState({
    headAds: '',
    navAds: '',
    modalSignupAds: '',
    footerAds: '',
    floatMobileAds: '',
    floatDesktopAds: '',
    histatsScript: '',
    membershipReferralLink: '',
    globalSignInReferralLink: '',
  });

  // Fetch Current Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ads');
      if (res.data?.success && res.data?.data?.settings) {
        const s = res.data.data.settings;
        setFormData({
          headAds: s.headAds || '',
          navAds: s.navAds || '',
          modalSignupAds: s.modalSignupAds || '',
          footerAds: s.footerAds || '',
          floatMobileAds: s.floatMobileAds || '',
          floatDesktopAds: s.floatDesktopAds || '',
          histatsScript: s.histatsScript || '',
          membershipReferralLink: s.membershipReferralLink || '',
          globalSignInReferralLink: s.globalSignInReferralLink || '',
        });
      }
    } catch (err) {
      toast.error('Failed to load Ads & Referral settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving Ads & Referral settings...');

    try {
      const res = await api.put('/ads', formData);
      if (res.data?.success) {
        toast.success(res.data.message || 'Ads & Referral Settings saved successfully!', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Quick Template Inserters
  const insertTemplate = (field: keyof typeof formData, type: 'script' | 'atOptions' | 'histats' | 'iframe') => {
    let sample = '';
    if (type === 'script') {
      sample = `<script src="https://portfoliogunplayful.com/4b/be/20/4bbe20b71394bddde225602b1670a27d.js"></script>`;
    } else if (type === 'atOptions') {
      sample = `<script type="text/javascript">
  atOptions = {
    'key' : '275772ab76e5165205cbb67523a42086',
    'format' : 'iframe',
    'height' : 50,
    'width' : 320,
    'params' : {}
  };
</script>
<script type="text/javascript" src="https://www.highperformanceformat.com/275772ab76e5165205cbb67523a42086/invoke.js"></script>`;
    } else if (type === 'histats') {
      sample = `<!-- Histats.com  START  (aync)-->
<script type="text/javascript">var _Hasync= _Hasync|| [];
_Hasync.push(['Histats.start', '1,4867998,4,0,0,0,00010000']);
_Hasync.push(['Histats.fasi', '1']);
_Hasync.push(['Histats.track_hits', '']);
(function() {
var hs = document.createElement('script'); hs.type = 'text/javascript'; hs.async = true;
hs.src = ('//s10.histats.com/js15_as.js');
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(hs);
})();</script>
<noscript><a href="/" target="_blank"><img  src="//sstatic1.histats.com/0.gif?4867998&101" alt="" border="0"></a></noscript>
<!-- Histats.com  END  -->`;
    } else if (type === 'iframe') {
      sample = `<iframe src="https://streamespn.com/ad-banner" width="100%" height="90" frameborder="0" scrolling="no"></iframe>`;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}\n${sample}` : sample,
    }));

    toast.success(`Inserted sample template into ${field}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <Megaphone className="h-4 w-4" /> Ads & Monetization Control
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">Ads & Referral Settings</h1>
          <p className="text-xs text-slate-400">
            Manage head script tags, banner placements, Histats tracking, floating ads & global referral URLs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:bg-rose-500 disabled:opacity-50"
          >
            <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 transition-all ${
            activeTab === 'scripts'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Code className="h-4 w-4" />
          <span>Head & Analytics Scripts</span>
        </button>

        <button
          onClick={() => setActiveTab('display')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 transition-all ${
            activeTab === 'display'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Layout className="h-4 w-4" />
          <span>Display Banners (Nav, Footer, Modal)</span>
        </button>

        <button
          onClick={() => setActiveTab('floating')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 transition-all ${
            activeTab === 'floating'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Floating Mobile & Desktop Ads</span>
        </button>

        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 transition-all ${
            activeTab === 'referrals'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LinkIcon className="h-4 w-4" />
          <span>Global Referral Links</span>
        </button>
      </div>

      {/* MAIN FORM CANVAS */}
      <form onSubmit={handleSave} className="space-y-6">

        {/* TAB 1: HEAD & ANALYTICS SCRIPTS */}
        {activeTab === 'scripts' && (
          <div className="space-y-6">
            {/* Head Ads Script */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-rose-400" />
                    Header Script / Ads (Head Tag)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Injected into HTML <code className="text-rose-300 font-mono">&lt;head&gt;</code> tag (e.g. Adsterra script, Google AdSense, meta tags).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => insertTemplate('headAds', 'script')}
                    className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                  >
                    + Insert Script Tag
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTemplate('headAds', 'atOptions')}
                    className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                  >
                    + Insert atOptions
                  </button>
                </div>
              </div>
              <textarea
                rows={6}
                value={formData.headAds}
                onChange={(e) => setFormData({ ...formData, headAds: e.target.value })}
                placeholder="<script src='https://portfoliogunplayful.com/.../invoke.js'></script>"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Histats / Analytics Script */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    Histats / Analytics Tracking Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Histats.com async tracking snippet or Google Analytics tag.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertTemplate('histatsScript', 'histats')}
                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                >
                  + Insert Histats Code
                </button>
              </div>
              <textarea
                rows={8}
                value={formData.histatsScript}
                onChange={(e) => setFormData({ ...formData, histatsScript: e.target.value })}
                placeholder="<!-- Histats.com START (async) --> ... <noscript>...</noscript>"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-amber-300 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: DISPLAY BANNERS */}
        {activeTab === 'display' && (
          <div className="space-y-6">
            {/* Navbar Ad Code */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layout className="h-4 w-4 text-rose-400" />
                    Navbar Ad Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ad code displayed under navigation header bar (728x90 or 320x50 iframe / JS code).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertTemplate('navAds', 'atOptions')}
                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                >
                  + Insert Banner Code
                </button>
              </div>
              <textarea
                rows={5}
                value={formData.navAds}
                onChange={(e) => setFormData({ ...formData, navAds: e.target.value })}
                placeholder="Paste navbar ad script, iframe or HTML..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Footer Ad Code */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layout className="h-4 w-4 text-indigo-400" />
                    Footer Ad Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ad banner code displayed above or inside website footer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertTemplate('footerAds', 'iframe')}
                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                >
                  + Insert Iframe Code
                </button>
              </div>
              <textarea
                rows={5}
                value={formData.footerAds}
                onChange={(e) => setFormData({ ...formData, footerAds: e.target.value })}
                placeholder="Paste footer ad code..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Modal Signup / Pop-up Ad Code */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Modal Signup / Pop-Up Ad Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pop-up modal ad or registration prompt code shown on stream click.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertTemplate('modalSignupAds', 'script')}
                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                >
                  + Insert Pop-up Code
                </button>
              </div>
              <textarea
                rows={5}
                value={formData.modalSignupAds}
                onChange={(e) => setFormData({ ...formData, modalSignupAds: e.target.value })}
                placeholder="Paste modal signup ad script or HTML..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: FLOATING MOBILE & DESKTOP ADS */}
        {activeTab === 'floating' && (
          <div className="space-y-6">
            {/* Floating Mobile Ads */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-rose-400" />
                    Floating Mobile Ad Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sticky bottom/top banner ad code visible on mobile screens (320x50).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertTemplate('floatMobileAds', 'atOptions')}
                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                >
                  + Insert 320x50 Mobile Ad
                </button>
              </div>
              <textarea
                rows={5}
                value={formData.floatMobileAds}
                onChange={(e) => setFormData({ ...formData, floatMobileAds: e.target.value })}
                placeholder="Paste floating mobile ad code..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Floating Desktop Ads */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-indigo-400" />
                    Floating Desktop Ad Code
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sticky sidebar or bottom corner desktop ad code (160x600, 728x90).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => insertTemplate('floatDesktopAds', 'atOptions')}
                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all"
                >
                  + Insert Desktop Ad
                </button>
              </div>
              <textarea
                rows={5}
                value={formData.floatDesktopAds}
                onChange={(e) => setFormData({ ...formData, floatDesktopAds: e.target.value })}
                placeholder="Paste floating desktop ad code..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 4: GLOBAL REFERRAL LINKS */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-rose-400" />
                Global Membership & Sign In Referral Links
              </h3>
              <p className="text-xs text-slate-400">
                Default affiliate and membership URLs used across the streaming portal.
              </p>

              {/* Membership Referral Link */}
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-rose-400" />
                  Membership Referral Link
                </label>
                <input
                  type="url"
                  value={formData.membershipReferralLink}
                  onChange={(e) => setFormData({ ...formData, membershipReferralLink: e.target.value })}
                  placeholder="https://streamespn.com/ref/vip-membership"
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                />
              </div>

              {/* Global Sign In Referral Link */}
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-indigo-400" />
                  Global Sign In Referral Link
                </label>
                <input
                  type="url"
                  value={formData.globalSignInReferralLink}
                  onChange={(e) => setFormData({ ...formData, globalSignInReferralLink: e.target.value })}
                  placeholder="https://streamespn.com/auth/sign-in-ref"
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 font-mono text-xs text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-50 transition-all"
          >
            <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Saving...' : 'Save All Ads & Referral Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
