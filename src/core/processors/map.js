// processors/map.js
// Handles map embeds: Google Maps, OpenStreetMap

/**
 * Process all map URLs in HTML
 */
export function processMaps(html) {
  const protectedContent = [];
  
  // Protect <pre>...</pre> blocks
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Protect inline <code>...</code> tags
  html = html.replace(/<code[^>]*>[\s\S]*?<\/code>/gi, (match) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Protect existing iframes
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, (match) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });

  // Google Maps embed URL (linkified)
  const googleMapsEmbedLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?google\.com\/maps\/embed\?pb=[^"]+)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsEmbedLinkRegex, (match, url) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(createGoogleMapEmbedDirect(url));
    return placeholder;
  });

  // Google Maps embed URL (raw)
  const googleMapsEmbedRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/embed\?pb=[^\s<>"]+)(?!["'])/gi;
  html = html.replace(googleMapsEmbedRegex, (match, url) => {
    const placeholder = `__PROTECTED_MAP_${protectedContent.length}__`;
    protectedContent.push(createGoogleMapEmbedDirect(url));
    return placeholder;
  });

  // Google Maps place (linkified)
  const googleMapsPlaceLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?google\.com\/maps\/place\/([^\/\?"]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsPlaceLinkRegex, (match, url, place) => {
    return createGoogleMapEmbed(decodeURIComponent(place.replace(/\+/g, ' ')));
  });

  // Google Maps place (raw)
  const googleMapsPlaceRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/place\/([^\/\?\s]+))(?!["'])/gi;
  html = html.replace(googleMapsPlaceRegex, (match, url, place) => {
    return createGoogleMapEmbed(decodeURIComponent(place.replace(/\+/g, ' ')));
  });

  // Google Maps coordinates (linkified)
  const googleMapsCoordsLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?google\.com\/maps\/@([0-9.-]+),([0-9.-]+),([0-9]+)z[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsCoordsLinkRegex, (match, url, lat, lng, zoom) => {
    return createGoogleMapEmbedCoords(lat, lng, zoom);
  });

  // Google Maps coordinates (raw)
  const googleMapsCoordsRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/@([0-9.-]+),([0-9.-]+),([0-9]+)z)(?!["'])/gi;
  html = html.replace(googleMapsCoordsRegex, (match, url, lat, lng, zoom) => {
    return createGoogleMapEmbedCoords(lat, lng, zoom);
  });

  // Google Maps short URL (linkified)
  const googleMapsShortLinkRegex = /<a[^>]*href="(https?:\/\/maps\.google\.com\/\?q=([^\s"&]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsShortLinkRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query));
  });

  // Google Maps short URL (raw)
  const googleMapsShortRegex = /(?<!["'=])(https?:\/\/maps\.google\.com\/\?q=([^\s"&]+))(?!["'])/gi;
  html = html.replace(googleMapsShortRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query));
  });

  // Google Maps search (linkified)
  const googleMapsSearchLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?google\.com\/maps\/search\/([^\/\?"]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsSearchLinkRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query.replace(/\+/g, ' ')));
  });

  // Google Maps search (raw)
  const googleMapsSearchRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/search\/([^\/\?\s]+))(?!["'])/gi;
  html = html.replace(googleMapsSearchRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query.replace(/\+/g, ' ')));
  });

  // Google Maps API search with query parameter (linkified)
  const googleMapsApiSearchLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?google\.com\/maps\/search\/\?[^"]*query=([^"&]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleMapsApiSearchLinkRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query.replace(/\+/g, ' ')));
  });

  // Google Maps API search with query parameter (raw)
  const googleMapsApiSearchRegex = /(?<!["'=])(https?:\/\/(?:www\.)?google\.com\/maps\/search\/\?[^\s"]*query=([^\s"&]+))(?!["'])/gi;
  html = html.replace(googleMapsApiSearchRegex, (match, url, query) => {
    return createGoogleMapEmbed(decodeURIComponent(query.replace(/\+/g, ' ')));
  });

  // OpenStreetMap (linkified)
  const osmLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?openstreetmap\.org\/[^"]*mlat=([0-9.-]+)[^"]*mlon=([0-9.-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(osmLinkRegex, (match, url, lat, lon) => {
    const zoomMatch = url.match(/#map=(\d+)/);
    const zoom = zoomMatch ? zoomMatch[1] : 15;
    return createOSMEmbed(lat, lon, zoom);
  });

  // OpenStreetMap (raw)
  const osmRegex = /(?<!["'=])(https?:\/\/(?:www\.)?openstreetmap\.org\/[^\s]*mlat=([0-9.-]+)[^\s]*mlon=([0-9.-]+))(?!["'])/gi;
  html = html.replace(osmRegex, (match, url, lat, lon) => {
    const zoomMatch = url.match(/#map=(\d+)/);
    const zoom = zoomMatch ? zoomMatch[1] : 15;
    return createOSMEmbed(lat, lon, zoom);
  });

  // Restore all protected content
  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__PROTECTED_MAP_${i}__`, protectedContent[i]);
  }

  return html;
}

/**
 * Create Google Maps embed from direct embed URL
 * Extracts coordinates from the pb parameter and creates a standard embed
 */
export function createGoogleMapEmbedDirect(embedUrl) {
  // Try to extract coordinates from the pb parameter
  // Format: !1d{longitude}!2d{latitude} or !2d{longitude}!3d{latitude}
  const pbMatch = embedUrl.match(/pb=([^&]+)/);
  
  if (pbMatch) {
    const pb = decodeURIComponent(pbMatch[1]);
    
    // Look for coordinate patterns in the pb string
    // Pattern 1: !3d{lat}!2d{lng} (common format)
    const coordMatch1 = pb.match(/!3d(-?[\d.]+).*?!2d(-?[\d.]+)/);
    // Pattern 2: !2d{lng}!3d{lat} (alternative format)
    const coordMatch2 = pb.match(/!2d(-?[\d.]+).*?!3d(-?[\d.]+)/);
    
    let lat, lng;
    
    if (coordMatch1) {
      lat = coordMatch1[1];
      lng = coordMatch1[2];
    } else if (coordMatch2) {
      lng = coordMatch2[1];
      lat = coordMatch2[2];
    }
    
    if (lat && lng) {
      // Extract zoom from !1d parameter (it's actually the altitude/distance)
      const zoomMatch = pb.match(/!1d([\d.]+)/);
      let zoom = 15; // default zoom
      
      if (zoomMatch) {
        // Convert altitude to approximate zoom level
        const altitude = parseFloat(zoomMatch[1]);
        if (altitude > 10000) zoom = 10;
        else if (altitude > 5000) zoom = 12;
        else if (altitude > 1000) zoom = 14;
        else if (altitude > 500) zoom = 16;
        else zoom = 18;
      }
      
      return createGoogleMapEmbedCoords(lat, lng, zoom);
    }
  }
  
  // Fallback: try to use the URL directly (may not work for all URLs)
  return `
    <div class="artifactuse-map-wrapper">
      <iframe 
        src="${embedUrl}" 
        frameborder="0" 
        allowfullscreen 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade" 
        class="artifactuse-map-iframe">
      </iframe>
    </div>
  `;
}

/**
 * Create Google Maps embed from place name/query
 */
export function createGoogleMapEmbed(query) {
  const encoded = encodeURIComponent(query);
  return `
    <div class="artifactuse-map-wrapper">
      <iframe 
        src="https://www.google.com/maps?q=${encoded}&output=embed" 
        frameborder="0" 
        allowfullscreen 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade" 
        class="artifactuse-map-iframe">
      </iframe>
      <div class="artifactuse-map-actions">
        <a href="https://www.google.com/maps/search/${encoded}" target="_blank" rel="noopener" class="artifactuse-map-link">
          Open in Google Maps
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="artifactuse-map-icon">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
    </div>
  `;
}

/**
 * Create Google Maps embed from coordinates
 */
export function createGoogleMapEmbedCoords(lat, lng, zoom) {
  return `
    <div class="artifactuse-map-wrapper">
      <iframe 
        src="https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed" 
        frameborder="0" 
        allowfullscreen 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade" 
        class="artifactuse-map-iframe">
      </iframe>
      <div class="artifactuse-map-actions">
        <a href="https://www.google.com/maps/@${lat},${lng},${zoom}z" target="_blank" rel="noopener" class="artifactuse-map-link">
          Open in Google Maps
        </a>
      </div>
    </div>
  `;
}

/**
 * Create OpenStreetMap embed
 */
export function createOSMEmbed(lat, lon, zoom = 15) {
  const bbox = `${parseFloat(lon) - 0.01},${parseFloat(lat) - 0.01},${parseFloat(lon) + 0.01},${parseFloat(lat) + 0.01}`;
  return `
    <div class="artifactuse-map-wrapper">
      <iframe 
        src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}" 
        class="artifactuse-map-iframe" 
        loading="lazy">
      </iframe>
      <div class="artifactuse-map-actions">
        <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}" target="_blank" rel="noopener" class="artifactuse-map-link">
          View larger map
        </a>
      </div>
    </div>
  `;
}

export default {
  processMaps,
  createGoogleMapEmbedDirect,
  createGoogleMapEmbed,
  createGoogleMapEmbedCoords,
  createOSMEmbed,
};