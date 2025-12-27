// artifactuse/react/ArtifactusePanelToggle.jsx
// React component for panel toggle button with badge

import React, { useMemo } from 'react';
import { useArtifactuse } from './index.js';

/**
 * ArtifactusePanelToggle Component
 * 
 * Toggle button with artifact count badge
 */
export default function ArtifactusePanelToggle({ className = '' }) {
  const { state, artifactCount, hasArtifacts, togglePanel } = useArtifactuse();
  
  const badgeText = useMemo(() => {
    return artifactCount > 99 ? '99+' : String(artifactCount);
  }, [artifactCount]);
  
  const buttonClasses = [
    'artifactuse-panel-toggle',
    state.isPanelOpen && 'artifactuse-panel-toggle--active',
    hasArtifacts && 'artifactuse-panel-toggle--has-artifacts',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={buttonClasses}
      onClick={togglePanel}
      title={state.isPanelOpen ? 'Close artifacts panel' : 'Open artifacts panel'}
    >
      {/* Icon */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
      
      {/* Badge with count */}
      {artifactCount > 0 && (
        <span className="artifactuse-panel-toggle-badge">
          {badgeText}
        </span>
      )}
    </button>
  );
}
