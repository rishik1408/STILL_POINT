import { StillPointLogo } from '@/components/ui/StillPointLogo';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Cpu, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#EDE9E0] border-t border-[#E4E0D6] text-[#26302A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <StillPointLogo
              size={54}
              subtitle="Public Infrastructure Asset Monitoring System"
              className="!items-start"
            />
            <p className="text-sm text-[#5E6F63] leading-relaxed max-w-md pt-2">
              STILL POINT is an open-architecture civic intelligence platform connecting citizens and municipal engineers. Real-time spatial EXIF photo capture, deterministic PostGIS ward routing, and verified before-and-after AI audit verification.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-[#5E6F63]">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4E0D6] font-medium text-[#26302A]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5E6F63]" /> PostGIS Verified
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E4E0D6] font-medium text-[#26302A]">
                <Cpu className="w-3.5 h-3.5 text-[#C58A66]" /> AI Repair Audit
              </span>
            </div>
          </div>

          {/* Civic Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26302A] mb-4">
              Civic Modules
            </h4>
            <ul className="space-y-2.5 text-sm text-[#5E6F63]">
              <li>
                <Link to="/user/map" className="hover:text-[#26302A] transition-colors">
                  Interactive Ward Map
                </Link>
              </li>
              <li>
                <Link to="/user/report" className="hover:text-[#26302A] transition-colors">
                  Report Infrastructure Defect
                </Link>
              </li>
              <li>
                <Link to="/user/registry" className="hover:text-[#26302A] transition-colors">
                  Monitored Asset Registry
                </Link>
              </li>
              <li>
                <Link to="/user/auditor" className="hover:text-[#26302A] transition-colors">
                  Paired AI Repair Auditor
                </Link>
              </li>
              <li>
                <Link to="/official" className="hover:text-[#26302A] transition-colors">
                  Municipal Officials Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational Wards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26302A] mb-4">
              BBMP Bengaluru Zones
            </h4>
            <ul className="space-y-2.5 text-sm text-[#5E6F63]">
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C58A66]" />
                <span>BBMP East — Indiranagar & MG Road</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C58A66]" />
                <span>BBMP South — Koramangala & HSR</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C58A66]" />
                <span>BBMP Mahadevapura — Bellandur ORR</span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C58A66]" />
                <span>BBMP West — Malleshwaram & Rajajinagar</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#E4E0D6] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5E6F63]">
          <p>© {new Date().getFullYear()} STILL POINT. All rights reserved. Built for civic transparency.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#26302A] font-medium">Stone & Sage Edition</span>
            <span>•</span>
            <Link to="/login" className="hover:text-[#26302A] underline underline-offset-4">
              Official Portal Access
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
