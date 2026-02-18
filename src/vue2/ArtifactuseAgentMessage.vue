<template>
  <div class="artifactuse-agent-message" ref="messageRef">
    <div class="artifactuse-message-content" ref="contentRef" @click="handleContentClick">
      <template v-for="(segment, index) in contentSegments">
        <!-- Regular HTML content -->
        <div v-if="segment.type === 'html'" :key="'html-' + index" v-html="segment.content"></div>
        
        <!-- Inline Form -->
        <ArtifactuseInlineForm
          v-else-if="segment.type === 'form' && segment.artifact.isInline"
          :key="'form-' + index"
          :artifact="segment.artifact"
          :theme="theme"
          :initial-state="formInitialState"
          @submit="handleFormSubmit"
          @cancel="handleFormCancel"
          @button-click="handleFormButtonClick"
        />
        
        <!-- Inline Social Preview -->
        <ArtifactuseSocialPreview
          v-else-if="segment.type === 'social'"
          :key="'social-' + index"
          :artifact="segment.artifact"
          :theme="theme"
          @copy="handleSocialCopy"
        />
        
        <!-- Panel artifact card (code, non-inline forms) -->
        <ArtifactuseCard
          v-else-if="segment.type === 'panel' && effectiveInlineCards"
          :key="'panel-' + index"
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

<script>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useArtifactuse } from './composables.js';
import ArtifactuseCard from './ArtifactuseCard.vue';
import ArtifactuseInlineForm from './ArtifactuseInlineForm.vue';
import ArtifactuseSocialPreview from './ArtifactuseSocialPreview.vue';
import ArtifactuseViewer from './ArtifactuseViewer.vue';

export default {
  name: 'ArtifactuseAgentMessage',
  
  components: {
    ArtifactuseCard,
    ArtifactuseInlineForm,
    ArtifactuseSocialPreview,
    ArtifactuseViewer,
  },
  
  props: {
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
    // Whether this is the last/most recent message in the conversation
    // Used to keep forms active after page reload for the latest message
    isLastMessage: {
      type: Boolean,
      default: false,
    },
    // Override global inlinePreview config for this message
    inlinePreview: {
      type: Object,
      default: null,
    },
    // Show full inline code (no extraction) for listed languages
    inlineCode: {
      type: Object,
      default: null,
    },
    // Override visible panel tabs for artifacts from this message
    tabs: {
      type: Array,
      default: null,
    },
    // Override initial panel view mode for artifacts from this message
    viewMode: {
      type: String,
      default: null,
    },
  },
  
  setup(props, { emit }) {
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

    // Resolve inlineCards: component prop → global config → default (true)
    const effectiveInlineCards = computed(() => props.inlineCards ?? instance?.config?.inlineCards ?? true);

    /**
     * Track if this message was ever "live" (typed/streamed) in this session
     * Used to determine if forms should be active or inactive
     */
    const wasLiveInSession = ref(false);

    onMounted(() => {
      // If the message is currently typing when mounted, it's live
      if (props.typing) {
        wasLiveInSession.value = true;
      }
      
      if (!props.typing) {
        initializeContent();
      }
    });

    // Watch for typing to become true (message starts streaming)
    watch(() => props.typing, (isTyping) => {
      if (isTyping) {
        wasLiveInSession.value = true;
      }
    });

    /**
     * Determine the initial state for inline forms
     * - 'active' if this message was typed/streamed in current session
     * - 'active' if this is the last message (allows interaction after page reload)
     * - 'inactive' if this message was loaded from history (page refresh)
     */
    const formInitialState = computed(() => {
      if (wasLiveInSession.value) return 'active';
      if (props.isLastMessage) return 'active';
      return 'inactive';
    });

    /**
     * Decode Base64 string to JSON object
     */
    function decodeArtifactData(encoded) {
      if (!encoded) return null;
      
      try {
        const json = decodeURIComponent(escape(atob(encoded)));
        return JSON.parse(json);
      } catch (e) {
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

    // Parse HTML and extract segments
    const contentSegments = computed(() => {
      const segments = [];
      const html = processedHtml.value;
      
      if (!html) return segments;
      
      const placeholderRegex = /<div\s+class="artifactuse-placeholder[^"]*"[^>]*data-artifact-id="([^"]+)"[^>]*data-artifact-type="([^"]+)"[^>]*data-artifact=["']([^"']*)["'][^>]*><\/div>/gi;
      
      let lastIndex = 0;
      let match;
      
      while ((match = placeholderRegex.exec(html)) !== null) {
        if (match.index > lastIndex) {
          const htmlContent = html.slice(lastIndex, match.index);
          if (htmlContent.trim()) {
            segments.push({ type: 'html', content: htmlContent });
          }
        }
        
        const artifactData = decodeArtifactData(match[3]);
        const artifactType = match[2];
        
        if (artifactData) {
          if (artifactType === 'form' && artifactData.isInline) {
            segments.push({ type: 'form', artifact: artifactData });
          } else if (artifactType === 'social') {
            segments.push({ type: 'social', artifact: artifactData });
          } else {
            segments.push({ type: 'panel', artifact: artifactData });
          }
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < html.length) {
        const htmlContent = html.slice(lastIndex);
        if (htmlContent.trim()) {
          segments.push({ type: 'html', content: htmlContent });
        }
      }
      
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
      
      // Images in containers
      const imageContainers = contentRef.value.querySelectorAll('.artifactuse-image-container img');
      imageContainers.forEach(img => {
        if (img._lightboxHandler) return;
        
        img._lightboxHandler = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
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
      
      // PDF embeds
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
      
      // Video previews
      const videoPreviews = contentRef.value.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
      videoPreviews.forEach(preview => {
        if (preview._clickHandler) {
          preview.removeEventListener('click', preview._clickHandler);
        }
        
        preview._clickHandler = (e) => {
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
     * Remove media listeners
     */
    function removeMediaListeners() {
      if (!contentRef.value) return;
      
      const images = contentRef.value.querySelectorAll('img');
      images.forEach(img => {
        if (img._lightboxHandler) {
          img.removeEventListener('click', img._lightboxHandler);
          delete img._lightboxHandler;
        }
      });
      
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
      
      const videoPreviews = contentRef.value.querySelectorAll('.artifactuse-video-preview-wrapper, .video-preview-wrapper');
      videoPreviews.forEach(preview => {
        if (preview._clickHandler) {
          preview.removeEventListener('click', preview._clickHandler);
          delete preview._clickHandler;
        }
      });
    }

    /**
     * Initialize interactive content
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
        
        attachMediaListeners();
      }, 100);
    }

    // Process message when content changes
    watch(
      () => props.content,
      (newContent) => {
        if (newContent) {
          const result = processMessage(newContent, props.messageId, {
            inlinePreview: props.inlinePreview,
            inlineCode: props.inlineCode,
            tabs: props.tabs,
            viewMode: props.viewMode,
          });
          processedHtml.value = result.html;
          messageArtifacts.value = result.artifacts;
          
          if (result.artifacts.length > 0) {
            emit('artifact-detected', result.artifacts);
          }
          
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
          initializeContent();
        }
      }
    );

    onBeforeUnmount(() => {
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      removeMediaListeners();
    });

    function handleContentClick(e) {
      const preview = e.target.closest('.artifactuse-inline-preview');
      if (preview) {
        if (preview.dataset.nonClickable) return;
        const artifactId = preview.dataset.artifactId;
        if (artifactId) {
          const artifact = state.artifacts.find(a => a.id === artifactId);
          if (artifact) {
            handleOpenArtifact(artifact);
          }
        }
      }
    }

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

    function handleFormButtonClick(data) {
      emit('form-button-click', data);
    }

    function handleSocialCopy(data) {
      emit('social-copy', data);
    }

    const messageArtifactsFromState = computed(() => {
      return state.artifacts.filter(a => a.messageId === props.messageId);
    });

    return {
      messageRef,
      contentRef,
      processedHtml,
      messageArtifacts,
      viewerOpen,
      viewerType,
      viewerSrc,
      viewerAlt,
      viewerCaption,
      theme,
      activeArtifactId,
      effectiveInlineCards,
      contentSegments,
      formInitialState,
      openViewer,
      closeViewer,
      attachMediaListeners,
      handleContentClick,
      handleOpenArtifact,
      handleArtifactCopy,
      handleArtifactDownload,
      handleFormSubmit,
      handleFormCancel,
      handleFormButtonClick,
      handleSocialCopy,
      messageArtifactsFromState,
    };
  },
};
</script>