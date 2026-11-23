'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/shared';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-100"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B365D] text-white shadow-md">
              <Smartphone className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Install PIAMS App</h3>
              <p className="text-xs text-slate-500">Fast offline field capture & real-time alerts</p>
            </div>
          </div>

          {isInstalled ? (
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
              <p className="text-sm font-semibold text-emerald-900">App Already Installed!</p>
              <p className="text-xs text-emerald-700 mt-1">
                You are currently running or have already installed PIAMS on your device.
              </p>
              <Button onClick={onClose} className="mt-4 w-full" variant="outline" size="sm">
                Close
              </Button>
            </div>
          ) : isInstallable ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Install PIAMS on your home screen for quick offline reporting, camera integration, and instant status notifications.
              </p>
              <div className="rounded-xl bg-slate-50 p-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Works completely offline with IndexedDB field caching</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Direct camera EXIF GPS coordinate extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>No app store download required</span>
                </div>
              </div>
              <Button
                onClick={async () => {
                  const success = await onInstall();
                  if (success) onClose();
                }}
                className="w-full flex items-center justify-center gap-2"
                size="lg"
              >
                <Download className="h-5 w-5" />
                Add to Home Screen Now
              </Button>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                To install PIAMS on your iPhone or iPad:
              </p>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">1</div>
                  <p className="pt-0.5">
                    Tap the <strong className="inline-flex items-center gap-1 font-semibold text-slate-900"><Share className="h-3.5 w-3.5" /> Share</strong> button in Safari's bottom toolbar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">2</div>
                  <p className="pt-0.5">
                    Scroll down and select <strong className="inline-flex items-center gap-1 font-semibold text-slate-900"><PlusSquare className="h-3.5 w-3.5" /> Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">3</div>
                  <p className="pt-0.5">Tap <strong>Add</strong> in the top right corner.</p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full" variant="secondary">
                Got it
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                To install PIAMS on your Android phone or Chrome desktop:
              </p>
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">1</div>
                  <p className="pt-0.5">Open this site in Chrome or Edge.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">2</div>
                  <p className="pt-0.5">Tap the browser menu <strong>(⋮)</strong> and select <strong>Install App</strong> or <strong>Add to Home screen</strong>.</p>
                </div>
              </div>
              <Button onClick={onClose} className="w-full" variant="secondary">
                Understood
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
