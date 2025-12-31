<script>
  import { getArtifactuseContext } from './index.js';
  
  const { isPanelOpen, artifactCount, hasArtifacts, togglePanel } = getArtifactuseContext();
  
  $: panelOpen = $isPanelOpen;
  $: count = $artifactCount;
  $: hasItems = $hasArtifacts;
  
  $: badgeText = count > 99 ? '99+' : String(count);
  
  $: buttonClass = [
    'artifactuse-panel-toggle',
    panelOpen && 'artifactuse-panel-toggle--active',
    hasItems && 'artifactuse-panel-toggle--has-artifacts',
  ].filter(Boolean).join(' ');
</script>

<button 
  class={buttonClass}
  on:click={togglePanel}
  title={panelOpen ? 'Close artifacts panel' : 'Open artifacts panel'}
>
  <!-- Icon -->
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>
  
  <!-- Badge with count -->
  {#if count > 0}
    <span class="artifactuse-panel-toggle-badge">
      {badgeText}
    </span>
  {/if}
</button>