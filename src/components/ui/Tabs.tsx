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
    <div className={`ui-tabs-list ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ui-tab-button ${isActive ? 'ui-tab-active' : ''}`.trim()}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="ui-tab-icon">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ui-tab-badge">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
