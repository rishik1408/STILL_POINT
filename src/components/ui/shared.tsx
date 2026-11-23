'use client';

import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

// ==================== Button ====================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'clay' | 'accent' | 'stone';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-wide select-none';

  const variants = {
    // Primary: Bark deep timber with stone text & clay focus
    primary:
      'bg-[#26302A] text-[#F6F4EF] hover:bg-[#34423A] shadow-sm hover:shadow focus-visible:ring-[#C58A66]',
    // Secondary: Moss tone with stone text
    secondary:
      'bg-[#5E6F63] text-[#F6F4EF] hover:bg-[#4D5E52] shadow-sm hover:shadow focus-visible:ring-[#5E6F63]',
    // Clay / Accent: Warm terracotta CTA
    clay:
      'bg-[#C58A66] text-white hover:bg-[#B57955] shadow-sm hover:shadow focus-visible:ring-[#C58A66]',
    accent:
      'bg-[#C58A66] text-white hover:bg-[#B57955] shadow-sm hover:shadow focus-visible:ring-[#C58A66]',
    // Outline: Linen border with Bark text & stone hover
    outline:
      'border border-[#26302A] text-[#26302A] bg-transparent hover:bg-[#E4E0D6]/40 focus-visible:ring-[#26302A]',
    // Ghost: Moss text hovering to Bark with linen wash
    ghost:
      'text-[#5E6F63] hover:text-[#26302A] hover:bg-[#E4E0D6]/50 focus-visible:ring-[#A3AD9C]',
    // Stone: Soft Stone surface with subtle Linen border
    stone:
      'bg-[#E4E0D6]/60 text-[#26302A] border border-[#E4E0D6] hover:bg-[#E4E0D6] focus-visible:ring-[#5E6F63]',
    // Danger: Muted terracotta red
    danger:
      'bg-[#A84835] text-white hover:bg-[#8F3B2A] shadow-sm focus-visible:ring-[#A84835]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// ==================== Card ====================

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'stone' | 'white' | 'glass' | 'dark';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  variant = 'stone',
  hover,
  onClick,
}: CardProps) {
  const variantStyles = {
    stone: 'bg-[#FAF9F5] border border-[#E4E0D6] text-[#26302A]',
    white: 'bg-white border border-[#E4E0D6] text-[#26302A]',
    glass: 'bg-[#FAF9F5]/85 backdrop-blur-md border border-[#E4E0D6] text-[#26302A]',
    dark: 'bg-[#26302A] border border-[#34423A] text-[#F6F4EF]',
  };

  return (
    <div
      className={cn(
        'rounded-2xl shadow-[0_1px_3px_rgba(38,48,42,0.04)] transition-all duration-200',
        variantStyles[variant],
        hover &&
          'hover:shadow-[0_6px_20px_rgba(38,48,42,0.08)] hover:border-[#A3AD9C] cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// ==================== Badge ====================

interface BadgeProps {
  children: ReactNode;
  variant?:
    | 'default'
    | 'stone'
    | 'sage'
    | 'moss'
    | 'bark'
    | 'clay'
    | 'blue'
    | 'amber'
    | 'red'
    | 'emerald'
    | 'violet'
    | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
}: BadgeProps) {
  const variants = {
    // Stone & Sage primary badges
    default: 'bg-[#E4E0D6] text-[#26302A] border border-[#E4E0D6]',
    stone: 'bg-[#F6F4EF] text-[#26302A] border border-[#E4E0D6]',
    sage: 'bg-[#A3AD9C]/25 text-[#26302A] border border-[#A3AD9C]/35',
    moss: 'bg-[#5E6F63] text-[#F6F4EF]',
    bark: 'bg-[#26302A] text-[#F6F4EF]',
    clay: 'bg-[#C58A66] text-white',

    // Semantic colors mapped to Stone & Sage palette
    blue: 'bg-[#A3AD9C]/25 text-[#26302A] border border-[#A3AD9C]/35',
    amber: 'bg-[#C58A66]/20 text-[#8A4E2D] border border-[#C58A66]/30',
    red: 'bg-[#A84835]/15 text-[#702115] border border-[#A84835]/25',
    emerald: 'bg-[#5E6F63]/20 text-[#26302A] border border-[#5E6F63]/30',
    violet: 'bg-[#26302A]/10 text-[#26302A] border border-[#26302A]/20',
    orange: 'bg-[#C58A66]/25 text-[#8A4E2D] border border-[#C58A66]/40',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs tracking-wide',
    md: 'px-3.5 py-1 text-sm tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full leading-relaxed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ==================== Input ====================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[#26302A]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E6F63]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-[#E4E0D6] bg-white/90 px-4 py-2.5 text-sm text-[#26302A] placeholder:text-[#5E6F63]/50 focus:border-[#C58A66] focus:ring-2 focus:ring-[#C58A66]/20 outline-none transition-all',
            icon && 'pl-10',
            error && 'border-[#A84835] focus:border-[#A84835] focus:ring-[#A84835]/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#A84835] mt-1">{error}</p>}
    </div>
  );
}

// ==================== Textarea ====================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-[#26302A]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full rounded-xl border border-[#E4E0D6] bg-white/90 px-4 py-2.5 text-sm text-[#26302A] placeholder:text-[#5E6F63]/50 focus:border-[#C58A66] focus:ring-2 focus:ring-[#C58A66]/20 outline-none transition-all resize-none',
          error && 'border-[#A84835] focus:border-[#A84835] focus:ring-[#A84835]/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#A84835] mt-1">{error}</p>}
    </div>
  );
}

// ==================== Select ====================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  placeholder?: string;
}

export function Select({ label, options, children, error, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[#26302A]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full rounded-xl border border-[#E4E0D6] bg-white/90 px-4 py-2.5 text-sm text-[#26302A] focus:border-[#C58A66] focus:ring-2 focus:ring-[#C58A66]/20 outline-none transition-all',
          error && 'border-[#A84835]',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-xs text-[#A84835] mt-1">{error}</p>}
    </div>
  );
}

// ==================== Stat Card ====================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet' | 'clay' | 'moss' | 'bark';
}

export function StatCard({ title, value, icon, trend, color = 'bark' }: StatCardProps) {
  const colors = {
    bark: 'border-[#E4E0D6] bg-[#FAF9F5]',
    moss: 'border-[#E4E0D6] bg-[#FAF9F5]',
    clay: 'border-[#E4E0D6] bg-[#FAF9F5]',
    blue: 'border-[#E4E0D6] bg-[#FAF9F5]',
    emerald: 'border-[#E4E0D6] bg-[#FAF9F5]',
    amber: 'border-[#E4E0D6] bg-[#FAF9F5]',
    red: 'border-[#E4E0D6] bg-[#FAF9F5]',
    violet: 'border-[#E4E0D6] bg-[#FAF9F5]',
  };

  const iconColors = {
    bark: 'text-[#26302A] bg-[#E4E0D6]/70',
    moss: 'text-[#5E6F63] bg-[#5E6F63]/15',
    clay: 'text-[#C58A66] bg-[#C58A66]/15',
    blue: 'text-[#5E6F63] bg-[#A3AD9C]/20',
    emerald: 'text-[#5E6F63] bg-[#5E6F63]/15',
    amber: 'text-[#8A4E2D] bg-[#C58A66]/15',
    red: 'text-[#702115] bg-[#A84835]/15',
    violet: 'text-[#26302A] bg-[#E4E0D6]/70',
  };

  return (
    <Card className={cn('p-5 border', colors[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#5E6F63] uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-3xl font-bold font-serif text-[#26302A] tracking-tight">{value}</p>
          {trend && (
            <p className={cn('mt-1.5 text-xs font-medium', trend.value >= 0 ? 'text-[#5E6F63]' : 'text-[#A84835]')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-xl', iconColors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ==================== Empty State ====================

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 p-4 rounded-2xl bg-[#E4E0D6]/50 text-[#5E6F63] border border-[#E4E0D6]">
        {icon}
      </div>
      <h3 className="text-lg font-serif font-bold text-[#26302A] tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-[#5E6F63] max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ==================== Severity Badge ====================

export function SeverityBadge({ severity }: { severity: number }) {
  const config: Record<number, { label: string; variant: BadgeProps['variant'] }> = {
    1: { label: 'Low', variant: 'blue' },
    2: { label: 'Medium', variant: 'amber' },
    3: { label: 'High', variant: 'orange' },
    4: { label: 'Critical', variant: 'red' },
  };
  const { label, variant } = config[severity] || config[1];
  return <Badge variant={variant}>{label} (S{severity})</Badge>;
}

// ==================== Status Badge ====================

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, BadgeProps['variant']> = {
    'Reported': 'stone',
    'In Progress': 'amber',
    'Repair Claimed': 'sage',
    'Escalated': 'red',
    'Verified Closed': 'moss',
  };
  return <Badge variant={config[status] || 'default'}>{status}</Badge>;
}

// ==================== Loading Spinner ====================

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <svg className={cn('animate-spin text-[#C58A66]', sizes[size])} viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

// ==================== Step Indicator ====================

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all',
              index < currentStep
                ? 'bg-[#5E6F63] text-[#F6F4EF]'
                : index === currentStep
                  ? 'bg-[#26302A] text-[#F6F4EF] ring-4 ring-[#C58A66]/30'
                  : 'bg-[#E4E0D6] text-[#5E6F63]'
            )}
          >
            {index < currentStep ? '✓' : index + 1}
          </div>
          <span
            className={cn(
              'text-xs font-medium hidden sm:inline',
              index <= currentStep ? 'text-[#26302A]' : 'text-[#5E6F63]/60'
            )}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-8 h-0.5 rounded',
                index < currentStep ? 'bg-[#5E6F63]' : 'bg-[#E4E0D6]'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
