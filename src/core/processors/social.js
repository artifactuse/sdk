// processors/social.js
// Handles social media embeds: Twitter, Instagram, TikTok, LinkedIn, Reddit, Facebook, Pinterest

/**
 * Process all social media URLs in HTML
 */
export function processSocialEmbeds(html) {
  // Twitter/X (linkified)
  const twitterLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(twitterLinkRegex, (match, url, username, tweetId) => {
    return createTwitterEmbed(username, tweetId);
  });

  // Twitter/X (raw)
  const twitterRegex = /(?<!["'=])(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+))(?!["'])/gi;
  html = html.replace(twitterRegex, (match, url, username, tweetId) => {
    return createTwitterEmbed(username, tweetId);
  });

  // Instagram Posts (linkified)
  const instagramPostLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(instagramPostLinkRegex, (match, url, postId) => {
    return createInstagramEmbed(postId);
  });

  // Instagram Posts (raw)
  const instagramPostRegex = /(?<!["'=])(https?:\/\/(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(instagramPostRegex, (match, url, postId) => {
    return createInstagramEmbed(postId);
  });

  // Instagram Reels (linkified)
  const instagramReelLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(instagramReelLinkRegex, (match, url, reelId) => {
    return createInstagramReelEmbed(reelId);
  });

  // Instagram Reels (raw)
  const instagramReelRegex = /(?<!["'=])(https?:\/\/(?:www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(instagramReelRegex, (match, url, reelId) => {
    return createInstagramReelEmbed(reelId);
  });

  // TikTok (linkified)
  const tiktokLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/video\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(tiktokLinkRegex, (match, url, username, videoId) => {
    return createTikTokEmbed(videoId);
  });

  // TikTok (raw)
  const tiktokRegex = /(?<!["'=])(https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/video\/(\d+))(?!["'])/gi;
  html = html.replace(tiktokRegex, (match, url, username, videoId) => {
    return createTikTokEmbed(videoId);
  });

  // LinkedIn (linkified)
  const linkedinLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?linkedin\.com\/(?:posts|feed\/update)\/([a-zA-Z0-9_:-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(linkedinLinkRegex, (match, url, postId) => {
    return createLinkedInEmbed(postId, url);
  });

  // LinkedIn (raw)
  const linkedinRegex = /(?<!["'=])(https?:\/\/(?:www\.)?linkedin\.com\/(?:posts|feed\/update)\/([a-zA-Z0-9_:-]+))(?!["'])/gi;
  html = html.replace(linkedinRegex, (match, url, postId) => {
    return createLinkedInEmbed(postId, url);
  });

  // Reddit (linkified)
  const redditLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(redditLinkRegex, (match, url, subreddit, postId) => {
    return createRedditEmbed(subreddit, postId, url);
  });

  // Reddit (raw)
  const redditRegex = /(?<!["'=])(https?:\/\/(?:www\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(redditRegex, (match, url, subreddit, postId) => {
    return createRedditEmbed(subreddit, postId, url);
  });

  // Facebook (linkified)
  const facebookLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+\/posts\/\d+[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(facebookLinkRegex, (match, url) => {
    return createFacebookEmbed(url);
  });

  // Facebook (raw)
  const facebookRegex = /(?<!["'=])(https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.]+\/posts\/\d+)(?!["'])/gi;
  html = html.replace(facebookRegex, (match, url) => {
    return createFacebookEmbed(url);
  });

  // Pinterest (linkified)
  const pinterestLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?pinterest\.com\/pin\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(pinterestLinkRegex, (match, url, pinId) => {
    return createPinterestEmbed(pinId);
  });

  // Pinterest (raw)
  const pinterestRegex = /(?<!["'=])(https?:\/\/(?:www\.)?pinterest\.com\/pin\/(\d+))(?!["'])/gi;
  html = html.replace(pinterestRegex, (match, url, pinId) => {
    return createPinterestEmbed(pinId);
  });

  return html;
}

/**
 * Create Twitter/X embed
 */
export function createTwitterEmbed(username, tweetId) {
  return `
    <div class="artifactuse-twitter-wrapper">
      <blockquote class="twitter-tweet" data-dnt="true" data-theme="light">
        <a href="https://twitter.com/${username}/status/${tweetId}">Loading tweet...</a>
      </blockquote>
      <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    </div>
  `;
}

/**
 * Create Instagram post embed
 */
export function createInstagramEmbed(postId) {
  return `
    <div class="artifactuse-instagram-wrapper">
      <iframe 
        src="https://www.instagram.com/p/${postId}/embed" 
        frameborder="0" 
        scrolling="no" 
        allowtransparency="true" 
        class="artifactuse-instagram-embed" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Instagram reel embed
 */
export function createInstagramReelEmbed(reelId) {
  return `
    <div class="artifactuse-instagram-wrapper">
      <iframe 
        src="https://www.instagram.com/reel/${reelId}/embed" 
        frameborder="0" 
        scrolling="no" 
        allowtransparency="true" 
        class="artifactuse-instagram-embed artifactuse-instagram-reel" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create TikTok embed
 */
export function createTikTokEmbed(videoId) {
  return `
    <div class="artifactuse-tiktok-wrapper">
      <iframe 
        src="https://www.tiktok.com/embed/v2/${videoId}" 
        frameborder="0" 
        allowfullscreen 
        class="artifactuse-tiktok-embed" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create LinkedIn embed
 */
export function createLinkedInEmbed(postId, originalUrl) {
  return `
    <div class="artifactuse-linkedin-wrapper">
      <iframe 
        src="https://www.linkedin.com/embed/feed/update/${postId}" 
        frameborder="0" 
        allowfullscreen 
        class="artifactuse-linkedin-embed" 
        loading="lazy">
      </iframe>
      <div class="artifactuse-embed-fallback">
        <a href="${originalUrl}" target="_blank" rel="noopener">View on LinkedIn</a>
      </div>
    </div>
  `;
}

/**
 * Create Reddit embed
 */
export function createRedditEmbed(subreddit, postId, originalUrl) {
  return `
    <div class="artifactuse-reddit-wrapper">
      <iframe 
        src="https://www.redditmedia.com/r/${subreddit}/comments/${postId}/?ref_source=embed&amp;ref=share&amp;embed=true" 
        sandbox="allow-scripts allow-same-origin allow-popups" 
        class="artifactuse-reddit-embed" 
        loading="lazy">
      </iframe>
      <div class="artifactuse-embed-fallback">
        <a href="${originalUrl}" target="_blank" rel="noopener">View on Reddit</a>
      </div>
    </div>
  `;
}

/**
 * Create Facebook embed
 */
export function createFacebookEmbed(url) {
  const encodedUrl = encodeURIComponent(url);
  return `
    <div class="artifactuse-facebook-wrapper">
      <iframe 
        src="https://www.facebook.com/plugins/post.php?href=${encodedUrl}&show_text=true&width=500" 
        width="500" 
        height="400" 
        style="border:none;overflow:hidden" 
        scrolling="no" 
        frameborder="0" 
        allowfullscreen="true" 
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" 
        class="artifactuse-facebook-embed" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Pinterest embed
 */
export function createPinterestEmbed(pinId) {
  return `
    <div class="artifactuse-pinterest-wrapper">
      <a data-pin-do="embedPin" data-pin-width="large" href="https://www.pinterest.com/pin/${pinId}/"></a>
      <script async defer src="https://assets.pinterest.com/js/pinit.js"></script>
    </div>
  `;
}

export default {
  processSocialEmbeds,
  createTwitterEmbed,
  createInstagramEmbed,
  createInstagramReelEmbed,
  createTikTokEmbed,
  createLinkedInEmbed,
  createRedditEmbed,
  createFacebookEmbed,
  createPinterestEmbed,
};