'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  Building2,
  FileText,
  History,
  CheckCircle2,
} from 'lucide-react';
import { Issue, Asset } from '@/types';
import { SeverityBadge, StatusBadge, Button } from '@/components/ui/shared';
import { formatDate, formatDateTime, getSLAStatus } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface AssetDetailSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  asset: Asset | null;
}

export function AssetDetailSlideOver({
  isOpen,
  onClose,
  issue,
  asset,
}: AssetDetailSlideOverProps) {
  if (!isOpen || (!issue && !asset)) return null;

  const currentAsset = issue?.asset || asset;
  const slaInfo = issue ? getSLAStatus(issue.sla_due_at) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#F6F4EF] shadow-2xl border-l border-[#E4E0D6] flex flex-col antialiased text-[#26302A]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4E0D6] flex items-center justify-between bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#A3AD9C] uppercase">
              {issue ? `Ticket #${issue.id.slice(0, 8)}` : `Asset #${currentAsset?.id.slice(0, 8)}`}
            </span>
            {issue && <StatusBadge status={issue.status} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]/60 transition cursor-pointer"
            aria-label="Close details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Photos */}
          {issue?.media && issue.media.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono uppercase font-bold text-[#5E6F63] tracking-wider">
                Field Evidence Photography
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {issue.media.map((m) => (
                  <div key={m.id} className="relative aspect-video rounded-xl overflow-hidden bg-[#E4E0D6] border border-[#E4E0D6]">
                    <img src={m.file_url} alt={m.stage} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-[#26302A]/80 text-[#F6F4EF]">
                      {m.stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Title & Severity */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {issue && <SeverityBadge severity={issue.severity} />}
              <span className="text-[11px] font-mono text-[#5E6F63] uppercase">
                {issue ? issue.category : currentAsset?.asset_type.replace('_', ' ')}
              </span>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#26302A] leading-snug">
              {currentAsset?.name}
            </h3>
            <p className="text-xs text-[#5E6F63] flex items-center gap-1 mt-1 font-mono">
              <MapPin className="h-3.5 w-3.5 text-[#C58A66]" />
              <span>
                {currentAsset?.lat?.toFixed(4)}° N, {currentAsset?.lng?.toFixed(4)}° E
              </span>
            </p>
          </div>

          {/* Technical Assessment Summary */}
          {issue && (
            <div className="p-4 rounded-2xl bg-white/70 border border-[#E4E0D6] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#26302A] flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#5E6F63]" /> Engineering Assessment
                </span>
                <span className="text-[10px] text-[#A3AD9C] font-mono font-bold">
                  Confidence: {((issue.human_final_json?.confidence || issue.ai_raw_json?.confidence || 0.9) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-[#26302A]/80 leading-relaxed font-sans">
                {issue.human_final_json?.technical_summary || issue.ai_raw_json?.technical_summary || 'Assessment pending on-site evaluation.'}
              </p>
              {issue.human_final_json?.user_note && (
                <div className="pt-2 border-t border-[#E4E0D6] text-xs text-[#5E6F63]">
                  <span className="font-semibold text-[#26302A]">Citizen Note: </span>
                  {issue.human_final_json.user_note}
                </div>
              )}
            </div>
          )}

          {/* SLA Status Card */}
          {issue && slaInfo && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              slaInfo.isBreached
                ? 'bg-[#A84835]/10 border-[#A84835]/30 text-[#702115]'
                : 'bg-white/70 border-[#E4E0D6] text-[#26302A]'
            }`}>
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 ${slaInfo.isBreached ? 'text-[#A84835]' : 'text-[#5E6F63]'}`} />
                <div>
                  <p className="text-xs font-serif font-bold">Municipal SLA Deadline</p>
                  <p className="text-xs font-mono opacity-80">{formatDate(issue.sla_due_at || '')}</p>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg ${
                slaInfo.isBreached ? 'bg-[#A84835]/20 text-[#702115]' : 'bg-[#E4E0D6] text-[#5E6F63]'
              }`}>
                {slaInfo.label}
              </span>
            </div>
          )}

          {/* Assigned Municipal Authority */}
          {issue?.authority && (
            <div className="p-4 rounded-2xl bg-white/70 border border-[#E4E0D6] space-y-2">
              <span className="text-xs font-semibold text-[#26302A] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#5E6F63]" /> Mapped Municipal Ward
              </span>
              <div className="text-xs space-y-1">
                <p className="font-bold text-[#26302A]">{issue.authority.ward_name}</p>
                <p className="text-[#5E6F63]">{issue.authority.department_name}</p>
                <p className="text-[#5E6F63]">Official: {issue.authority.contact_name}</p>
                <a
                  href={`mailto:${issue.authority.email}`}
                  className="text-[#C58A66] hover:underline block pt-1 font-mono text-[11px]"
                >
                  {issue.authority.email}
                </a>
              </div>
            </div>
          )}

          {/* Chronological Audit Trail */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold text-[#5E6F63] uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-[#A3AD9C]" /> Chronological Audit Trail
            </span>

            <div className="border-l-2 border-[#E4E0D6] pl-4 space-y-4 ml-1">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-[#26302A] ring-4 ring-[#F6F4EF]" />
                <p className="text-xs font-serif font-bold text-[#26302A]">Defect Reported by Citizen</p>
                <p className="text-[10px] font-mono text-[#A3AD9C]">{issue ? formatDateTime(issue.created_at) : 'Initial Entry'}</p>
              </div>

              {issue?.status_updates?.map((u) => (
                <div key={u.id} className="relative">
                  <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-[#F6F4EF] ${
                    u.new_status === 'Verified Closed'
                      ? 'bg-[#5E6F63]'
                      : u.new_status === 'Escalated'
                      ? 'bg-[#A84835]'
                      : 'bg-[#C58A66]'
                  }`} />
                  <p className="text-xs font-serif font-bold text-[#26302A]">
                    Status: {u.new_status}
                  </p>
                  {u.notes && <p className="text-xs text-[#5E6F63] mt-0.5 font-sans">{u.notes}</p>}
                  {u.audit_verdict && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#5E6F63]/15 text-[#5E6F63] font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>AI Audit: {u.audit_verdict} ({((u.audit_confidence || 0.95) * 100).toFixed(0)}%)</span>
                    </div>
                  )}
                  <p className="text-[10px] font-mono text-[#A3AD9C] mt-1">{formatDateTime(u.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E4E0D6] bg-white/70 backdrop-blur-sm flex items-center justify-between gap-3">
          <Link to="/user/report" className="flex-1">
            <Button variant="outline" className="w-full text-xs" size="sm">
              Report Nearby Defect
            </Button>
          </Link>
          <Button onClick={onClose} variant="secondary" className="text-xs bg-[#26302A] text-[#F6F4EF]" size="sm">
            Close Panel
          </Button>
        </div>
      </div>
    </AnimatePresence>
  );
}
