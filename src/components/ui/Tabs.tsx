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
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Tabs navigation',
  className = '',
}: TabsProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-solid border-border-light ${className}`.trim()}
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
            className={`h-9 px-4 text-xs font-semibold rounded-lg border-none bg-transparent cursor-pointer flex items-center gap-1.5 transition-all duration-150 ${isActive ? 'bg-white text-primary shadow-xs font-bold' : 'text-text-muted hover:text-text-main'}`.trim()}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="shrink-0 inline-flex items-center justify-center">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
