// processors/dataViz.js
// Handles data visualization embeds: Tableau, Flourish, Datawrapper, Infogram

/**
 * Process all data visualization URLs in HTML
 */
export function processDataViz(html) {
  // Tableau Public (linkified)
  const tableauLinkRegex = /<a[^>]*href="(https?:\/\/public\.tableau\.com\/(?:views|profile)\/([^\s"]+))"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(tableauLinkRegex, (match, url, vizPath) => {
    return createTableauEmbed(vizPath);
  });

  // Tableau Public (raw)
  const tableauRegex = /(?<!["'=])(https?:\/\/public\.tableau\.com\/(?:views|profile)\/([^\s<>"]+))(?!["'])/gi;
  html = html.replace(tableauRegex, (match, url, vizPath) => {
    return createTableauEmbed(vizPath);
  });

  // Flourish (linkified)
  const flourishLinkRegex = /<a[^>]*href="(https?:\/\/(?:public\.)?flourish\.studio\/visualisation\/(\d+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(flourishLinkRegex, (match, url, vizId) => {
    return createFlourishEmbed(vizId);
  });

  // Flourish (raw)
  const flourishRegex = /(?<!["'=])(https?:\/\/(?:public\.)?flourish\.studio\/visualisation\/(\d+))(?!["'])/gi;
  html = html.replace(flourishRegex, (match, url, vizId) => {
    return createFlourishEmbed(vizId);
  });

  // Datawrapper (linkified)
  const datawrapperLinkRegex = /<a[^>]*href="(https?:\/\/datawrapper\.dwcdn\.net\/([a-zA-Z0-9]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(datawrapperLinkRegex, (match, url, chartId) => {
    return createDatawrapperEmbed(chartId);
  });

  // Datawrapper (raw)
  const datawrapperRegex = /(?<!["'=])(https?:\/\/datawrapper\.dwcdn\.net\/([a-zA-Z0-9]+))(?!["'])/gi;
  html = html.replace(datawrapperRegex, (match, url, chartId) => {
    return createDatawrapperEmbed(chartId);
  });

  // Infogram (linkified)
  const infogramLinkRegex = /<a[^>]*href="(https?:\/\/(?:e\.)?infogram\.com\/([a-zA-Z0-9_-]+)[^"]*)"[^>]*>[^<]*<\/a>/gi;
  html = html.replace(infogramLinkRegex, (match, url, chartId) => {
    return createInfogramEmbed(chartId);
  });

  // Infogram (raw)
  const infogramRegex = /(?<!["'=])(https?:\/\/(?:e\.)?infogram\.com\/([a-zA-Z0-9_-]+))(?!["'])/gi;
  html = html.replace(infogramRegex, (match, url, chartId) => {
    return createInfogramEmbed(chartId);
  });

  return html;
}

/**
 * Create Tableau Public embed
 */
export function createTableauEmbed(vizPath) {
  return `
    <div class="artifactuse-tableau-wrapper">
      <iframe 
        src="https://public.tableau.com/views/${vizPath}?:embed=y&:display_count=yes&:showVizHome=no" 
        class="artifactuse-tableau-iframe" 
        loading="lazy" 
        allowfullscreen>
      </iframe>
    </div>
  `;
}

/**
 * Create Flourish embed
 */
export function createFlourishEmbed(vizId) {
  return `
    <div class="artifactuse-flourish-wrapper">
      <iframe 
        src="https://flo.uri.sh/visualisation/${vizId}/embed" 
        class="artifactuse-flourish-iframe" 
        sandbox="allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Datawrapper embed
 */
export function createDatawrapperEmbed(chartId) {
  return `
    <div class="artifactuse-datawrapper-wrapper">
      <iframe 
        src="https://datawrapper.dwcdn.net/${chartId}/" 
        class="artifactuse-datawrapper-iframe" 
        scrolling="no" 
        loading="lazy">
      </iframe>
    </div>
  `;
}

/**
 * Create Infogram embed
 */
export function createInfogramEmbed(chartId) {
  return `
    <div class="artifactuse-infogram-wrapper">
      <iframe 
        src="https://e.infogram.com/${chartId}?src=embed" 
        class="artifactuse-infogram-iframe" 
        scrolling="no" 
        allowfullscreen 
        loading="lazy">
      </iframe>
    </div>
  `;
}

export default {
  processDataViz,
  createTableauEmbed,
  createFlourishEmbed,
  createDatawrapperEmbed,
  createInfogramEmbed,
};