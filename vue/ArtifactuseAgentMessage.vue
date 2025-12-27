<template>
  <div class="artifactuse-agent-message">
    <!-- Rendered message content with inline artifacts -->
    <div class="artifactuse-message-content" ref="contentRef">
      <!-- Render content with artifact placeholders replaced -->
      <template v-for="(segment, index) in contentSegments" :key="index">
        <!-- Regular HTML content -->
        <div v-if="segment.type === 'html'" v-html="segment.content"></div>
        
        <!-- Inline Form -->
        <ArtifactuseInlineForm
          v-else-if="segment.type === 'form' && segment.artifact.isInline"
          :form="segment.artifact"
          :theme="theme"
          @submit="handleFormSubmit"
          @cancel="handleFormCancel"
        />
        
        <!-- Inline Social Preview -->
        <ArtifactuseSocialPreview
          v-else-if="segment.type === 'social'"
          :social="segment.artifact"
          :theme="theme"
          @copy="handleSocialCopy"
        />
        
        <!-- Panel artifact card (code, non-inline forms) -->
        <ArtifactuseCard
          v-else-if="segment.type === 'panel'"
          :artifact="segment.artifact"
          @open="handleOpenArtifact"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useArtifactuse } from './index.js';
import ArtifactuseCard from './ArtifactuseCard.vue';
import ArtifactuseInlineForm from './ArtifactuseInlineForm.vue';
import ArtifactuseSocialPreview from './ArtifactuseSocialPreview.vue';

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
});

const emit = defineEmits([
  'artifact-detected', 
  'artifact-open',
  'form-submit',
  'form-cancel',
  'social-copy'
]);

const { processMessage, openArtifact, state, getTheme, on } = useArtifactuse();

const contentRef = ref(null);
const processedHtml = ref('');
const messageArtifacts = ref([]);

// Get current theme
const theme = computed(() => getTheme?.() || 'dark');

// Parse HTML and extract segments (HTML + artifact placeholders)
const contentSegments = computed(() => {
  const segments = [];
  const html = processedHtml.value;
  
  if (!html) return segments;
  
  // Find all artifact placeholders
  const placeholderRegex = /<div class="artifactuse-placeholder[^"]*"[^>]*data-artifact-id="([^"]+)"[^>]*data-artifact-type="([^"]+)"[^>]*data-artifact='([^']*)'[^>]*><\/div>/g;
  
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
    
    // Parse artifact data
    try {
      const artifactData = JSON.parse(match[3].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
      const artifactType = match[2];
      
      if (artifactType === 'form' && artifactData.isInline) {
        segments.push({ type: 'form', artifact: artifactData });
      } else if (artifactType === 'social') {
        segments.push({ type: 'social', artifact: artifactData });
      } else {
        // Panel artifact (code, non-inline form)
        segments.push({ type: 'panel', artifact: artifactData });
      }
    } catch (e) {
      console.error('Failed to parse artifact data:', e);
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
    }
  },
  { immediate: true }
);

function handleOpenArtifact(artifact) {
  openArtifact(artifact);
  emit('artifact-open', artifact);
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
</script>

<style>
.artifactuse-agent-message {
  width: 100%;
}

.artifactuse-message-content {
  line-height: 1.6;
}

/* Inline artifacts spacing */
.artifactuse-message-content > .artifactuse-social,
.artifactuse-message-content > .artifactuse-inline-form {
  margin: 1em 0;
}

/* Basic typography */
.artifactuse-message-content p {
  margin: 0 0 1em 0;
}

.artifactuse-message-content p:last-child {
  margin-bottom: 0;
}

.artifactuse-message-content h1,
.artifactuse-message-content h2,
.artifactuse-message-content h3,
.artifactuse-message-content h4,
.artifactuse-message-content h5,
.artifactuse-message-content h6 {
  margin: 1.5em 0 0.5em 0;
  font-weight: 600;
  line-height: 1.3;
}

.artifactuse-message-content h1:first-child,
.artifactuse-message-content h2:first-child,
.artifactuse-message-content h3:first-child {
  margin-top: 0;
}

.artifactuse-message-content ul,
.artifactuse-message-content ol {
  margin: 0 0 1em 0;
  padding-left: 1.5em;
}

.artifactuse-message-content li {
  margin: 0.25em 0;
}

.artifactuse-message-content code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 0.9em;
  padding: 0.15em 0.4em;
  background: rgba(var(--artifactuse-surface), 0.5);
  border-radius: 4px;
}

.artifactuse-message-content pre {
  margin: 1em 0;
  padding: 1em;
  background: rgb(var(--artifactuse-surface));
  border-radius: 8px;
  overflow-x: auto;
}

.artifactuse-message-content pre code {
  padding: 0;
  background: none;
}

.artifactuse-message-content a {
  color: rgb(var(--artifactuse-primary));
  text-decoration: none;
}

.artifactuse-message-content a:hover {
  text-decoration: underline;
}

.artifactuse-message-content blockquote {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid rgb(var(--artifactuse-border));
  background: rgba(var(--artifactuse-surface), 0.3);
}

.artifactuse-message-content hr {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid rgb(var(--artifactuse-border));
}

.artifactuse-message-content table {
  width: 100%;
  margin: 1em 0;
  border-collapse: collapse;
}

.artifactuse-message-content th,
.artifactuse-message-content td {
  padding: 0.5em 0.75em;
  border: 1px solid rgb(var(--artifactuse-border));
  text-align: left;
}

.artifactuse-message-content th {
  background: rgba(var(--artifactuse-surface), 0.5);
  font-weight: 600;
}

.artifactuse-message-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>
