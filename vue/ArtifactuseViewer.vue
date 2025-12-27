<template>
  <Teleport to="body">
    <Transition name="artifactuse-viewer">
      <div 
        v-if="isOpen"
        class="artifactuse-viewer-overlay"
        @click="close"
        @keydown.escape="close"
        tabindex="-1"
        ref="overlayRef"
      >
        <div class="artifactuse-viewer-content" @click.stop>
          <!-- Image -->
          <img 
            v-if="type === 'image'"
            :src="src" 
            :alt="alt"
            class="artifactuse-viewer-image"
            :class="{ 'artifactuse-viewer-image--zoomed': isZoomed }"
            @click="toggleZoom"
          />
          
          <!-- PDF -->
          <iframe
            v-else-if="type === 'pdf'"
            :src="src"
            class="artifactuse-viewer-pdf"
          />
          
          <!-- Close button -->
          <button 
            class="artifactuse-viewer-close"
            @click="close"
            title="Close (Esc)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <!-- Zoom controls (images only) -->
          <div v-if="type === 'image'" class="artifactuse-viewer-controls">
            <button 
              class="artifactuse-viewer-control"
              @click.stop="toggleZoom"
              :title="isZoomed ? 'Zoom out' : 'Zoom in'"
            >
              <svg v-if="!isZoomed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            
            <button 
              class="artifactuse-viewer-control"
              @click.stop="download"
              title="Download"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
          
          <!-- Caption -->
          <div v-if="caption" class="artifactuse-viewer-caption">
            {{ caption }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  // Whether the viewer is open
  isOpen: {
    type: Boolean,
    default: false,
  },
  // Content type: 'image' | 'pdf'
  type: {
    type: String,
    default: 'image',
  },
  // Source URL
  src: {
    type: String,
    default: '',
  },
  // Alt text for images
  alt: {
    type: String,
    default: '',
  },
  // Caption text
  caption: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const overlayRef = ref(null);
const isZoomed = ref(false);

function close() {
  isZoomed.value = false;
  emit('close');
}

function toggleZoom() {
  if (props.type === 'image') {
    isZoomed.value = !isZoomed.value;
  }
}

function download() {
  const link = document.createElement('a');
  link.href = props.src;
  link.download = props.alt || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Handle escape key
function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    close();
  }
}

// Focus overlay when opened
watch(() => props.isOpen, (open) => {
  if (open) {
    nextTick(() => {
      overlayRef.value?.focus();
    });
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
    isZoomed.value = false;
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<style>
.artifactuse-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
  cursor: zoom-out;
}

.artifactuse-viewer-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.artifactuse-viewer-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
  cursor: zoom-in;
  transition: transform 0.3s ease;
}

.artifactuse-viewer-image--zoomed {
  max-width: none;
  max-height: none;
  cursor: zoom-out;
  transform: scale(1.5);
}

.artifactuse-viewer-pdf {
  width: 90vw;
  height: 85vh;
  border: none;
  border-radius: 4px;
  background: white;
}

.artifactuse-viewer-close {
  position: absolute;
  top: -48px;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.artifactuse-viewer-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.artifactuse-viewer-close svg {
  width: 24px;
  height: 24px;
}

.artifactuse-viewer-controls {
  position: absolute;
  bottom: -48px;
  display: flex;
  gap: 8px;
}

.artifactuse-viewer-control {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.artifactuse-viewer-control:hover {
  background: rgba(255, 255, 255, 0.2);
}

.artifactuse-viewer-control svg {
  width: 20px;
  height: 20px;
}

.artifactuse-viewer-caption {
  margin-top: 16px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  text-align: center;
  max-width: 600px;
}

/* Transitions */
.artifactuse-viewer-enter-active,
.artifactuse-viewer-leave-active {
  transition: opacity 0.2s ease;
}

.artifactuse-viewer-enter-from,
.artifactuse-viewer-leave-to {
  opacity: 0;
}

.artifactuse-viewer-enter-active .artifactuse-viewer-content,
.artifactuse-viewer-leave-active .artifactuse-viewer-content {
  transition: transform 0.2s ease;
}

.artifactuse-viewer-enter-from .artifactuse-viewer-content,
.artifactuse-viewer-leave-to .artifactuse-viewer-content {
  transform: scale(0.95);
}
</style>
