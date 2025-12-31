<template>
  <div class="artifactuse-agent-message" ref="messageRef">
    <div class="artifactuse-message-content" ref="contentRef">
      <template v-for="(segment, index) in contentSegments" :key="index">
        <!-- Regular HTML content -->
        <div v-if="segment.type === 'html'" v-html="segment.content"></div>
        
        <!-- Inline Form -->
        <ArtifactuseInlineForm
          v-else-if="segment.type === 'form' && segment.artifact.isInline"
          :artifact="segment.artifact"
          :theme="theme"
          @submit="handleFormSubmit"
          @cancel="handleFormCancel"
        />
        
        <!-- Inline Social Preview -->
        <ArtifactuseSocialPreview
          v-else-if="segment.type === 'social'"
          :artifact="segment.artifact"
          :theme="theme"
          @copy="handleSocialCopy"
        />
        
        <!-- Panel artifact card (code, non-inline forms) -->
        <ArtifactuseCard
          v-else-if="segment.type === 'panel' && inlineCards"
          :artifact="segment.artifact"
          :is-active="activeArtifactId === segment.artifact.id"
          @open="handleOpenArtifact"
          @copy="handleArtifactCopy"
          @download="handleArtifactDownload"
        />
      </template>
    </div>
    
    <!-- Media Viewer -->
    <ArtifactuseViewer
      :is-open="viewerOpen"
      :type="viewerType"
      :src="viewerSrc"
      :alt="viewerAlt"
      :caption="viewerCaption"
      @close="closeViewer"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useArtifactuse } from './index.js';
import ArtifactuseCard from './ArtifactuseCard.vue';
import ArtifactuseInlineForm from './ArtifactuseInlineForm.vue';
import ArtifactuseSocialPreview from './ArtifactuseSocialPreview.vue';
import ArtifactuseViewer from './ArtifactuseViewer.vue';

const props = defineProps({
  // The raw message content (markdown/HTML from AI)
  content: {
    type: String,
    required: true,
  },
  // Unique message ID
  messageId: {
    type: String,
    default: () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  },
  // Whether to show artifact cards inline
  inlineCards: {
    type: Boolean,
    default: true,
  },
  // Whether the message is still being typed/streamed
  typing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'artifact-detected', 
  'artifact-open',
  'artifact-copy',
  'artifact-download',
  'form-submit',
  'form-cancel',
  'social-copy',
  'media-open',
]);

const { 
  processMessage, 
  openArtifact, 
  state, 
  getTheme,
  instance 
} = useArtifactuse();

const messageRef = ref(null);
const contentRef = ref(null);
const processedHtml = ref('');
const messageArtifacts = ref([]);
let initTimeout = null;

// Viewer state
const viewerOpen = ref(false);
const viewerType = ref('image');
const viewerSrc = ref('');
const viewerAlt = ref('');
const viewerCaption = ref('');

// Get current theme
const theme = computed(() => getTheme?.() || 'dark');

// Get active artifact ID from state
const activeArtifactId = computed(() => state.activeArtifactId);

/**
 * Decode Base64 string to JSON object
 * Falls back to HTML entity decoding for legacy data
 */
function decodeArtifactData(encoded) {
  if (!encoded) return null;
  
  // Try Base64 decoding first
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (e) {
    // Fallback: try HTML entity decoding for legacy data
    try {
      const decoded = encoded
        .replace(/&#10;/g, '\n')
        .replace(/&#13;/g, '\r')
        .replace(/&#9;/g, '\t')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
      return JSON.parse(decoded);
    } catch (e2) {
      console.error('Failed to parse artifact data:', e2);
      return null;
    }
  }
}

// Parse HTML and extract segments (HTML + artifact placeholders)
const contentSegments = computed(() => {
  const segments = [];
  const html = processedHtml.value;
  
  if (!html) return segments;
  
  // Regex to match artifact placeholders with Base64 or HTML-encoded data
  const placeholderRegex = /<div\s+class="artifactuse-placeholder[^"]*"[^>]*data-artifact-id="([^"]+)"[^>]*data-artifact-type="([^"]+)"[^>]*data-artifact=["']([^"']*)["'][^>]*><\/div>/gi;
  
  let lastIndex = 0;
  let match;
  
  while ((match = placeholderRegex.exec(html)) !== null) {
    // Add HTML before this placeholder
    if (match.index > lastIndex) {
      const htmlContent = html.slice(lastIndex, match.index);
      if (htmlContent.trim()) {
        segments.push({ type: 'html', content: htmlContent });
      }
    }
    
    // Parse artifact data using Base64 decoding
    const artifactData = decodeArtifactData(match[3]);
    const artifactType = match[2];
    
    if (artifactData) {
      if (artifactType === 'form' && artifactData.isInline) {
        segments.push({ type: 'form', artifact: artifactData });
      } else if (artifactType === 'social') {
        segments.push({ type: 'social', artifact: artifactData });
      } else {
        // Panel artifact (code, non-inline form)
        segments.push({ type: 'panel', artifact: artifactData });
      }
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining HTML after last placeholder
  if (lastIndex < html.length) {
    const htmlContent = html.slice(lastIndex);
    if (htmlContent.trim()) {
      segments.push({ type: 'html', content: htmlContent });
    }
  }
  
  // If no placeholders found, return whole HTML as single segment
  if (segments.length === 0 && html.trim()) {
    segments.push({ type: 'html', content: html });
  }
  
  return segments;
});

/**
 * Open the media viewer
 */
function openViewer(data) {
  viewerType.value = data.type || 'image';
  viewerSrc.value = data.src || '';
  viewerAlt.value = data.alt || '';
  viewerCaption.value = data.caption || '';
  viewerOpen.value = true;
  
  emit('media-open', data);
}

/**
 * Close the media viewer
 */
function closeViewer() {
  viewerOpen.value = false;
  viewerSrc.value = '';
  viewerAlt.value = '';
  viewerCaption.value = '';
}

/**
 * Attach click listeners to interactive media elements
 */
function attachMediaListeners() {
  if (!contentRef.value) return;
  
  // Image lightbox listeners
  const images = contentRef.value.querySelectorAll('img[data-lightbox="true"]');
  images.forEach(img => {
    // Remove existing listener to prevent duplicates
    if (img._lightboxHandler) {
      img.removeEventListener('click', img._lightboxHandler);
    }
    
    img._lightboxHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openViewer({
        type: 'image',
        src: img.src,
        alt: img.alt || '',
        caption: img.dataset.caption || img.alt || '',
      });
    };
    
    img.addEventListener('click', img._lightboxHandler);
    img.style.cursor = 'zoom-in';
  });
  
  // Also handle images in image containers
  const imageContainers = contentRef.value.querySelectorAll('.artifactuse-image-container img');
  imageContainers.forEach(img => {
    if (img._lightboxHandler) return; // Already has handler
    
    img._lightboxHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get caption from sibling element or data attribute
      const container = img.closest('.artifactuse-image-container');
      const captionEl = container?.querySelector('.artifactuse-image-caption');
      const caption = captionEl?.textContent || img.dataset.caption || img.alt || '';
      
      openViewer({
        type: 'image',
        src: img.src,
        alt: img.alt || '',
        caption: caption,
      });
    };
    
    img.addEventListener('click', img._lightboxHandler);
    img.style.cursor = 'zoom-in';
  });
  
  // Gallery images
  const galleryImages = contentRef.value.querySelectorAll('.artifactuse-gallery-item img, .artifactuse-image-gallery img');
  galleryImages.forEach(img => {
    if (img._lightboxHandler) return;
    
    img._lightboxHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const container = img.closest('.artifactuse-gallery-item');
      const captionEl = container?.querySelector('.artifactuse-gallery-caption');
      const caption = captionEl?.textContent || img.dataset.caption || img.alt || '';
      
      openViewer({
        type: 'image',
        src: img.src,
        alt: img.alt || '',
        caption: caption,
      });
    };
    
    img.addEventListener('click', img._lightboxHandler);
    img.style.cursor = 'zoom-in';
  });
  
  // PDF links
  const pdfLinks = contentRef.value.querySelectorAll('a[href$=".pdf"], a[data-type="pdf"]');
  pdfLinks.forEach(link => {
    if (link._pdfHandler) {
      link.removeEventListener('click', link._pdfHandler);
    }
    
    link._pdfHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openViewer({
        type: 'pdf',
        src: link.href,
        alt: link.textContent || 'PDF Document',
        caption: link.title || link.textContent || '',
      });
    };
    
    link.addEventListener('click', link._pdfHandler);
  });
  
  // PDF embed containers
  const pdfEmbeds = contentRef.value.querySelectorAll('.artifactuse-pdf-container, [data-pdf-viewer]');
  pdfEmbeds.forEach(embed => {
    if (embed._pdfHandler) {
      embed.removeEventListener('click', embed._pdfHandler);
    }
    
    const pdfSrc = embed.dataset.pdfSrc || embed.querySelector('iframe')?.src || '';
    if (!pdfSrc) return;
    
    embed._pdfHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openViewer({
        type: 'pdf',
        src: pdfSrc,
        alt: 'PDF Document',
        caption: embed.dataset.caption || '',
      });
    };
    
    embed.addEventListener('click', embed._pdfHandler);
    embed.style.cursor = 'pointer';
  });
  
  // Video preview wrappers (open in new tab)
  const videoPreviews = contentRef.value.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
  videoPreviews.forEach(preview => {
    if (preview._clickHandler) {
      preview.removeEventListener('click', preview._clickHandler);
    }
    
    preview._clickHandler = (e) => {
      // Don't intercept if clicking on the play button overlay
      if (e.target.closest('.artifactuse-video-play-button')) return;
      
      const videoUrl = preview.dataset.videoUrl || preview.dataset.url;
      if (videoUrl) {
        window.open(videoUrl, '_blank', 'noopener,noreferrer');
      }
    };
    
    preview.addEventListener('click', preview._clickHandler);
  });
}

/**
 * Remove media listeners (cleanup)
 */
function removeMediaListeners() {
  if (!contentRef.value) return;
  
  // Remove image listeners
  const images = contentRef.value.querySelectorAll('img');
  images.forEach(img => {
    if (img._lightboxHandler) {
      img.removeEventListener('click', img._lightboxHandler);
      delete img._lightboxHandler;
    }
  });
  
  // Remove PDF listeners
  const pdfLinks = contentRef.value.querySelectorAll('a[href$=".pdf"], a[data-type="pdf"]');
  pdfLinks.forEach(link => {
    if (link._pdfHandler) {
      link.removeEventListener('click', link._pdfHandler);
      delete link._pdfHandler;
    }
  });
  
  const pdfEmbeds = contentRef.value.querySelectorAll('.artifactuse-pdf-container, [data-pdf-viewer]');
  pdfEmbeds.forEach(embed => {
    if (embed._pdfHandler) {
      embed.removeEventListener('click', embed._pdfHandler);
      delete embed._pdfHandler;
    }
  });
  
  // Remove video listeners
  const videoPreviews = contentRef.value.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
  videoPreviews.forEach(preview => {
    if (preview._clickHandler) {
      preview.removeEventListener('click', preview._clickHandler);
      delete preview._clickHandler;
    }
  });
}

/**
 * Initialize interactive content (math, mermaid, tables, syntax highlighting)
 * Debounced to prevent multiple rapid calls during streaming
 */
function initializeContent() {
  if (initTimeout) {
    clearTimeout(initTimeout);
  }
  
  initTimeout = setTimeout(async () => {
    await nextTick();
    
    if (instance?.initializeContent && contentRef.value) {
      try {
        await instance.initializeContent(contentRef.value);
      } catch (error) {
        console.error('Failed to initialize content:', error);
      }
    }
    
    // Attach media listeners after content is initialized
    attachMediaListeners();
  }, 100);
}

// Process message when content changes
watch(
  () => props.content,
  (newContent) => {
    if (newContent) {
      const result = processMessage(newContent, props.messageId);
      processedHtml.value = result.html;
      messageArtifacts.value = result.artifacts;
      
      // Emit detected artifacts
      if (result.artifacts.length > 0) {
        emit('artifact-detected', result.artifacts);
      }
      
      // Initialize content after render (debounced)
      // Skip during typing for better performance
      if (!props.typing) {
        initializeContent();
      }
    }
  },
  { immediate: true }
);

// When typing stops, initialize content
watch(
  () => props.typing,
  (newTyping, oldTyping) => {
    if (oldTyping === true && newTyping === false) {
      // Typing just finished - initialize content
      initializeContent();
    }
  }
);

// Initialize on mount
onMounted(() => {
  if (!props.typing) {
    initializeContent();
  }
});

// Cleanup
onBeforeUnmount(() => {
  if (initTimeout) {
    clearTimeout(initTimeout);
  }
  removeMediaListeners();
});

function handleOpenArtifact(artifact) {
  openArtifact(artifact);
  emit('artifact-open', artifact);
}

function handleArtifactCopy(artifact) {
  emit('artifact-copy', artifact);
}

function handleArtifactDownload(artifact) {
  emit('artifact-download', artifact);
}

function handleFormSubmit(data) {
  emit('form-submit', data);
}

function handleFormCancel(data) {
  emit('form-cancel', data);
}

function handleSocialCopy(data) {
  emit('social-copy', data);
}

// Get artifacts for this specific message
const messageArtifactsFromState = computed(() => {
  return state.artifacts.filter(a => a.messageId === props.messageId);
});

// Expose methods for parent components
defineExpose({
  openViewer,
  closeViewer,
  attachMediaListeners,
});
</script>