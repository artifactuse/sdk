<template>
  <button 
    class="artifactuse-panel-toggle"
    :class="{ 
      'artifactuse-panel-toggle--active': state.isPanelOpen,
      'artifactuse-panel-toggle--has-artifacts': hasArtifacts
    }"
    @click="togglePanel"
    :title="state.isPanelOpen ? 'Close artifacts panel' : 'Open artifacts panel'"
  >
    <!-- Icon -->
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
    
    <!-- Badge with count -->
    <span 
      v-if="artifactCount > 0" 
      class="artifactuse-panel-toggle-badge"
    >
      {{ badgeText }}
    </span>
  </button>
</template>

<script>
import { computed, defineComponent } from 'vue';
import { useArtifactuse } from './composables.js';

export default defineComponent({
  name: 'ArtifactusePanelToggle',
  
  setup() {
    const { state, artifactCount, hasArtifacts, togglePanel } = useArtifactuse();
    
    const badgeText = computed(() => {
      const count = artifactCount.value;
      return count > 99 ? '99+' : String(count);
    });
    
    return {
      state,
      artifactCount,
      hasArtifacts,
      togglePanel,
      badgeText,
    };
  },
});
</script>

<style>
.artifactuse-panel-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgb(var(--artifactuse-surface));
  border: 1px solid rgb(var(--artifactuse-border));
  border-radius: 10px;
  color: rgb(var(--artifactuse-text-secondary));
  cursor: pointer;
  transition: all 0.2s ease;
}

.artifactuse-panel-toggle:hover {
  background: rgb(var(--artifactuse-surface-hover));
  color: rgb(var(--artifactuse-text));
  border-color: rgb(var(--artifactuse-border));
}

.artifactuse-panel-toggle--active {
  background: rgba(var(--artifactuse-primary), 0.15);
  border-color: rgb(var(--artifactuse-primary));
  color: rgb(var(--artifactuse-primary));
}

.artifactuse-panel-toggle--active:hover {
  background: rgba(var(--artifactuse-primary), 0.25);
}

.artifactuse-panel-toggle--has-artifacts {
  color: rgb(var(--artifactuse-primary));
}

.artifactuse-panel-toggle svg {
  width: 20px;
  height: 20px;
}

.artifactuse-panel-toggle-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: rgb(var(--artifactuse-primary));
  color: white;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
}

/* Pulse animation for new artifacts */
@keyframes artifactuse-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--artifactuse-primary), 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(var(--artifactuse-primary), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--artifactuse-primary), 0);
  }
}

.artifactuse-panel-toggle--has-artifacts:not(.artifactuse-panel-toggle--active) {
  animation: artifactuse-pulse 2s ease-in-out 3;
}
</style>
