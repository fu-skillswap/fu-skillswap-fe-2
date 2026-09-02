/**
 * @file Tabs.tsx
 * @description Segmented Navigation Tabs primitive for SkillSwap UI Foundation.
 */

import React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
  variant?: 'segmented' | 'underline';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Tabs navigation',
  className = '',
  variant = 'segmented',
}: TabsProps) {
  const isUnderline = variant === 'underline';

  return (
    <div
      className={`inline-flex items-center ${
        isUnderline
          ? 'gap-10 border-b border-solid border-border-light'
          : 'gap-1 rounded-xl border border-solid border-border-light bg-surface-subtle p-1'
      } ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`relative flex cursor-pointer items-center gap-1.5 border-none bg-transparent transition-all duration-150 ${
              isUnderline
                ? `h-11 px-1 text-sm font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
                    isActive
                      ? 'text-primary after:bg-primary'
                      : 'text-text-muted after:bg-transparent hover:text-text-main'
                  }`
                : `h-9 rounded-lg px-4 text-xs font-semibold ${
                    isActive
                      ? 'bg-white font-bold text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-main'
                  }`
            }`.trim()}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && (
              <span className="shrink-0 inline-flex items-center justify-center">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.badge && <span className="shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
