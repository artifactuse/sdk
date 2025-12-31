<template>
  <div 
    class="artifactuse-card"
    :class="{ 'artifactuse-card--active': isActive }"
    @click="handleClick"
  >
    <div class="artifactuse-card__icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" v-html="iconPath"></svg>
    </div>
    
    <div class="artifactuse-card__content">
      <div class="artifactuse-card__title">{{ artifact.title }}</div>
      <div class="artifactuse-card__meta">
        <span class="artifactuse-card__type">{{ displayType }}</span>
        <span class="artifactuse-card__separator">•</span>
        <span class="artifactuse-card__size">{{ formattedSize }}</span>
      </div>
    </div>
    
    <div class="artifactuse-card__actions">
      <button 
        class="artifactuse-card__action"
        @click.stop="handleCopy"
        :title="copied ? 'Copied!' : 'Copy code'"
      >
        <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
      
      <button 
        class="artifactuse-card__action"
        @click.stop="handleDownload"
        title="Download file"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
    </div>
    
    <div class="artifactuse-card__arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes } from '../core/detector.js';

const props = defineProps({
  artifact: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['open', 'copy', 'download']);

const copied = ref(false);

const displayType = computed(() => {
  return getLanguageDisplayName(props.artifact.language);
});

const formattedSize = computed(() => {
  return formatBytes(props.artifact.size || props.artifact.code?.length || 0);
});

const iconPath = computed(() => {
  return getLanguageIcon(props.artifact.language);
});

function handleClick(e) {
  e.stopPropagation();
  emit('open', props.artifact);
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.artifact.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
    emit('copy', props.artifact);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

function handleDownload() {
  const blob = new Blob([props.artifact.code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const extension = getFileExtension(props.artifact.language);
  const filename = props.artifact.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'code';
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  emit('download', props.artifact);
}
</script>