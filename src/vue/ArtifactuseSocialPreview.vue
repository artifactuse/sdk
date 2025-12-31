<template>
  <div 
    ref="containerRef"
    class="artifactuse-social"
    :class="[`artifactuse-social-${platform}`]"
    :data-theme="theme"
  >
    <!-- Twitter/X -->
    <template v-if="platform === 'twitter'">
      <div class="artifactuse-social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="artifactuse-social-avatar"
          @error="handleAvatarError"
        />
        <div class="artifactuse-social-author">
          <div class="artifactuse-social-author-name">
            <span>{{ author.name }}</span>
            <svg v-if="author.verified" class="artifactuse-social-verified" :class="verifiedClass" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          </div>
          <div class="artifactuse-social-author-meta">
            <span class="artifactuse-social-author-handle">{{ author.handle }}</span>
            <span class="artifactuse-social-timestamp">· {{ meta.timestamp || 'Just now' }}</span>
          </div>
        </div>
      </div>
      
      <div class="artifactuse-social-content">
        <p class="artifactuse-social-text" v-html="formattedText"></p>
        
        <!-- Media -->
        <div v-if="content.media?.length" class="artifactuse-social-media">
          <div 
            class="artifactuse-social-media-grid"
            :class="{ 'artifactuse-social-media-single': content.media.length === 1 }"
            :data-count="content.media.length"
          >
            <img 
              v-for="(media, idx) in content.media.slice(0, 4)" 
              :key="idx"
              :src="media.url"
              :alt="media.alt || ''"
              @error="handleMediaError"
            />
          </div>
        </div>
        
        <!-- Link Card -->
        <div v-if="content.link && !content.media?.length" class="artifactuse-social-link-card">
          <img 
            v-if="content.link.image"
            :src="content.link.image"
            :alt="content.link.title"
            class="artifactuse-social-link-image"
            @error="handleMediaError"
          />
          <div class="artifactuse-social-link-info">
            <div class="artifactuse-social-link-domain">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
              {{ content.link.domain || getDomain(content.link.url) }}
            </div>
            <div class="artifactuse-social-link-title">{{ content.link.title }}</div>
            <div v-if="content.link.description" class="artifactuse-social-link-description">{{ content.link.description }}</div>
          </div>
        </div>
        
        <!-- Poll -->
        <div v-if="content.poll" class="artifactuse-social-poll">
          <div 
            v-for="(option, idx) in content.poll.options" 
            :key="idx"
            class="artifactuse-social-poll-option"
          >
            <div 
              class="artifactuse-social-poll-bar"
              :style="{ width: `${content.poll.votes?.[idx] || 0}%` }"
            ></div>
            <div class="artifactuse-social-poll-label">
              <span>{{ option }}</span>
              <span class="artifactuse-social-poll-label-percent">{{ content.poll.votes?.[idx] || 0 }}%</span>
            </div>
          </div>
          <div class="artifactuse-social-poll-meta">
            {{ formatNumber(content.poll.totalVotes || 0) }} votes · {{ content.poll.duration || 'Poll ended' }}
          </div>
        </div>
        
        <!-- Quote Tweet -->
        <div v-if="content.quote" class="artifactuse-social-quote">
          <div class="artifactuse-social-quote-header">
            <img 
              :src="content.quote.author?.avatar || defaultAvatar" 
              class="artifactuse-social-quote-avatar"
            />
            <span class="artifactuse-social-quote-author">{{ content.quote.author?.name }}</span>
            <span class="artifactuse-social-quote-handle">{{ content.quote.author?.handle }}</span>
          </div>
          <p class="artifactuse-social-quote-text">{{ content.quote.text }}</p>
        </div>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="artifactuse-social-engagement">
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 21C6.5 21 2 16.5 2 11V3l7 3 3-3 3 3 7-3v8c0 5.5-4.5 10-10 10z"/>
          </svg>
          <span>{{ formatNumber(engagement.replies || 0) }}</span>
        </div>
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M7 17L17 7M17 7H8M17 7V16"/>
          </svg>
          <span>{{ formatNumber(engagement.retweets || 0) }}</span>
        </div>
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>{{ formatNumber(engagement.likes || 0) }}</span>
        </div>
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
          </svg>
          <span>{{ formatNumber(engagement.views || 0) }}</span>
        </div>
      </div>
    </template>
    
    <!-- LinkedIn -->
    <template v-else-if="platform === 'linkedin'">
      <div class="artifactuse-social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="artifactuse-social-avatar"
          @error="handleAvatarError"
        />
        <div class="artifactuse-social-author-info">
          <div class="artifactuse-social-author-name">
            {{ author.name }}
            <span v-if="author.connection" class="artifactuse-social-author-connection">· {{ author.connection }}</span>
          </div>
          <div class="artifactuse-social-author-headline">{{ author.headline }}</div>
          <div class="artifactuse-social-timestamp">
            {{ meta.timestamp || 'Just now' }} · 
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="artifactuse-social-content">
        <p class="artifactuse-social-text" v-html="formattedText"></p>
        
        <!-- Link Card -->
        <div v-if="content.link" class="artifactuse-social-link-card">
          <img 
            v-if="content.link.image"
            :src="content.link.image"
            :alt="content.link.title"
            class="artifactuse-social-link-image"
            @error="handleMediaError"
          />
          <div class="artifactuse-social-link-info">
            <div class="artifactuse-social-link-title">{{ content.link.title }}</div>
            <div class="artifactuse-social-link-domain">{{ content.link.domain || getDomain(content.link.url) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="artifactuse-social-engagement">
        <div class="artifactuse-social-reactions">
          <div class="artifactuse-social-reaction-icons">
            <span class="artifactuse-social-reaction-icon">👍</span>
            <span class="artifactuse-social-reaction-icon">❤️</span>
            <span class="artifactuse-social-reaction-icon">👏</span>
          </div>
          <span>{{ formatNumber(engagement.likes || 0) }}</span>
        </div>
        <span>{{ formatNumber(engagement.comments || 0) }} comments · {{ formatNumber(engagement.shares || 0) }} shares</span>
      </div>
    </template>
    
    <!-- Instagram -->
    <template v-else-if="platform === 'instagram'">
      <div class="artifactuse-social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="artifactuse-social-avatar"
          @error="handleAvatarError"
        />
        <div class="artifactuse-social-author-name">
          {{ author.name }}
          <svg v-if="author.verified" class="artifactuse-social-verified" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
          </svg>
        </div>
      </div>
      
      <div v-if="content.media?.length" class="artifactuse-social-media">
        <img :src="content.media[0].url" :alt="content.media[0].alt || ''" @error="handleMediaError" />
      </div>
      
      <div class="artifactuse-social-actions">
        <div class="artifactuse-social-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <div class="artifactuse-social-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
        </div>
        <div class="artifactuse-social-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </div>
      </div>
      
      <div class="artifactuse-social-likes">{{ formatNumber(engagement.likes || 0) }} likes</div>
      
      <div class="artifactuse-social-caption">
        <span class="artifactuse-social-caption-author">{{ author.name }}</span>
        <span class="artifactuse-social-caption-text" v-html="formattedText"></span>
      </div>
      
      <div class="artifactuse-social-timestamp">{{ meta.timestamp || 'Just now' }}</div>
    </template>
    
    <!-- Facebook -->
    <template v-else-if="platform === 'facebook'">
      <div class="artifactuse-social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="artifactuse-social-avatar"
          @error="handleAvatarError"
        />
        <div class="artifactuse-social-author-info">
          <div class="artifactuse-social-author-name">{{ author.name }}</div>
          <div class="artifactuse-social-timestamp">
            {{ meta.timestamp || 'Just now' }} · 
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="artifactuse-social-content">
        <p class="artifactuse-social-text" v-html="formattedText"></p>
        
        <!-- Link Card -->
        <div v-if="content.link" class="artifactuse-social-link-card">
          <img 
            v-if="content.link.image"
            :src="content.link.image"
            :alt="content.link.title"
            class="artifactuse-social-link-image"
            @error="handleMediaError"
          />
          <div class="artifactuse-social-link-info">
            <div class="artifactuse-social-link-domain">{{ content.link.domain || getDomain(content.link.url) }}</div>
            <div class="artifactuse-social-link-title">{{ content.link.title }}</div>
            <div v-if="content.link.description" class="artifactuse-social-link-description">{{ content.link.description }}</div>
          </div>
        </div>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="artifactuse-social-engagement">
        <div class="artifactuse-social-reactions">
          <div class="artifactuse-social-reaction-emojis">
            <span class="artifactuse-social-reaction-emoji">👍</span>
            <span class="artifactuse-social-reaction-emoji">❤️</span>
            <span class="artifactuse-social-reaction-emoji">😂</span>
          </div>
          <span class="artifactuse-social-reaction-count">{{ formatNumber(totalReactions) }}</span>
        </div>
        <span class="artifactuse-social-comments-shares">{{ formatNumber(engagement.comments || 0) }} comments · {{ formatNumber(engagement.shares || 0) }} shares</span>
      </div>
    </template>
    
    <!-- Threads -->
    <template v-else-if="platform === 'threads'">
      <div class="artifactuse-social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="artifactuse-social-avatar"
          @error="handleAvatarError"
        />
        <div class="artifactuse-social-author-info">
          <div class="artifactuse-social-author-name">
            {{ author.name }}
            <svg v-if="author.verified" class="artifactuse-social-verified" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          </div>
          <span class="artifactuse-social-timestamp">{{ meta.timestamp || 'Just now' }}</span>
        </div>
      </div>
      
      <div class="artifactuse-social-content">
        <p class="artifactuse-social-text" v-html="formattedText"></p>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="artifactuse-social-engagement">
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>{{ formatNumber(engagement.likes || 0) }}</span>
        </div>
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
          <span>{{ formatNumber(engagement.comments || 0) }}</span>
        </div>
        <div class="artifactuse-social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M7 17L17 7M17 7H8M17 7V16"/>
          </svg>
          <span>{{ formatNumber(engagement.shares || 0) }}</span>
        </div>
      </div>
    </template>
    
    <!-- TikTok -->
    <template v-else-if="platform === 'tiktok'">
      <div class="artifactuse-social-thumbnail">
        <img v-if="content.thumbnail" :src="content.thumbnail" :alt="content.text" @error="handleMediaError" />
        <div class="artifactuse-social-play-button">
          <div class="artifactuse-social-play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div v-if="content.duration" class="artifactuse-social-duration">{{ content.duration }}</div>
      </div>
      
      <div class="artifactuse-social-info">
        <div class="artifactuse-social-header">
          <img 
            :src="author.avatar || defaultAvatar" 
            :alt="author.name"
            class="artifactuse-social-avatar"
            @error="handleAvatarError"
          />
          <span class="artifactuse-social-author-name">{{ author.name }}</span>
        </div>
        
        <p class="artifactuse-social-text" v-html="formattedText"></p>
        
        <div v-if="content.sound" class="artifactuse-social-sound">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          {{ content.sound }}
        </div>
        
        <div v-if="showEngagement" class="artifactuse-social-engagement">
          <span>{{ formatNumber(engagement.likes || 0) }} likes</span>
          <span>{{ formatNumber(engagement.comments || 0) }} comments</span>
          <span>{{ formatNumber(engagement.shares || 0) }} shares</span>
        </div>
      </div>
    </template>
    
    <!-- YouTube -->
    <template v-else-if="platform === 'youtube'">
      <div class="artifactuse-social-thumbnail">
        <img v-if="content.thumbnail" :src="content.thumbnail" :alt="content.title" @error="handleMediaError" />
        <div v-if="content.duration" class="artifactuse-social-duration">{{ content.duration }}</div>
      </div>
      
      <div class="artifactuse-social-info">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="artifactuse-social-avatar"
          @error="handleAvatarError"
        />
        <div>
          <div class="artifactuse-social-title">{{ content.title || content.text }}</div>
          <div class="artifactuse-social-channel">{{ author.name }}</div>
          <div class="artifactuse-social-meta">{{ formatNumber(engagement.views || 0) }} views · {{ meta.timestamp || 'Just now' }}</div>
        </div>
      </div>
    </template>
    
    <!-- Actions Bar -->
    <div class="artifactuse-social-actions-bar">
      <div class="artifactuse-social-platform-badge">
        <component :is="platformIcon" />
        <span>{{ platformName }}</span>
      </div>
      <button class="artifactuse-social-copy-btn" @click="copyText">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        {{ copyLabel }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue';

const props = defineProps({
  artifact: {
    type: Object,
    required: true
  },
  theme: {
    type: String,
    default: 'dark'
  }
});

const emit = defineEmits(['copy', 'edit']);

const containerRef = ref(null);
const copyLabel = ref('Copy');

/**
 * Parse social data from artifact.code JSON
 */
const social = computed(() => {
  try {
    return JSON.parse(props.artifact.code);
  } catch {
    return { platform: 'twitter', data: {} };
  }
});

// Default avatar
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';

// Computed
const platform = computed(() => social.value?.platform || 'twitter');
const variant = computed(() => social.value?.variant || 'post');
const author = computed(() => social.value?.data?.author || {});
const content = computed(() => social.value?.data?.content || {});
const engagement = computed(() => social.value?.data?.engagement || {});
const meta = computed(() => social.value?.data?.meta || {});

const showEngagement = computed(() => {
  const e = engagement.value;
  return e.likes || e.comments || e.shares || e.retweets || e.replies || e.views;
});

const verifiedClass = computed(() => {
  const type = author.value.verifiedType || 'blue';
  return `artifactuse-social-verified-${type}`;
});

const platformName = computed(() => {
  const names = {
    twitter: 'X',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    facebook: 'Facebook',
    threads: 'Threads',
    tiktok: 'TikTok',
    youtube: 'YouTube'
  };
  return names[platform.value] || platform.value;
});

const platformIcon = computed(() => {
  const icons = {
    twitter: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' })
    ]),
    linkedin: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' })
    ]),
    instagram: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' })
    ]),
    facebook: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' })
    ]),
    threads: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.108-1.152 3.457-1.187 1.357-.035 2.573.283 3.58.89.034-.497.04-1.017.015-1.558-.083-1.792-.648-3.095-1.68-3.876-.99-.75-2.453-1.123-4.35-1.108-.987.008-1.866.09-2.613.246l-.464-2.086c.912-.19 1.965-.29 3.133-.298 2.467-.02 4.42.554 5.807 1.706 1.46 1.213 2.24 3.007 2.354 5.411.039.827.026 1.69-.04 2.576.962.681 1.735 1.542 2.268 2.553.846 1.6 1.026 3.639.508 5.622-.57 2.181-1.782 3.94-3.503 5.079C17.194 23.394 14.88 24 12.186 24zM9.15 13.476c-.927.037-1.628.282-2.085.728-.418.408-.618.945-.578 1.553.04.638.347 1.165.866 1.483.586.36 1.39.521 2.266.45 1.053-.085 1.86-.473 2.4-1.153.457-.576.763-1.39.884-2.356-.893-.41-1.944-.636-3.095-.705h-.009c-.216-.008-.436-.008-.65 0z' })
    ]),
    tiktok: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' })
    ]),
    youtube: () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor' }, [
      h('path', { d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' })
    ])
  };
  return icons[platform.value] || icons.twitter;
});

// Format text with hashtags and mentions
const formattedText = computed(() => {
  let text = content.value.text || '';
  
  // Escape HTML
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Hashtags
  text = text.replace(/#(\w+)/g, '<span class="artifactuse-social-hashtag">#$1</span>');
  
  // Mentions
  text = text.replace(/@(\w+)/g, '<span class="artifactuse-social-mention">@$1</span>');
  
  // URLs
  text = text.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );
  
  return text;
});

// Total reactions for Facebook
const totalReactions = computed(() => {
  const reactions = engagement.value.reactions || {};
  return Object.values(reactions).reduce((sum, val) => sum + (val || 0), 0) || engagement.value.likes || 0;
});

// Methods
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function handleAvatarError(e) {
  e.target.src = defaultAvatar;
}

function handleMediaError(e) {
  e.target.style.display = 'none';
}

function copyText() {
  const text = content.value.text || '';
  navigator.clipboard.writeText(text).then(() => {
    copyLabel.value = 'Copied!';
    setTimeout(() => {
      copyLabel.value = 'Copy';
    }, 2000);
    emit('copy', { platform: platform.value, text });
  });
}
</script>