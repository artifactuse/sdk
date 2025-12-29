// src/vue2/index.js

// Re-export composables
export {
  provideArtifactuse,
  useArtifactuse,
  createArtifactuseComposable,
  defineComponent,
  ARTIFACTUSE_KEY,
} from './composables.js';

// Export components
export { default as ArtifactuseAgentMessage } from './ArtifactuseAgentMessage.vue';
export { default as ArtifactusePanel } from './ArtifactusePanel.vue';
export { default as ArtifactusePanelToggle } from './ArtifactusePanelToggle.vue';
export { default as ArtifactuseCard } from './ArtifactuseCard.vue';
export { default as ArtifactuseViewer } from './ArtifactuseViewer.vue';
export { default as ArtifactuseInlineForm } from './ArtifactuseInlineForm.vue';
export { default as ArtifactuseSocialPreview } from './ArtifactuseSocialPreview.vue';

// Default export
import {
  provideArtifactuse,
  useArtifactuse,
  createArtifactuseComposable,
} from './composables.js';

export default {
  provideArtifactuse,
  useArtifactuse,
  createArtifactuseComposable,
};