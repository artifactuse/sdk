<template>
  <div 
    ref="containerRef"
    class="artifactuse-social"
    :class="[`social-${platform}`]"
    :data-theme="theme"
  >
    <!-- Twitter/X -->
    <template v-if="platform === 'twitter'">
      <div class="social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="social-author">
          <div class="social-author-name">
            <span>{{ author.name }}</span>
            <svg v-if="author.verified" class="social-verified" :class="verifiedClass" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          </div>
          <div class="flex items-center gap-1">
            <span class="social-author-handle">{{ author.handle }}</span>
            <span class="social-timestamp">· {{ meta.timestamp || 'Just now' }}</span>
          </div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
        
        <!-- Media -->
        <div v-if="content.media?.length" class="social-media">
          <div 
            class="social-media-grid"
            :class="{ 'social-media-single': content.media.length === 1 }"
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
        <div v-if="content.link && !content.media?.length" class="social-link-card">
          <img 
            v-if="content.link.image"
            :src="content.link.image"
            :alt="content.link.title"
            class="social-link-image"
            @error="handleMediaError"
          />
          <div class="social-link-info">
            <div class="social-link-domain">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
              {{ content.link.domain || getDomain(content.link.url) }}
            </div>
            <div class="social-link-title">{{ content.link.title }}</div>
            <div v-if="content.link.description" class="social-link-description">{{ content.link.description }}</div>
          </div>
        </div>
        
        <!-- Poll -->
        <div v-if="content.poll" class="social-poll">
          <div 
            v-for="(option, idx) in content.poll.options" 
            :key="idx"
            class="social-poll-option"
          >
            <div 
              class="social-poll-bar"
              :style="{ width: `${content.poll.votes?.[idx] || 0}%` }"
            ></div>
            <div class="social-poll-label">
              <span>{{ option }}</span>
              <span class="font-medium">{{ content.poll.votes?.[idx] || 0 }}%</span>
            </div>
          </div>
          <div class="social-poll-meta">
            {{ formatNumber(content.poll.totalVotes || 0) }} votes · {{ content.poll.duration || 'Poll ended' }}
          </div>
        </div>
        
        <!-- Quote Tweet -->
        <div v-if="content.quote" class="social-quote">
          <div class="social-quote-header">
            <img 
              :src="content.quote.author?.avatar || defaultAvatar" 
              class="social-quote-avatar"
            />
            <span class="social-quote-author">{{ content.quote.author?.name }}</span>
            <span class="social-quote-handle">{{ content.quote.author?.handle }}</span>
          </div>
          <p class="social-quote-text">{{ content.quote.text }}</p>
        </div>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="social-engagement">
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M8 12h8 M12 8v8"/>
          </svg>
          <span>{{ formatNumber(engagement.replies || 0) }}</span>
        </div>
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="m17 2-5 5-5-5M17 22l-5-5-5 5M7 7l5 5 5-5M7 17l5-5 5 5"/>
          </svg>
          <span>{{ formatNumber(engagement.retweets || 0) }}</span>
        </div>
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 21C12 21 4 14 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 14 16 21 16 21"/>
          </svg>
          <span>{{ formatNumber(engagement.likes || 0) }}</span>
        </div>
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13"/>
          </svg>
          <span>{{ formatNumber(engagement.views || 0) }}</span>
        </div>
      </div>
    </template>
    
    <!-- LinkedIn -->
    <template v-else-if="platform === 'linkedin'">
      <div class="social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="flex-1">
          <div class="social-author-name">
            {{ author.name }}
            <span v-if="author.connection" class="font-normal text-xs">· {{ author.connection }}</span>
          </div>
          <div class="social-author-headline">{{ author.headline }}</div>
          <div class="social-timestamp">
            {{ meta.timestamp || 'Just now' }} · 
            <svg class="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
        
        <!-- Link Card -->
        <div v-if="content.link" class="social-link-card">
          <img 
            v-if="content.link.image"
            :src="content.link.image"
            :alt="content.link.title"
            class="social-link-image"
            @error="handleMediaError"
          />
          <div class="social-link-info">
            <div class="social-link-title">{{ content.link.title }}</div>
            <div class="social-link-domain">{{ content.link.domain || getDomain(content.link.url) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="social-engagement">
        <div class="social-reactions">
          <div class="social-reaction-icons">
            <span class="social-reaction-icon">👍</span>
            <span class="social-reaction-icon">❤️</span>
            <span class="social-reaction-icon">👏</span>
          </div>
          <span class="ml-1">{{ formatNumber(engagement.likes || 0) }}</span>
        </div>
        <div class="text-sm">
          {{ formatNumber(engagement.comments || 0) }} comments · {{ formatNumber(engagement.reposts || 0) }} reposts
        </div>
      </div>
    </template>
    
    <!-- Instagram -->
    <template v-else-if="platform === 'instagram'">
      <div class="social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="flex-1">
          <div class="social-author-name">
            {{ author.name }}
            <svg v-if="author.verified" class="social-verified" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        <svg class="w-6 h-6 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="6" cy="12" r="1.5"/>
          <circle cx="18" cy="12" r="1.5"/>
        </svg>
      </div>
      
      <div class="social-media">
        <img 
          v-if="content.media?.[0]"
          :src="content.media[0].url"
          :alt="content.media[0].alt || ''"
          @error="handleMediaError"
        />
        <div v-else class="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500"></div>
      </div>
      
      <div class="social-actions">
        <svg class="social-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <svg class="social-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <svg class="social-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
        <div class="flex-1"></div>
        <svg class="social-action" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      
      <div class="social-likes">{{ formatNumber(engagement.likes || 0) }} likes</div>
      
      <div class="social-caption">
        <span class="social-caption-author">{{ author.name }}</span>
        <span class="social-caption-text" v-html="formattedText"></span>
      </div>
      
      <div class="social-timestamp">{{ meta.timestamp || 'Just now' }}</div>
    </template>
    
    <!-- Facebook -->
    <template v-else-if="platform === 'facebook'">
      <div class="social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="flex-1">
          <div class="social-author-name">{{ author.name }}</div>
          <div class="social-timestamp">
            {{ meta.timestamp || 'Just now' }} · 
            <svg class="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
        
        <!-- Link Card -->
        <div v-if="content.link" class="social-link-card">
          <img 
            v-if="content.link.image"
            :src="content.link.image"
            :alt="content.link.title"
            class="social-link-image"
            @error="handleMediaError"
          />
          <div class="social-link-info">
            <div class="social-link-domain">{{ content.link.domain || getDomain(content.link.url) }}</div>
            <div class="social-link-title">{{ content.link.title }}</div>
            <div v-if="content.link.description" class="social-link-description">{{ content.link.description }}</div>
          </div>
        </div>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="social-engagement">
        <div class="social-reactions">
          <div class="social-reaction-emojis">
            <span class="social-reaction-emoji">👍</span>
            <span class="social-reaction-emoji">❤️</span>
            <span class="social-reaction-emoji">😮</span>
          </div>
          <span class="social-reaction-count ml-1">{{ formatNumber(totalReactions) }}</span>
        </div>
        <div class="social-comments-shares">
          {{ formatNumber(engagement.comments || 0) }} comments · {{ formatNumber(engagement.shares || 0) }} shares
        </div>
      </div>
    </template>
    
    <!-- Threads -->
    <template v-else-if="platform === 'threads'">
      <div class="social-header">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="flex-1">
          <div class="social-author-name">
            {{ author.name }}
            <svg v-if="author.verified" class="social-verified text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
            </svg>
          </div>
        </div>
        <span class="social-timestamp">{{ meta.timestamp || 'Just now' }}</span>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
      </div>
      
      <!-- Engagement -->
      <div v-if="showEngagement" class="social-engagement">
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{{ formatNumber(engagement.likes || 0) }}</span>
        </div>
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          <span>{{ formatNumber(engagement.replies || 0) }}</span>
        </div>
        <div class="social-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="m17 2-5 5-5-5M17 22l-5-5-5 5"/>
          </svg>
          <span>{{ formatNumber(engagement.reposts || 0) }}</span>
        </div>
      </div>
    </template>
    
    <!-- TikTok -->
    <template v-else-if="platform === 'tiktok'">
      <div class="social-thumbnail">
        <img 
          v-if="content.thumbnail"
          :src="content.thumbnail"
          alt="Video thumbnail"
          @error="handleMediaError"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-cyan-500 to-pink-500"></div>
        <div class="social-play-button">
          <div class="social-play-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        <div v-if="content.duration" class="social-duration">{{ content.duration }}</div>
      </div>
      
      <div class="social-info">
        <div class="social-header">
          <img 
            :src="author.avatar || defaultAvatar" 
            :alt="author.name"
            class="social-avatar"
            @error="handleAvatarError"
          />
          <span class="social-author-name">@{{ author.name }}</span>
          <svg v-if="author.verified" class="w-4 h-4 text-[#20d5ec]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"/>
            <path fill="#fff" d="m10.5 15.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z"/>
          </svg>
        </div>
        
        <p class="social-text" v-html="formattedText"></p>
        
        <div v-if="content.sound" class="social-sound">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          {{ content.sound }}
        </div>
        
        <!-- Engagement -->
        <div v-if="showEngagement" class="social-engagement">
          <span>{{ formatNumber(engagement.likes || 0) }} likes</span>
          <span>{{ formatNumber(engagement.comments || 0) }} comments</span>
          <span>{{ formatNumber(engagement.shares || 0) }} shares</span>
        </div>
      </div>
    </template>
    
    <!-- YouTube -->
    <template v-else-if="platform === 'youtube'">
      <div class="social-thumbnail">
        <img 
          v-if="content.thumbnail"
          :src="content.thumbnail"
          alt="Video thumbnail"
          @error="handleMediaError"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-red-600 to-red-800"></div>
        <div v-if="content.duration" class="social-duration">{{ content.duration }}</div>
      </div>
      
      <div class="social-info">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="flex-1 min-w-0">
          <div class="social-title">{{ content.title }}</div>
          <div class="social-channel">{{ author.name }}</div>
          <div class="social-meta">
            {{ formatNumber(engagement.views || 0) }} views · {{ meta.timestamp || 'Just now' }}
          </div>
        </div>
      </div>
    </template>
    
    <!-- Actions Bar -->
    <div class="social-actions-bar">
      <div class="social-platform-badge">
        <component :is="platformIcon" class="w-3.5 h-3.5" />
        <span>{{ platformName }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="charCount !== null" class="social-char-counter" :class="charCountClass">
          {{ charCount }}/{{ charLimit }}
        </span>
        <button class="social-copy-btn" @click="copyText">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          {{ copyLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue';

const props = defineProps({
  social: {
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

// Default avatar
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';

// Computed
const platform = computed(() => props.social?.platform || 'twitter');
const variant = computed(() => props.social?.variant || 'post');
const author = computed(() => props.social?.data?.author || {});
const content = computed(() => props.social?.data?.content || {});
const engagement = computed(() => props.social?.data?.engagement || {});
const meta = computed(() => props.social?.data?.meta || {});

const showEngagement = computed(() => {
  const e = engagement.value;
  return e.likes || e.comments || e.shares || e.retweets || e.replies || e.views;
});

const verifiedClass = computed(() => {
  const type = author.value.verifiedType || 'blue';
  return `social-verified-${type}`;
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
  // Return SVG icon component based on platform
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

// Character limits
const charLimits = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  threads: 500,
  tiktok: 2200,
  youtube: 100
};

const charLimit = computed(() => charLimits[platform.value] || 280);

const charCount = computed(() => {
  const text = content.value.text || '';
  return text.length;
});

const charCountClass = computed(() => {
  const count = charCount.value;
  const limit = charLimit.value;
  if (count > limit) return 'error';
  if (count > limit * 0.9) return 'warning';
  return '';
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
  text = text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
  
  // Mentions
  text = text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  
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
