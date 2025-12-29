<template>
  <div 
    class="artifactuse-card"
    :class="{ 
      'artifactuse-card--previewable': artifact.isPreviewable,
      'artifactuse-card--active': isActive 
    }"
    @click="handleClick"
  >
    <!-- Card header -->
    <div class="artifactuse-card-header">
      <!-- Language icon -->
      <div class="artifactuse-card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </div>
      
      <!-- Title and language -->
      <div class="artifactuse-card-info">
        <span class="artifactuse-card-title">{{ artifact.title }}</span>
        <span class="artifactuse-card-language">{{ languageDisplay }}</span>
      </div>
      
      <!-- Actions -->
      <div class="artifactuse-card-actions">
        <button 
          v-if="artifact.isPreviewable"
          class="artifactuse-card-action"
          title="Open in panel"
          @click.stop="handleOpen"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>
        
        <button 
          class="artifactuse-card-action"
          title="Copy code"
          @click.stop="handleCopy"
        >
          <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Code preview -->
    <div class="artifactuse-card-preview" v-if="showPreview">
      <pre><code>{{ codePreview }}</code></pre>
    </div>
    
    <!-- Footer with stats -->
    <div class="artifactuse-card-footer">
      <span class="artifactuse-card-stat">{{ artifact.lineCount }} lines</span>
      <span class="artifactuse-card-stat">{{ formatSize(artifact.size) }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, defineComponent } from 'vue';
import { getLanguageDisplayName } from '../core/detector.js';

export default defineComponent({
  name: 'ArtifactuseCard',
  
  props: {
    artifact: {
      type: Object,
      required: true,
    },
    showPreview: {
      type: Boolean,
      default: true,
    },
    previewLines: {
      type: Number,
      default: 4,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  
  setup(props, { emit }) {
    const copied = ref(false);
    
    const languageDisplay = computed(() => {
      return getLanguageDisplayName(props.artifact.language);
    });
    
    const codePreview = computed(() => {
      const lines = props.artifact.code.split('\n');
      const previewLines = lines.slice(0, props.previewLines);
      
      if (lines.length > props.previewLines) {
        return previewLines.join('\n') + '\n...';
      }
      
      return previewLines.join('\n');
    });
    
    function handleClick() {
      if (props.artifact.isPreviewable) {
        handleOpen();
      }
    }
    
    function handleOpen() {
      emit('open', props.artifact);
    }
    
    async function handleCopy() {
      try {
        await navigator.clipboard.writeText(props.artifact.code);
        copied.value = true;
        emit('copy', props.artifact);
        
        setTimeout(() => {
          copied.value = false;
        }, 2000);
      } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = props.artifact.code;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          copied.value = true;
          emit('copy', props.artifact);
          setTimeout(() => {
            copied.value = false;
          }, 2000);
        } catch (e) {
          console.error('Failed to copy:', e);
        }
        document.body.removeChild(textarea);
      }
    }
    
    function formatSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    
    return {
      copied,
      languageDisplay,
      codePreview,
      handleClick,
      handleOpen,
      handleCopy,
      formatSize,
    };
  },
});
</script>

<style>
.artifactuse-card {
  background: rgb(var(--artifactuse-surface));
  border: 1px solid rgb(var(--artifactuse-border));
  border-radius: 12px;
  overflow: hidden;
  margin: 1em 0;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.artifactuse-card--previewable {
  cursor: pointer;
}

.artifactuse-card--previewable:hover {
  border-color: rgb(var(--artifactuse-primary));
  box-shadow: 0 0 0 1px rgb(var(--artifactuse-primary));
}

.artifactuse-card--active {
  border-color: rgb(var(--artifactuse-primary));
  box-shadow: 0 0 0 2px rgba(var(--artifactuse-primary), 0.3);
}

.artifactuse-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgb(var(--artifactuse-border-light));
}

.artifactuse-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(var(--artifactuse-primary), 0.1);
  border-radius: 8px;
  color: rgb(var(--artifactuse-primary));
}

.artifactuse-card-icon svg {
  width: 18px;
  height: 18px;
}

.artifactuse-card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.artifactuse-card-title {
  font-weight: 600;
  font-size: 14px;
  color: rgb(var(--artifactuse-text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artifactuse-card-language {
  font-size: 12px;
  color: rgb(var(--artifactuse-text-secondary));
}

.artifactuse-card-actions {
  display: flex;
  gap: 4px;
}

.artifactuse-card-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgb(var(--artifactuse-text-secondary));
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.artifactuse-card-action:hover {
  background: rgba(var(--artifactuse-text), 0.1);
  color: rgb(var(--artifactuse-text));
}

.artifactuse-card-action svg {
  width: 16px;
  height: 16px;
}

.artifactuse-card-preview {
  padding: 12px 16px;
  background: rgba(var(--artifactuse-background), 0.5);
  overflow: hidden;
}

.artifactuse-card-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: rgb(var(--artifactuse-text-secondary));
  white-space: pre-wrap;
  word-break: break-word;
}

.artifactuse-card-preview code {
  background: none;
  padding: 0;
}

.artifactuse-card-footer {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid rgb(var(--artifactuse-border-light));
}

.artifactuse-card-stat {
  font-size: 11px;
  color: rgb(var(--artifactuse-text-muted));
}
</style>
