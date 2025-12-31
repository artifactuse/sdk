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