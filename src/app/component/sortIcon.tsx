import React from 'react';

interface SortIconProps {
  active: boolean;
  direction: 'asc' | 'desc';
  /** Extra classes for the outer wrapper. */
  className?: string;
}

/**
 * Always-visible sort indicator showing both up & down arrows stacked.
 * The active arrow (matching `direction` when `active`) is highlighted; the
 * inactive one stays muted so users can always see the column is sortable.
 */
const SortIcon: React.FC<SortIconProps> = ({ active, direction, className = '' }) => {
  const upActive = active && direction === 'asc';
  const downActive = active && direction === 'desc';
  return (
    <span
      aria-hidden="true"
      className={`inline-flex flex-col leading-none align-middle ml-1 select-none ${className}`}
    >
      <span className={`text-[9px] leading-[9px] ${upActive ? 'text-[#383d71]' : 'text-gray-400'}`}>▲</span>
      <span className={`text-[9px] leading-[9px] -mt-px ${downActive ? 'text-[#383d71]' : 'text-gray-400'}`}>▼</span>
    </span>
  );
};

export default SortIcon;
