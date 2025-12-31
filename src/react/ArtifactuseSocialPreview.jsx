// artifactuse/react/ArtifactuseSocialPreview.jsx
// Social media post preview component for React

import React, { useState, useMemo, useCallback } from 'react';

const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';

const charLimits = {
  twitter: 280, linkedin: 3000, instagram: 2200,
  facebook: 63206, threads: 500, tiktok: 2200, youtube: 100
};

const platformNames = {
  twitter: 'X', linkedin: 'LinkedIn', instagram: 'Instagram',
  facebook: 'Facebook', threads: 'Threads', tiktok: 'TikTok', youtube: 'YouTube'
};

// Verified badge icon
const VerifiedIcon = ({ type = 'blue' }) => (
  <svg className={`artifactuse-social-verified artifactuse-social-verified-${type}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.34 2.19c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
  </svg>
);

// Helper functions
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getDomain = (url) => {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
};

const formatText = (text) => {
  if (!text) return '';
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  formatted = formatted.replace(/\n/g, '<br>');
  formatted = formatted.replace(/#(\w+)/g, '<span class="artifactuse-social-hashtag">#$1</span>');
  formatted = formatted.replace(/@(\w+)/g, '<span class="artifactuse-social-mention">@$1</span>');
  return formatted;
};

// Twitter Component
const TwitterPreview = ({ author, content, engagement, meta }) => {
  const contentMedia = content.media || [];
  const showEngagement = engagement.likes || engagement.retweets || engagement.replies || engagement.views;
  
  return (
    <>
      <div className="artifactuse-social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
        <div className="artifactuse-social-author">
          <div className="artifactuse-social-author-name">
            <span>{author.name}</span>
            {author.verified && <VerifiedIcon type={author.verifiedType || 'blue'} />}
          </div>
          <div className="artifactuse-social-author-meta">
            <span className="artifactuse-social-author-handle">{author.handle}</span>
            <span className="artifactuse-social-timestamp">· {meta.timestamp || 'Just now'}</span>
          </div>
        </div>
      </div>
      
      <div className="artifactuse-social-content">
        <p className="artifactuse-social-text" dangerouslySetInnerHTML={{ __html: formatText(content.text) }} />
        
        {contentMedia.length > 0 && (
          <div className="artifactuse-social-media">
            <div className={`artifactuse-social-media-grid ${contentMedia.length === 1 ? 'artifactuse-social-media-single' : ''}`} data-count={contentMedia.length}>
              {contentMedia.slice(0, 4).map((media, idx) => (
                <img key={idx} src={media.url} alt={media.alt || ''} onError={(e) => e.target.style.display = 'none'} />
              ))}
            </div>
          </div>
        )}
        
        {content.link && !contentMedia.length && (
          <div className="artifactuse-social-link-card">
            {content.link.image && <img src={content.link.image} alt={content.link.title} className="artifactuse-social-link-image" onError={(e) => e.target.style.display = 'none'} />}
            <div className="artifactuse-social-link-info">
              <div className="artifactuse-social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
              <div className="artifactuse-social-link-title">{content.link.title}</div>
              {content.link.description && <div className="artifactuse-social-link-description">{content.link.description}</div>}
            </div>
          </div>
        )}
        
        {content.poll && (
          <div className="artifactuse-social-poll">
            {content.poll.options.map((option, idx) => (
              <div key={idx} className="artifactuse-social-poll-option">
                <div className="artifactuse-social-poll-bar" style={{ width: `${content.poll.votes?.[idx] || 0}%` }} />
                <div className="artifactuse-social-poll-label">
                  <span>{option}</span>
                  <span className="artifactuse-social-poll-percent">{content.poll.votes?.[idx] || 0}%</span>
                </div>
              </div>
            ))}
            <div className="artifactuse-social-poll-meta">
              {formatNumber(content.poll.totalVotes || 0)} votes · {content.poll.duration || 'Poll ended'}
            </div>
          </div>
        )}
        
        {content.quote && (
          <div className="artifactuse-social-quote">
            <div className="artifactuse-social-quote-header">
              <img src={content.quote.author?.avatar || defaultAvatar} className="artifactuse-social-quote-avatar" alt="" />
              <span className="artifactuse-social-quote-author">{content.quote.author?.name}</span>
              <span className="artifactuse-social-quote-handle">{content.quote.author?.handle}</span>
            </div>
            <p className="artifactuse-social-quote-text">{content.quote.text}</p>
          </div>
        )}
      </div>
      
      {showEngagement && (
        <div className="artifactuse-social-engagement">
          <span>{formatNumber(engagement.replies || 0)} replies</span>
          <span>{formatNumber(engagement.retweets || 0)} reposts</span>
          <span>{formatNumber(engagement.likes || 0)} likes</span>
          <span>{formatNumber(engagement.views || 0)} views</span>
        </div>
      )}
    </>
  );
};

// LinkedIn Component
const LinkedInPreview = ({ author, content, engagement, meta }) => {
  const showEngagement = engagement.likes || engagement.comments || engagement.shares || engagement.reposts;
  
  return (
    <>
      <div className="artifactuse-social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
        <div className="artifactuse-social-author-info">
          <div className="artifactuse-social-author-name">
            {author.name}
            {author.connection && <span className="artifactuse-social-author-connection">· {author.connection}</span>}
          </div>
          <div className="artifactuse-social-author-headline">{author.headline}</div>
          <div className="artifactuse-social-timestamp">{meta.timestamp || 'Just now'} · 🌐</div>
        </div>
      </div>
      <div className="artifactuse-social-content">
        <p className="artifactuse-social-text" dangerouslySetInnerHTML={{ __html: formatText(content.text) }} />
        {content.link && (
          <div className="artifactuse-social-link-card">
            {content.link.image && <img src={content.link.image} alt={content.link.title} className="artifactuse-social-link-image" onError={(e) => e.target.style.display = 'none'} />}
            <div className="artifactuse-social-link-info">
              <div className="artifactuse-social-link-title">{content.link.title}</div>
              <div className="artifactuse-social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
            </div>
          </div>
        )}
      </div>
      {showEngagement && (
        <div className="artifactuse-social-engagement">
          <span>{formatNumber(engagement.likes || 0)} reactions</span>
          <span>{formatNumber(engagement.comments || 0)} comments</span>
          <span>{formatNumber(engagement.shares || engagement.reposts || 0)} reposts</span>
        </div>
      )}
    </>
  );
};

// Instagram Component
const InstagramPreview = ({ author, content, engagement, meta }) => {
  const contentMedia = content.media || [];
  
  return (
    <>
      <div className="artifactuse-social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
        <div className="artifactuse-social-author">
          <div className="artifactuse-social-author-name">
            {author.name}
            {author.verified && <VerifiedIcon type="blue" />}
          </div>
          {meta.location && <div className="artifactuse-social-location">{meta.location}</div>}
        </div>
      </div>
      <div className="artifactuse-social-media">
        {contentMedia[0] ? (
          <img src={contentMedia[0].url} alt={contentMedia[0].alt || ''} onError={(e) => e.target.style.display = 'none'} />
        ) : (
          <div className="artifactuse-social-media-placeholder" />
        )}
      </div>
      <div className="artifactuse-social-likes">{formatNumber(engagement.likes || 0)} likes</div>
      <div className="artifactuse-social-caption">
        <span className="artifactuse-social-caption-author">{author.name}</span>
        <span className="artifactuse-social-caption-text" dangerouslySetInnerHTML={{ __html: formatText(content.text) }} />
      </div>
      <div className="artifactuse-social-timestamp">{meta.timestamp || 'JUST NOW'}</div>
    </>
  );
};

// Facebook Component
const FacebookPreview = ({ author, content, engagement, meta }) => {
  const contentMedia = content.media || [];
  const totalReactions = useMemo(() => {
    const reactions = engagement.reactions || {};
    return Object.values(reactions).reduce((sum, val) => sum + (val || 0), 0) || engagement.likes || 0;
  }, [engagement]);
  const showEngagement = engagement.likes || engagement.comments || engagement.shares || totalReactions;
  
  return (
    <>
      <div className="artifactuse-social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
        <div className="artifactuse-social-author">
          <div className="artifactuse-social-author-name">{author.name}</div>
          <div className="artifactuse-social-timestamp">{meta.timestamp || 'Just now'} · 🌐</div>
        </div>
      </div>
      <div className="artifactuse-social-content">
        <p className="artifactuse-social-text" dangerouslySetInnerHTML={{ __html: formatText(content.text) }} />
        {contentMedia.length > 0 && (
          <div className="artifactuse-social-media">
            <div className="artifactuse-social-media-grid" data-count={contentMedia.length}>
              {contentMedia.slice(0, 4).map((media, idx) => (
                <img key={idx} src={media.url} alt={media.alt || ''} onError={(e) => e.target.style.display = 'none'} />
              ))}
            </div>
          </div>
        )}
        {content.link && !contentMedia.length && (
          <div className="artifactuse-social-link-card">
            {content.link.image && <img src={content.link.image} alt={content.link.title} className="artifactuse-social-link-image" onError={(e) => e.target.style.display = 'none'} />}
            <div className="artifactuse-social-link-info">
              <div className="artifactuse-social-link-domain">{content.link.domain || getDomain(content.link.url)}</div>
              <div className="artifactuse-social-link-title">{content.link.title}</div>
            </div>
          </div>
        )}
      </div>
      {showEngagement && (
        <div className="artifactuse-social-engagement">
          <span>👍❤️ {formatNumber(totalReactions)}</span>
          <span>{formatNumber(engagement.comments || 0)} comments · {formatNumber(engagement.shares || 0)} shares</span>
        </div>
      )}
    </>
  );
};

// Threads Component
const ThreadsPreview = ({ author, content, engagement, meta }) => {
  const showEngagement = engagement.likes || engagement.replies || engagement.reposts;
  
  return (
    <>
      <div className="artifactuse-social-header">
        <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
        <div className="artifactuse-social-author">
          <div className="artifactuse-social-author-name">
            {author.name}
            {author.verified && <VerifiedIcon type="blue" />}
          </div>
        </div>
        <span className="artifactuse-social-timestamp">{meta.timestamp || 'Just now'}</span>
      </div>
      <div className="artifactuse-social-content">
        <p className="artifactuse-social-text" dangerouslySetInnerHTML={{ __html: formatText(content.text) }} />
      </div>
      {showEngagement && (
        <div className="artifactuse-social-engagement">
          <span>{formatNumber(engagement.likes || 0)} likes</span>
          <span>{formatNumber(engagement.replies || 0)} replies</span>
          <span>{formatNumber(engagement.reposts || 0)} reposts</span>
        </div>
      )}
    </>
  );
};

// TikTok Component
const TikTokPreview = ({ author, content, engagement, meta }) => {
  const contentMedia = content.media || [];
  const showEngagement = engagement.likes || engagement.comments || engagement.shares;
  
  return (
    <>
      <div className="artifactuse-social-thumbnail">
        {contentMedia[0] ? (
          <img src={contentMedia[0].url} alt="Video thumbnail" onError={(e) => e.target.style.display = 'none'} />
        ) : (
          <div className="artifactuse-social-thumbnail-placeholder" />
        )}
        {content.duration && <div className="artifactuse-social-duration">{content.duration}</div>}
      </div>
      <div className="artifactuse-social-info">
        <div className="artifactuse-social-header">
          <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
          <span className="artifactuse-social-author-name">@{author.name}</span>
          {author.verified && <VerifiedIcon type="blue" />}
        </div>
        <p className="artifactuse-social-text" dangerouslySetInnerHTML={{ __html: formatText(content.text) }} />
        {content.sound && <div className="artifactuse-social-sound">🎵 {content.sound}</div>}
      </div>
      {showEngagement && (
        <div className="artifactuse-social-engagement">
          <span>{formatNumber(engagement.likes || 0)} likes</span>
          <span>{formatNumber(engagement.comments || 0)} comments</span>
          <span>{formatNumber(engagement.shares || 0)} shares</span>
        </div>
      )}
    </>
  );
};

// YouTube Component
const YouTubePreview = ({ author, content, engagement, meta }) => {
  const contentMedia = content.media || [];
  
  return (
    <>
      <div className="artifactuse-social-thumbnail">
        {contentMedia[0] ? (
          <img src={contentMedia[0].url} alt="Video thumbnail" onError={(e) => e.target.style.display = 'none'} />
        ) : (
          <div className="artifactuse-social-thumbnail-placeholder" />
        )}
        {content.duration && <div className="artifactuse-social-duration">{content.duration}</div>}
      </div>
      <div className="artifactuse-social-info">
        <img src={author.avatar || defaultAvatar} alt={author.name} className="artifactuse-social-avatar" onError={(e) => e.target.src = defaultAvatar} />
        <div className="artifactuse-social-details">
          <div className="artifactuse-social-title">{content.title}</div>
          <div className="artifactuse-social-channel">{author.name}</div>
          <div className="artifactuse-social-meta">{formatNumber(engagement.views || 0)} views · {meta.timestamp || 'Just now'}</div>
        </div>
      </div>
    </>
  );
};

// Main Component
export function ArtifactuseSocialPreview({ artifact, theme = 'dark', onCopy }) {
  const [copyLabel, setCopyLabel] = useState('Copy');
  
  // Parse social data from artifact.code
  const social = useMemo(() => {
    try {
      return JSON.parse(artifact.code);
    } catch {
      return { platform: 'twitter', data: {} };
    }
  }, [artifact.code]);
  
  const platform = social?.platform || 'twitter';
  const data = social?.data || {};
  const { author = {}, content = {}, engagement = {}, meta = {} } = data;
  
  const charLimit = charLimits[platform] || 280;
  const charCount = (content.text || '').length;
  const charCountClass = charCount > charLimit ? 'error' : charCount > charLimit * 0.9 ? 'warning' : '';
  
  const handleCopy = useCallback(() => {
    const text = content.text || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 2000);
      onCopy?.({ platform, text });
    });
  }, [content.text, platform, onCopy]);
  
  const renderPlatform = () => {
    const props = { author, content, engagement, meta };
    switch (platform) {
      case 'twitter': return <TwitterPreview {...props} />;
      case 'linkedin': return <LinkedInPreview {...props} />;
      case 'instagram': return <InstagramPreview {...props} />;
      case 'facebook': return <FacebookPreview {...props} />;
      case 'threads': return <ThreadsPreview {...props} />;
      case 'tiktok': return <TikTokPreview {...props} />;
      case 'youtube': return <YouTubePreview {...props} />;
      default: return <TwitterPreview {...props} />;
    }
  };
  
  return (
    <div className={`artifactuse-social artifactuse-social-${platform}`} data-theme={theme}>
      {renderPlatform()}
      
      {/* Actions Bar */}
      <div className="artifactuse-social-actions-bar">
        <div className="artifactuse-social-platform-badge">
          <span>{platformNames[platform] || platform}</span>
        </div>
        <div className="artifactuse-social-actions-right">
          <span className={`artifactuse-social-char-counter ${charCountClass}`}>
            {charCount}/{charLimit}
          </span>
          <button className="artifactuse-social-copy-btn" onClick={handleCopy}>
            {copyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArtifactuseSocialPreview;