'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  HardDrive,
  WifiOff,
  Laptop,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/shared';
import { StillPointLogo } from '@/components/ui/StillPointLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  isAndroid?: boolean;
  onInstall?: () => Promise<boolean>;
  onDownloadPackage?: () => void;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  isInstallable = true,
  isInstalled = false,
  isIOS = false,
  isAndroid = false,
  onInstall = async () => true,
  onDownloadPackage,
}: PWAInstallModalProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deviceTab, setDeviceTab] = useState<'auto' | 'ios' | 'android' | 'desktop'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'auto'
  );

  if (!isOpen) return null;

  const handleDownload = () => {
    onDownloadPackage?.();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const handleNativeInstall = async () => {
    const success = await onInstall();
    if (success) {
      onClose();
    } else {
      // If browser didn't support native prompt, fallback to downloading launcher
      handleDownload();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26302A]/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#F6F4EF] p-6 sm:p-8 shadow-2xl border border-[#E4E0D6] space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-xl p-2 text-[#5E6F63] hover:bg-[#E4E0D6] hover:text-[#26302A] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 pb-2 border-b border-[#E4E0D6]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#26302A] shadow-md shrink-0">
              <StillPointLogo size={28} variant="mark" inverted={true} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EDE9E0] text-[10px] font-bold uppercase tracking-wider text-[#C58A66] mb-0.5">
                <span>Progressive Web App (PWA)</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#26302A]">
                Get STILL POINT Mobile App
              </h3>
              <p className="text-xs text-[#5E6F63]">
                Zero app store friction • Offline field capture • BBMP ward sync
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleNativeInstall}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#C58A66] hover:bg-[#B37854] text-white font-serif font-bold text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Smartphone className="h-5 w-5" />
              <span>Install App on this Device</span>
            </button>

            <button
              onClick={handleDownload}
              className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-[#EDE9E0] text-[#26302A] border border-[#E4E0D6] font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4 text-[#C58A66]" />
              <span>Download Mobile App Package (.html)</span>
            </button>

            {downloadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-[#15803D]/10 border border-[#15803D]/30 text-center text-xs text-[#15803D] font-semibold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Downloaded STILL_POINT_Field_App.html! Open it anytime to launch.</span>
              </motion.div>
            )}
          </div>

          {/* Device Tabs */}
          <div className="space-y-3 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E6F63]">
              Installation Instructions by Device:
            </span>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#EDE9E0] text-xs font-semibold text-[#5E6F63]">
              <button
                type="button"
                onClick={() => setDeviceTab('android')}
                className={`py-1.5 rounded-lg transition-all ${
                  deviceTab === 'android' ? 'bg-white text-[#26302A] shadow-xs' : 'hover:text-[#26302A]'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setDeviceTab('ios')}
                className={`py-1.5 rounded-lg transition-all ${
                  deviceTab === 'ios' ? 'bg-white text-[#26302A] shadow-xs' : 'hover:text-[#26302A]'
                }`}
              >
                iPhone / iPad
              </button>
              <button
                type="button"
                onClick={() => setDeviceTab('desktop')}
                className={`py-1.5 rounded-lg transition-all ${
                  deviceTab === 'desktop' ? 'bg-white text-[#26302A] shadow-xs' : 'hover:text-[#26302A]'
                }`}
              >
                Desktop
              </button>
            </div>

            {/* Android Guide */}
            {(deviceTab === 'android' || (deviceTab === 'auto' && isAndroid)) && (
              <div className="p-4 rounded-2xl bg-white border border-[#E4E0D6] space-y-2.5 text-xs text-[#26302A]">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#26302A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Open STILL POINT in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#26302A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Tap the <strong>"Install App on this Device"</strong> button above, or open the browser menu <strong>(⋮)</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#26302A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. An app icon appears on your home screen.
                  </p>
                </div>
              </div>
            )}

            {/* iOS Guide */}
            {(deviceTab === 'ios' || (deviceTab === 'auto' && isIOS)) && (
              <div className="p-4 rounded-2xl bg-white border border-[#E4E0D6] space-y-2.5 text-xs text-[#26302A]">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#26302A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="flex items-center gap-1 flex-wrap">
                    In <strong>Safari</strong>, tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline text-[#C58A66]" /> at the bottom toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#26302A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="flex items-center gap-1 flex-wrap">
                    Scroll down and tap <strong className="inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-[#26302A]" /> Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#26302A] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Tap <strong>Add</strong> in the top right. STILL POINT launches in full-screen native mode!
                  </p>
                </div>
              </div>
            )}

            {/* Desktop Guide */}
            {(deviceTab === 'desktop' || (deviceTab === 'auto' && !isIOS && !isAndroid)) && (
              <div className="p-4 rounded-2xl bg-white border border-[#E4E0D6] space-y-2.5 text-xs text-[#26302A]">
                <div className="flex items-start gap-2.5">
                  <Laptop className="w-4 h-4 text-[#C58A66] shrink-0 mt-0.5" />
                  <p>
                    In Chrome or Edge, look for the <strong>Install (⊕)</strong> icon on the right side of the URL address bar, and click <strong>Install STILL POINT</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Download className="w-4 h-4 text-[#5E6F63] shrink-0 mt-0.5" />
                  <p>
                    Or click <strong>"Download Mobile App Package (.html)"</strong> above to save an instant offline launcher to your desktop or mobile files.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* System Diagnostics Badge */}
          <div className="p-3.5 rounded-2xl bg-[#EDE9E0] border border-[#E4E0D6] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5E6F63]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              <span className="font-semibold text-[#26302A]">Service Worker Active</span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-[#C58A66]" />
              <span>IndexedDB Offline Queue</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#5E6F63]">
              <span>861 KB Precached</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
