// processors/interactive.js
// Handles interactive tool embeds: Typeform, Calendly, Notion, Airtable, Miro, Google Calendar, Cal.com

/**
 * Process all interactive tool URLs in HTML
 * @param {string} html - HTML content to process
 * @param {object} options - Processing options
 * @param {string} options.theme - Theme: 'dark' | 'light'
 */
export function processInteractiveEmbeds(html, options = {}) {
  const theme = options.theme || 'dark';
  
  // Typeform (linkified)
  const typeformLinkRegex = /<a[^>]*href="(https?:\/\/(?:[a-zA-Z0-9-]+\.)?typeform\.com\/to\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(typeformLinkRegex, (match, url, formId) => {
    return createTypeformEmbed(formId);
  });

  // Typeform (raw)
  const typeformRegex = /(?<!["'=])(https?:\/\/(?:[a-zA-Z0-9-]+\.)?typeform\.com\/to\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(typeformRegex, (match, url, formId) => {
    return createTypeformEmbed(formId);
  });

  // Calendly (linkified)
  const calendlyLinkRegex = /<a[^>]*href="(https?:\/\/calendly\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(calendlyLinkRegex, (match, url, username, eventType) => {
    return createCalendlyEmbed(username, eventType);
  });

  // Calendly (raw)
  const calendlyRegex = /(?<!["'=])(https?:\/\/calendly\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?)(?!["'])/gi;
  html = html.replace(calendlyRegex, (match, url, username, eventType) => {
    return createCalendlyEmbed(username, eventType);
  });

  // Google Calendar Appointments (linkified)
  const googleCalLinkRegex = /<a[^>]*href="(https?:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(googleCalLinkRegex, (match, url, scheduleId) => {
    return createGoogleCalendarEmbed(scheduleId);
  });

  // Google Calendar Appointments (raw)
  const googleCalRegex = /(?<!["'=])(https?:\/\/calendar\.google\.com\/calendar\/appointments\/schedules\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(googleCalRegex, (match, url, scheduleId) => {
    return createGoogleCalendarEmbed(scheduleId);
  });

  // Cal.com (linkified)
  const calcomLinkRegex = /<a[^>]*href="(https?:\/\/cal\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(calcomLinkRegex, (match, url, username, eventType) => {
    return createCalcomEmbed(username, eventType, theme);
  });

  // Cal.com (raw)
  const calcomRegex = /(?<!["'=])(https?:\/\/cal\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?)(?!["'])/gi;
  html = html.replace(calcomRegex, (match, url, username, eventType) => {
    return createCalcomEmbed(username, eventType, theme);
  });

  // Notion (linkified)
  const notionLinkRegex = /<a[^>]*href="(https?:\/\/(?:www\.)?notion\.so\/([a-zA-Z0-9-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(notionLinkRegex, (match, url, pageId) => {
    return createNotionEmbed(pageId);
  });

  // Notion (raw)
  const notionRegex = /(?<!["'=])(https?:\/\/(?:www\.)?notion\.so\/([a-zA-Z0-9-]+))(?!["'])/gi;
  html = html.replace(notionRegex, (match, url, pageId) => {
    return createNotionEmbed(pageId);
  });

  // Airtable (linkified)
  const airtableLinkRegex = /<a[^>]*href="(https?:\/\/airtable\.com\/(?:embed\/)?([a-zA-Z0-9]+)(?:\/([a-zA-Z0-9]+))?[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(airtableLinkRegex, (match, url, baseId, viewId) => {
    return createAirtableEmbed(baseId, viewId);
  });

  // Airtable (raw)
  const airtableRegex = /(?<!["'=])(https?:\/\/airtable\.com\/(?:embed\/)?([a-zA-Z0-9]+)(?:\/([a-zA-Z0-9]+))?)(?!["'])/gi;
  html = html.replace(airtableRegex, (match, url, baseId, viewId) => {
    return createAirtableEmbed(baseId, viewId);
  });

  // Miro (linkified)
  const miroLinkRegex = /<a[^>]*href="(https?:\/\/miro\.com\/app\/board\/([a-zA-Z0-9_=-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(miroLinkRegex, (match, url, boardId) => {
    return createMiroEmbed(boardId);
  });

  // Miro (raw)
  const miroRegex = /(?<!["'=])(https?:\/\/miro\.com\/app\/board\/([a-zA-Z0-9_=-]+))(?!["'])/gi;
  html = html.replace(miroRegex, (match, url, boardId) => {
    return createMiroEmbed(boardId);
  });

  return html;
}

/**
 * Create Typeform embed
 * Note: Typeform embed doesn't support theme parameter via URL
 */
export function createTypeformEmbed(formId) {
  return `
    <div class="artifactuse-typeform-wrapper">
      <iframe 
        src="https://form.typeform.com/to/${formId}" 
        class="artifactuse-typeform-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Calendly embed
 * Note: Calendly embed doesn't support theme parameter via URL
 */
export function createCalendlyEmbed(username, eventType = '') {
  const url = eventType 
    ? `https://calendly.com/${username}/${eventType}` 
    : `https://calendly.com/${username}`;
  return `
    <div class="artifactuse-calendly-wrapper">
      <iframe 
        src="${url}?embed_domain=localhost&embed_type=Inline" 
        class="artifactuse-calendly-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Google Calendar Appointments embed
 * Note: Google Calendar embed doesn't support theme parameter
 */
export function createGoogleCalendarEmbed(scheduleId) {
  return `
    <div class="artifactuse-google-calendar-wrapper">
      <iframe 
        src="https://calendar.google.com/calendar/appointments/schedules/${scheduleId}?gv=true" 
        class="artifactuse-google-calendar-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Cal.com embed
 * @param {string} username - Cal.com username
 * @param {string} eventType - Event type (optional)
 * @param {string} theme - 'dark' | 'light'
 */
export function createCalcomEmbed(username, eventType = '', theme = 'dark') {
  const path = eventType ? `${username}/${eventType}` : username;
  return `
    <div class="artifactuse-calcom-wrapper">
      <iframe 
        src="https://cal.com/${path}?embed=true&theme=${theme}" 
        class="artifactuse-calcom-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Notion embed
 * Note: Notion embed doesn't support theme parameter
 */
export function createNotionEmbed(pageId) {
  return `
    <div class="artifactuse-notion-wrapper">
      <iframe 
        src="https://notion.so/${pageId}" 
        class="artifactuse-notion-iframe" 
        loading="lazy" 
        allowfullscreen>
      </iframe>
    </div>
  `;
}

/**
 * Create Airtable embed
 * Note: Airtable embed doesn't support theme parameter
 */
export function createAirtableEmbed(baseId, viewId) {
  const url = viewId 
    ? `https://airtable.com/embed/${baseId}/${viewId}` 
    : `https://airtable.com/embed/${baseId}`;
  return `
    <div class="artifactuse-airtable-wrapper">
      <iframe 
        src="${url}?backgroundColor=purple" 
        class="artifactuse-airtable-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Miro embed
 * Note: Miro embed doesn't support theme parameter
 */
export function createMiroEmbed(boardId) {
  return `
    <div class="artifactuse-miro-wrapper">
      <iframe 
        src="https://miro.com/app/embed/${boardId}/?autoplay=yep" 
        class="artifactuse-miro-iframe" 
        allowfullscreen 
        loading="lazy">
      </iframe>
    </div>
  `;
}

export default {
  processInteractiveEmbeds,
  createTypeformEmbed,
  createCalendlyEmbed,
  createGoogleCalendarEmbed,
  createCalcomEmbed,
  createNotionEmbed,
  createAirtableEmbed,
  createMiroEmbed,
};