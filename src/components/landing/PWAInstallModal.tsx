'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/shared';
import { StillPointLogo } from '@/components/ui/StillPointLogo';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
}

export function PWAInstallModal({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
}: PWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#26302A]/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#F6F4EF] p-7 shadow-2xl border border-[#E4E0D6]"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-[#5E6F63] hover:bg-[#E4E0D6] hover:text-[#26302A] transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#26302A] shadow-sm">
              <StillPointLogo size="sm" color="#F6F4EF" irisColor="#C58A66" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold tracking-tight text-[#26302A]">Install STILL POINT</h3>
              <p className="text-xs text-[#5E6F63] tracking-wide">Client-side field capture & offline cryptographic sync</p>
            </div>
          </div>

          {isInstalled ? (
            <div className="rounded-xl bg-[#A3AD9C]/20 p-5 border border-[#A3AD9C]/40 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#5E6F63] mb-2" />
              <p className="text-sm font-semibold text-[#26302A]">Client Application Active</p>
              <p className="text-xs text-[#5E6F63] mt-1">
                STILL POINT is already installed and operating in native standalone mode on this device.
              </p>
              <Button onClick={onClose} className="mt-4 w-full bg-[#26302A] text-[#F6F4EF] hover:bg-[#323E37]" size="sm">
                Close
              </Button>
            </div>
          ) : isInstallable ? (
            <div className="space-y-4">
              <p className="text-xs text-[#5E6F63] leading-relaxed">
                Add STILL POINT to your home screen for instantaneous field reporting, camera EXIF analysis, and offline IndexedDB persistence.
              </p>
              <div className="rounded-xl bg-[#E4E0D6]/40 p-4 space-y-2.5 text-xs text-[#26302A] border border-[#E4E0D6]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#5E6F63] shrink-0" />
                  <span>Full offline operation via IndexedDB field queue</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#5E6F63] shrink-0" />
                  <span>Optical EXIF GPS extraction at capture site</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#5E6F63] shrink-0" />
                  <span>Direct deterministic municipal ward dispatch</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  const success = await onInstall();
                  if (success) onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#C58A66] hover:bg-[#B37854] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Install Progressive Web App
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-xs text-[#5E6F63]">
                To install STILL POINT on iOS Safari:
              </p>
              <div className="space-y-3 rounded-xl bg-[#E4E0D6]/40 p-4 text-xs text-[#26302A] border border-[#E4E0D6]">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26302A] text-[#F6F4EF] text-[10px] font-bold">1</div>
                  <p className="pt-0.5">
                    Tap <strong className="inline-flex items-center gap-1 font-semibold text-[#26302A]"><Share className="h-3.5 w-3.5" /> Share</strong> in Safari's bottom toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26302A] text-[#F6F4EF] text-[10px] font-bold">2</div>
                  <p className="pt-0.5">
                    Select <strong className="inline-flex items-center gap-1 font-semibold text-[#26302A]"><PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26302A] text-[#F6F4EF] text-[10px] font-bold">3</div>
                  <p className="pt-0.5">Tap <strong className="text-[#26302A]">Add</strong> in the upper right corner.</p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full bg-[#26302A] text-[#F6F4EF] hover:bg-[#323E37]">
                Acknowledged
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#5E6F63]">
                To install STILL POINT on Android or Chromium browser:
              </p>
              <div className="space-y-3 rounded-xl bg-[#E4E0D6]/40 p-4 text-xs text-[#26302A] border border-[#E4E0D6]">
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26302A] text-[#F6F4EF] text-[10px] font-bold">1</div>
                  <p className="pt-0.5">Open STILL POINT in Chrome or Edge.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#26302A] text-[#F6F4EF] text-[10px] font-bold">2</div>
                  <p className="pt-0.5">Click browser menu <strong>(⋮)</strong> and tap <strong>Install App</strong>.</p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full bg-[#26302A] text-[#F6F4EF] hover:bg-[#323E37]">
                Understood
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
