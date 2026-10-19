import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface OrderCountdownBadgeProps {
  createdAt?: string;
  acceptanceDeadline?: string | null;
  onExpire?: () => void;
  className?: string;
}

export const OrderCountdownBadge: React.FC<OrderCountdownBadgeProps> = ({
  createdAt,
  acceptanceDeadline,
  onExpire,
  className = ''
}) => {
  const calculateRemainingSeconds = (): number => {
    const now = Date.now();
    if (acceptanceDeadline) {
      const deadline = new Date(acceptanceDeadline).getTime();
      return Math.max(0, Math.floor((deadline - now) / 1000));
    }
    if (createdAt) {
      const created = new Date(createdAt).getTime();
      const elapsed = Math.floor((now - created) / 1000);
      return Math.max(0, 90 - elapsed);
    }
    return 90;
  };

  const [remaining, setRemaining] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    // Initial check
    const initial = calculateRemainingSeconds();
    setRemaining(initial);
    if (initial === 0 && onExpire) {
      onExpire();
    }

    const interval = setInterval(() => {
      const current = calculateRemainingSeconds();
      setRemaining(current);
      if (current === 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [acceptanceDeadline, createdAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (remaining === 0) {
    return (
      <span
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Acceptance Expired</span>
      </span>
    );
  }

  // Visual urgency styling
  let urgencyStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400';
  if (remaining <= 15) {
    urgencyStyles = 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/25 dark:border-rose-500/60 dark:text-rose-400 animate-pulse font-black shadow-lg shadow-rose-500/20';
  } else if (remaining <= 45) {
    urgencyStyles = 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300 font-bold';
  }

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-black border transition-colors ${urgencyStyles} ${className}`}
      title={`Automated auto-rejection occurs in ${remaining}s if not accepted`}
    >
      <Clock className={`w-3.5 h-3.5 shrink-0 ${remaining <= 15 ? 'animate-spin' : ''}`} />
      <span>Accept within {formatted}</span>
    </span>
  );
};
