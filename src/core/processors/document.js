// processors/document.js
// Handles document embeds: PDFs, Google Docs/Sheets/Slides/Forms, Office documents

/**
 * Process PDF URLs in HTML
 */
export function processPdfs(html) {
  // PDF (linkified)
  const pdfLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.pdf(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(pdfLinkRegex, (match, url) => {
    return createPdfEmbed(url);
  });

  // PDF (raw)
  const pdfRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.pdf(?:\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(pdfRegex, (match, url) => {
    return createPdfEmbed(url);
  });

  return html;
}

/**
 * Create PDF embed
 */
export function createPdfEmbed(url) {
  const fileName = url.split('/').pop().split('?')[0];
  return `
    <div class="artifactuse-pdf-wrapper">
      <div class="artifactuse-pdf-header">
        <svg class="artifactuse-pdf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span class="artifactuse-pdf-filename">${fileName}</span>
        <a href="${url}" target="_blank" class="artifactuse-pdf-download" title="Download PDF">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </a>
      </div>
      <iframe src="${url}#view=FitH&toolbar=1" class="artifactuse-pdf-iframe" loading="lazy"></iframe>
    </div>
  `;
}

/**
 * Process Google Docs/Sheets/Slides/Forms URLs
 */
export function processGoogleDocs(html) {
  // Google Docs (linkified)
  const docsLinkRegex = /<a[^>]*href="(https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(docsLinkRegex, (match, url, docId) => {
    return createGoogleDocEmbed(docId, 'document');
  });

  // Google Docs (raw)
  const docsRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(docsRegex, (match, url, docId) => {
    return createGoogleDocEmbed(docId, 'document');
  });

  // Google Sheets (linkified)
  const sheetsLinkRegex = /<a[^>]*href="(https?:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(sheetsLinkRegex, (match, url, docId) => {
    return createGoogleDocEmbed(docId, 'spreadsheets');
  });

  // Google Sheets (raw)
  const sheetsRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(sheetsRegex, (match, url, docId) => {
    return createGoogleDocEmbed(docId, 'spreadsheets');
  });

  // Google Slides (linkified)
  const slidesLinkRegex = /<a[^>]*href="(https?:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(slidesLinkRegex, (match, url, docId) => {
    return createGoogleDocEmbed(docId, 'presentation');
  });

  // Google Slides (raw)
  const slidesRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(slidesRegex, (match, url, docId) => {
    return createGoogleDocEmbed(docId, 'presentation');
  });

  // Google Forms (linkified)
  const formsLinkRegex = /<a[^>]*href="(https?:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(formsLinkRegex, (match, url, formId) => {
    return createGoogleFormEmbed(formId);
  });

  // Google Forms (raw)
  const formsRegex = /(?<!["'=])(https?:\/\/docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(formsRegex, (match, url, formId) => {
    return createGoogleFormEmbed(formId);
  });

  return html;
}

/**
 * Create Google Doc/Sheet/Slides embed
 */
export function createGoogleDocEmbed(docId, type) {
  const typeLabels = {
    document: 'Google Doc',
    spreadsheets: 'Google Sheet',
    presentation: 'Google Slides'
  };
  
  const embedUrls = {
    document: `https://docs.google.com/document/d/${docId}/preview`,
    spreadsheets: `https://docs.google.com/spreadsheets/d/${docId}/preview`,
    presentation: `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`
  };

  const heights = {
    document: '600px',
    spreadsheets: '500px',
    presentation: '480px'
  };

  return `
    <div class="artifactuse-google-doc-wrapper">
      <div class="artifactuse-google-doc-header">
        <span class="artifactuse-google-doc-type">${typeLabels[type]}</span>
        <a href="https://docs.google.com/${type === 'presentation' ? 'presentation' : type}/d/${docId}" target="_blank" class="artifactuse-google-doc-link">
          Open in new tab
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      </div>
      <iframe src="${embedUrls[type]}" class="artifactuse-google-doc-iframe" style="height: ${heights[type]};" loading="lazy" allowfullscreen></iframe>
    </div>
  `;
}

/**
 * Create Google Form embed
 */
export function createGoogleFormEmbed(formId) {
  return `
    <div class="artifactuse-google-form-wrapper">
      <iframe 
        src="https://docs.google.com/forms/d/${formId}/viewform?embedded=true" 
        class="artifactuse-google-form-iframe" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Process Office document URLs
 */
export function processOfficeDocuments(html) {
  // Office documents (linkified)
  const officeLinkRegex = /<a[^>]*href="(https?:\/\/[^"]+\.(docx?|xlsx?|pptx?)(?:\?[^"]*)?)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(officeLinkRegex, (match, url) => {
    return createOfficeEmbed(url);
  });

  // Office documents (raw)
  const officeRegex = /(?<!["'=])(https?:\/\/[^\s<>"]+\.(docx?|xlsx?|pptx?)(?:\?[^\s<>"]*)?)(?!["'])/gi;
  html = html.replace(officeRegex, (match, url) => {
    return createOfficeEmbed(url);
  });

  return html;
}

/**
 * Create Office document embed (Word, Excel, PowerPoint)
 */
export function createOfficeEmbed(fileUrl) {
  const encoded = encodeURIComponent(fileUrl);
  const fileName = fileUrl.split('/').pop().split('?')[0];
  const extension = fileName.split('.').pop().toLowerCase();
  
  const typeLabels = {
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint'
  };

  return `
    <div class="artifactuse-office-wrapper">
      <div class="artifactuse-office-header">
        <span class="artifactuse-office-type">${typeLabels[extension] || 'Office Document'}</span>
        <span class="artifactuse-office-filename">${fileName}</span>
        <a href="${fileUrl}" target="_blank" class="artifactuse-office-download" title="Download">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </a>
      </div>
      <iframe src="https://view.officeapps.live.com/op/embed.aspx?src=${encoded}" class="artifactuse-office-iframe" loading="lazy"></iframe>
    </div>
  `;
}

export default {
  processPdfs,
  createPdfEmbed,
  processGoogleDocs,
  createGoogleDocEmbed,
  createGoogleFormEmbed,
  processOfficeDocuments,
  createOfficeEmbed,
};