<template>
  <div 
    ref="containerRef"
    class="artifactuse-social"
    :class="['social-' + platform]"
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
          <div class="social-author-meta">
            <span class="social-author-handle">{{ author.handle }}</span>
            <span class="social-timestamp">· {{ metaData.timestamp || 'Just now' }}</span>
          </div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
        
        <!-- Media -->
        <div v-if="contentMedia.length" class="social-media">
          <div 
            class="social-media-grid"
            :class="{ 'social-media-single': contentMedia.length === 1 }"
            :data-count="contentMedia.length"
          >
            <img 
              v-for="(media, idx) in contentMedia.slice(0, 4)" 
              :key="idx"
              :src="media.url"
              :alt="media.alt || ''"
              @error="handleMediaError"
            />
          </div>
        </div>
        
        <!-- Link Card -->
        <div v-if="content.link && !contentMedia.length" class="social-link-card">
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
        <span>{{ formatNumber(engagement.replies || 0) }} replies</span>
        <span>{{ formatNumber(engagement.retweets || 0) }} reposts</span>
        <span>{{ formatNumber(engagement.likes || 0) }} likes</span>
        <span>{{ formatNumber(engagement.views || 0) }} views</span>
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
        <div class="social-author">
          <div class="social-author-name">{{ author.name }}</div>
          <div class="social-author-headline">{{ author.headline }}</div>
          <div class="social-timestamp">{{ metaData.timestamp || 'Just now' }}</div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
        
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
      
      <div v-if="showEngagement" class="social-engagement">
        <span>{{ formatNumber(engagement.likes || 0) }} reactions</span>
        <span>{{ formatNumber(engagement.comments || 0) }} comments</span>
        <span>{{ formatNumber(engagement.reposts || 0) }} reposts</span>
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
        <div class="social-author">
          <div class="social-author-name">
            {{ author.name }}
            <svg v-if="author.verified" class="social-verified" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="social-media">
        <img 
          v-if="contentMedia[0]"
          :src="contentMedia[0].url"
          :alt="contentMedia[0].alt || ''"
          @error="handleMediaError"
        />
        <div v-else class="social-media-placeholder"></div>
      </div>
      
      <div class="social-likes">{{ formatNumber(engagement.likes || 0) }} likes</div>
      
      <div class="social-caption">
        <span class="social-caption-author">{{ author.name }}</span>
        <span class="social-caption-text" v-html="formattedText"></span>
      </div>
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
        <div class="social-author">
          <div class="social-author-name">{{ author.name }}</div>
          <div class="social-timestamp">{{ metaData.timestamp || 'Just now' }}</div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
        
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
          </div>
        </div>
      </div>
      
      <div v-if="showEngagement" class="social-engagement">
        <span>{{ formatNumber(engagement.likes || 0) }} likes</span>
        <span>{{ formatNumber(engagement.comments || 0) }} comments</span>
        <span>{{ formatNumber(engagement.shares || 0) }} shares</span>
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
        <div class="social-author">
          <div class="social-author-name">{{ author.name }}</div>
          <div class="social-timestamp">{{ metaData.timestamp || 'Just now' }}</div>
        </div>
      </div>
      
      <div class="social-content">
        <p class="social-text" v-html="formattedText"></p>
      </div>
      
      <div v-if="showEngagement" class="social-engagement">
        <span>{{ formatNumber(engagement.likes || 0) }} likes</span>
        <span>{{ formatNumber(engagement.replies || 0) }} replies</span>
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
        <div v-else class="social-thumbnail-placeholder"></div>
        <div v-if="content.duration" class="social-duration">{{ content.duration }}</div>
      </div>
      
      <div class="social-info">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="social-author">
          <div class="social-author-name">{{ author.name }}</div>
          <p class="social-text" v-html="formattedText"></p>
        </div>
      </div>
      
      <div v-if="showEngagement" class="social-engagement">
        <span>{{ formatNumber(engagement.likes || 0) }} likes</span>
        <span>{{ formatNumber(engagement.comments || 0) }} comments</span>
        <span>{{ formatNumber(engagement.shares || 0) }} shares</span>
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
        <div v-else class="social-thumbnail-placeholder"></div>
        <div v-if="content.duration" class="social-duration">{{ content.duration }}</div>
      </div>
      
      <div class="social-info">
        <img 
          :src="author.avatar || defaultAvatar" 
          :alt="author.name"
          class="social-avatar"
          @error="handleAvatarError"
        />
        <div class="social-author">
          <div class="social-title">{{ content.title }}</div>
          <div class="social-channel">{{ author.name }}</div>
          <div class="social-meta">
            {{ formatNumber(engagement.views || 0) }} views · {{ metaData.timestamp || 'Just now' }}
          </div>
        </div>
      </div>
    </template>
    
    <!-- Actions Bar -->
    <div class="social-actions-bar">
      <div class="social-platform-badge">
        <span>{{ platformName }}</span>
      </div>
      <div class="social-actions-right">
        <span v-if="charCount !== null" class="social-char-counter" :class="charCountClass">
          {{ charCount }}/{{ charLimit }}
        </span>
        <button class="social-copy-btn" @click="copyText">
          {{ copyLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  name: 'ArtifactuseSocialPreview',
  
  props: {
    social: {
      type: Object,
      required: true
    },
    theme: {
      type: String,
      default: 'dark'
    }
  },
  
  setup(props, { emit }) {
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
    const metaData = computed(() => props.social?.data?.meta || {});
    const contentMedia = computed(() => content.value.media || []);
    
    const showEngagement = computed(() => {
      const e = engagement.value;
      return e.likes || e.comments || e.shares || e.retweets || e.replies || e.views;
    });
    
    const verifiedClass = computed(() => {
      const type = author.value.verifiedType || 'blue';
      return 'social-verified-' + type;
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
    
    // Methods
    function formatNumber(num) {
      if (!num) return '0';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    }
    
    function getDomain(url) {
      try {
        return new URL(url).hostname.replace('www.', '');
      } catch (e) {
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
        emit('copy', { platform: platform.value, text: text });
      });
    }
    
    return {
      containerRef,
      copyLabel,
      defaultAvatar,
      platform,
      variant,
      author,
      content,
      engagement,
      metaData,
      contentMedia,
      showEngagement,
      verifiedClass,
      platformName,
      charLimit,
      charCount,
      charCountClass,
      formattedText,
      formatNumber,
      getDomain,
      handleAvatarError,
      handleMediaError,
      copyText,
    };
  },
};
</script>
