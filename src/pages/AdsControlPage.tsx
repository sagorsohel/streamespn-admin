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
  FileCode,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2
} from 'lucide-react';

export interface HeaderScriptSection {
  id: string;
  name: string;
  code: string;
  isEnabled: boolean;
}

export const AdsControlPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'scripts' | 'display' | 'floating' | 'referrals'>('scripts');

  const [headerScripts, setHeaderScripts] = useState<HeaderScriptSection[]>([]);

  const [formData, setFormData] = useState({
    headAds: '',
    isHeadAdsEnabled: true,
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

        let parsedScripts: HeaderScriptSection[] = [];
        if (Array.isArray(s.headerScripts)) {
          parsedScripts = s.headerScripts;
        } else if (typeof s.headerScripts === 'string' && s.headerScripts.trim()) {
          try {
            parsedScripts = JSON.parse(s.headerScripts);
          } catch {
            parsedScripts = [];
          }
        }

        if (!Array.isArray(parsedScripts) || parsedScripts.length === 0) {
          parsedScripts = [
            {
              id: 'script_1',
              name: 'Header Script / Ads (Head Tag)',
              code: s.headAds || '',
              isEnabled: s.isHeadAdsEnabled !== undefined ? Boolean(s.isHeadAdsEnabled) : true,
            },
          ];
        }

        setHeaderScripts(
          parsedScripts.map((item, idx) => ({
            id: String(item.id || `script_${idx + 1}`),
            name: String(item.name || `Header Script #${idx + 1}`),
            code: String(item.code || ''),
            isEnabled: item.isEnabled !== undefined ? Boolean(item.isEnabled) : true,
          }))
        );

        setFormData({
          headAds: s.headAds || '',
          isHeadAdsEnabled: s.isHeadAdsEnabled !== undefined ? Boolean(s.isHeadAdsEnabled) : true,
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

    const activeScripts = headerScripts.filter((s) => s.isEnabled && s.code && s.code.trim());
    const combinedHeadAds = activeScripts.map((s) => s.code.trim()).join('\n\n');
    const isHeadAdsEnabled = activeScripts.length > 0;

    const payload = {
      ...formData,
      headerScripts,
      headAds: combinedHeadAds,
      isHeadAdsEnabled,
    };

    try {
      const res = await api.put('/ads', payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Ads & Referral Settings saved successfully!', { id: toastId });
        if (res.data?.data?.settings?.headerScripts) {
          setHeaderScripts(res.data.data.settings.headerScripts);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Header Script Section Helpers
  const addHeaderScriptSection = () => {
    const newId = `script_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSection: HeaderScriptSection = {
      id: newId,
      name: `Header Script #${headerScripts.length + 1}`,
      code: '',
      isEnabled: true,
    };
    setHeaderScripts((prev) => [...prev, newSection]);
    toast.success(`Added new Header Script Section #${headerScripts.length + 1}`);
  };

  const updateHeaderScript = (id: string, updates: Partial<HeaderScriptSection>) => {
    setHeaderScripts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const toggleHeaderScript = (id: string) => {
    setHeaderScripts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isEnabled: !item.isEnabled } : item))
    );
  };

  const removeHeaderScriptSection = (id: string) => {
    setHeaderScripts((prev) => prev.filter((item) => item.id !== id));
    toast.info('Header script section removed.');
  };

  const insertTemplateToSection = (id: string, type: 'script' | 'atOptions') => {
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
    }

    setHeaderScripts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          code: item.code ? `${item.code}\n${sample}` : sample,
        };
      })
    );
    toast.success('Inserted sample script tag');
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
            {/* Header Script Sections Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg backdrop-blur-md">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-rose-500" />
                    Header Script Sections
                  </h2>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                    {headerScripts.filter((s) => s.isEnabled).length} of {headerScripts.length} Active (ON)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Add multiple header script sections. Turn individual sections ON or OFF. All sections that are turned ON will be injected into the website HTML <code className="text-rose-300 font-mono">&lt;head&gt;</code> tag.
                </p>
              </div>

              <button
                type="button"
                onClick={addHeaderScriptSection}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Header Script Section</span>
              </button>
            </div>

            {/* List of Dynamic Header Script Boxes */}
            <div className="space-y-5">
              {headerScripts.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-slate-900/80 p-5 shadow-xl space-y-3 backdrop-blur-md transition-all ${
                    item.isEnabled ? 'border-slate-800' : 'border-slate-800/60 opacity-90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* ON / OFF Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleHeaderScript(item.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                          item.isEnabled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title={
                          item.isEnabled
                            ? 'This script is ON. Click to Turn OFF'
                            : 'This script is OFF. Click to Turn ON'
                        }
                      >
                        {item.isEnabled ? (
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

                      {/* Icon & Editable Section Name */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-rose-400 shrink-0" />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateHeaderScript(item.id, { name: e.target.value })}
                            placeholder="Section Name (e.g. Adsterra, Google AdSense, Meta Pixel)"
                            className="bg-slate-950/70 hover:bg-slate-950 focus:bg-slate-950 text-white font-bold text-sm px-2.5 py-1 rounded-lg border border-slate-700/60 focus:border-rose-500 outline-none w-full max-w-sm sm:max-w-md transition-all placeholder-slate-500"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 pl-6">
                          Injected into HTML <code className="text-rose-300 font-mono">&lt;head&gt;</code> tag (e.g. Adsterra script, Google AdSense, meta tags).
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => insertTemplateToSection(item.id, 'script')}
                        className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all cursor-pointer"
                      >
                        + Insert Script Tag
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplateToSection(item.id, 'atOptions')}
                        className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700 transition-all cursor-pointer"
                      >
                        + Insert atOptions
                      </button>

                      {headerScripts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHeaderScriptSection(item.id)}
                          className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                          title="Delete this section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Banner */}
                  {!item.isEnabled ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-semibold text-amber-300 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>This script section is currently <strong>DISABLED (OFF)</strong>. Scripts in this box will not run on the website until you turn this ON.</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-400/90 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Active (ON) - Injected into website HTML &lt;head&gt;
                      </span>
                      <span className="text-[11px] font-mono text-emerald-500/70">
                        {item.code?.trim() ? `${item.code.trim().length} characters` : 'Empty (No script entered yet)'}
                      </span>
                    </div>
                  )}

                  {/* Code Textarea */}
                  <textarea
                    rows={6}
                    value={item.code}
                    onChange={(e) => updateHeaderScript(item.id, { code: e.target.value })}
                    placeholder="<script src='https://portfoliogunplayful.com/.../invoke.js'></script>"
                    className={`w-full rounded-xl border bg-slate-950 p-3.5 font-mono text-xs placeholder-slate-600 focus:outline-none transition-all ${
                      item.isEnabled
                        ? 'border-slate-800 text-emerald-400 focus:border-rose-500'
                        : 'border-slate-800/80 text-slate-500 opacity-60'
                    }`}
                  />
                </div>
              ))}

              {headerScripts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
                  <FileCode className="h-8 w-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">No Header Script Sections</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add one or more header script sections to inject scripts, pixels, or ad tags into your website's head.
                  </p>
                  <button
                    type="button"
                    onClick={addHeaderScriptSection}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Header Script Section</span>
                  </button>
                </div>
              )}
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
