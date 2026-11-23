'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error iOS Safari standalone check
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
    }

    // Detect Device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const downloadOfflinePackage = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>STILL POINT — Bengaluru Civic Infrastructure Field App</title>
  <link rel="manifest" href="${appUrl}/manifest.webmanifest">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="STILL POINT">
  <meta name="theme-color" content="#26302A">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #F6F4EF;
      color: #26302A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E4E0D6;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    h1 {
      font-size: 22px;
      margin: 16px 0 8px;
      color: #26302A;
    }
    p {
      font-size: 13px;
      color: #5E6F63;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      background: #C58A66;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 14px 20px;
      border-radius: 12px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(197, 138, 102, 0.3);
    }
    .badge {
      display: inline-block;
      background: #EDE9E0;
      color: #26302A;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">BBMP Civic Infrastructure</span>
    <h1>STILL POINT Mobile App</h1>
    <p>Field Defect Capture • EXIF GPS • Offline Sync</p>
    <a href="${appUrl}/user/report" class="btn">Launch Field Reporter</a>
    <a href="${appUrl}" style="font-size: 12px; color: #5E6F63; text-decoration: underline;">Open Municipal Portal</a>
  </div>
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('${appUrl}/sw.js').catch(console.error);
    }
    setTimeout(() => {
      window.location.href = '${appUrl}/user/report';
    }, 1200);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'STILL_POINT_Field_App.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // Trigger package download as fallback
      downloadOfflinePackage();
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return choice.outcome === 'accepted';
    } catch (err) {
      console.error('Error triggering PWA install:', err);
      downloadOfflinePackage();
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    downloadOfflinePackage,
  };
}
