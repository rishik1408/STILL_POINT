'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  ShieldAlert,
  Building2,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Issue, Asset } from '@/types';
import { SeverityBadge, StatusBadge, Badge, Button } from '@/components/ui/shared';
import { formatDate, formatDateTime, getSLAStatus } from '@/lib/utils';
import Link from 'next/link';

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
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">
              {issue ? `Ticket #${issue.id.slice(0, 8)}` : `Asset #${currentAsset?.id.slice(0, 8)}`}
            </span>
            {issue && <StatusBadge status={issue.status} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Photos */}
          {issue?.media && issue.media.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Photography</h4>
              <div className="grid grid-cols-2 gap-2">
                {issue.media.map((m) => (
                  <div key={m.id} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={m.file_url} alt={m.stage} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white uppercase">
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
              <span className="text-xs text-slate-500 font-medium">
                {issue ? issue.category : currentAsset?.asset_type.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {currentAsset?.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {currentAsset?.lat?.toFixed(4)}° N, {currentAsset?.lng?.toFixed(4)}° E
              </span>
            </p>
          </div>

          {/* Technical Assessment Summary */}
          {issue && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" /> Technical Assessment
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Conf: {((issue.human_final_json?.confidence || issue.ai_raw_json?.confidence || 0.9) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {issue.human_final_json?.technical_summary || issue.ai_raw_json?.technical_summary}
              </p>
              {issue.human_final_json?.user_note && (
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Citizen Note: </span>
                  {issue.human_final_json.user_note}
                </div>
              )}
            </div>
          )}

          {/* SLA Status Card */}
          {issue && slaInfo && (
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              slaInfo.isBreached
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 ${slaInfo.isBreached ? 'text-red-600' : 'text-blue-600'}`} />
                <div>
                  <p className="text-xs font-bold">Municipal SLA Deadline</p>
                  <p className="text-xs opacity-90">{formatDate(issue.sla_due_at || '')}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                slaInfo.isBreached ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
              }`}>
                {slaInfo.label}
              </span>
            </div>
          )}

          {/* Assigned Municipal Authority */}
          {issue?.authority && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-600" /> Mapped Municipal Ward
              </span>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-900">{issue.authority.ward_name}</p>
                <p className="text-slate-600">{issue.authority.department_name}</p>
                <p className="text-slate-500">Contact: {issue.authority.contact_name}</p>
                <a
                  href={`mailto:${issue.authority.email}`}
                  className="text-blue-600 hover:underline block pt-1 font-mono text-[11px]"
                >
                  {issue.authority.email}
                </a>
              </div>
            </div>
          )}

          {/* Chronological Audit Trail */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-slate-400" /> Chronological Audit Trail
            </span>

            <div className="border-l-2 border-slate-200 pl-4 space-y-4 ml-1">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                <p className="text-xs font-bold text-slate-900">Issue Reported by Citizen</p>
                <p className="text-[11px] text-slate-500">{issue ? formatDateTime(issue.created_at) : 'Initial Entry'}</p>
              </div>

              {issue?.status_updates?.map((u) => (
                <div key={u.id} className="relative">
                  <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                    u.new_status === 'Verified Closed'
                      ? 'bg-emerald-600'
                      : u.new_status === 'Escalated'
                      ? 'bg-red-600'
                      : 'bg-amber-500'
                  }`} />
                  <p className="text-xs font-bold text-slate-900">
                    Status: {u.new_status}
                  </p>
                  {u.notes && <p className="text-xs text-slate-600 mt-0.5">{u.notes}</p>}
                  {u.audit_verdict && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>AI Audit: {u.audit_verdict} ({((u.audit_confidence || 0.95) * 100).toFixed(0)}%)</span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(u.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Link href="/user/report" className="flex-1">
            <Button variant="outline" className="w-full text-xs" size="sm">
              Report Nearby Defect
            </Button>
          </Link>
          <Button onClick={onClose} variant="secondary" className="text-xs" size="sm">
            Close Panel
          </Button>
        </div>
      </div>
    </AnimatePresence>
  );
}
