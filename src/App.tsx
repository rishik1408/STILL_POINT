import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PWAInstallModal } from '@/components/landing/PWAInstallModal';
import { usePWAInstall } from '@/lib/hooks/use-pwa-install';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';

// Citizen Portal Pages
import { UserLayout } from '@/pages/user/UserLayout';
import { UserMapPage } from '@/pages/user/UserMapPage';
import { ReportIssuePage } from '@/pages/user/ReportIssuePage';
import { AssetRegistryPage } from '@/pages/user/AssetRegistryPage';
import { AIAuditorPage } from '@/pages/user/AIAuditorPage';

// Official Console Pages
import { OfficialLayout } from '@/pages/official/OfficialLayout';
import { OfficialDashboardPage } from '@/pages/official/OfficialDashboardPage';
import { OfficialMapPage } from '@/pages/official/OfficialMapPage';
import { UpdateProgressPage } from '@/pages/official/UpdateProgressPage';

export function App() {
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false);
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    downloadOfflinePackage,
  } = usePWAInstall();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col bg-[#F6F4EF] text-[#26302A]">
              <Navbar onOpenPwaModal={() => setIsPwaModalOpen(true)} />
              <main className="flex-1">
                <LandingPage onOpenPwaModal={() => setIsPwaModalOpen(true)} />
              </main>
              <Footer />
            </div>
          }
        />

        {/* Portal Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Citizen Portal Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="/user/map" replace />} />
          <Route path="map" element={<UserMapPage />} />
          <Route path="report" element={<ReportIssuePage />} />
          <Route path="registry" element={<AssetRegistryPage />} />
          <Route path="auditor" element={<AIAuditorPage />} />
        </Route>

        {/* Municipal Official Routes */}
        <Route path="/official" element={<OfficialLayout />}>
          <Route index element={<OfficialDashboardPage />} />
          <Route path="map" element={<OfficialMapPage />} />
          <Route path="update/:issueId" element={<UpdateProgressPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isAndroid={isAndroid}
        onInstall={promptInstall}
        onDownloadPackage={downloadOfflinePackage}
      />
    </BrowserRouter>
  );
}

export default App;
