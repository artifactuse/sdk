// processors/index.js
// Main entry point - imports and re-exports all processors

// Image processor
export {
  processImages,
  renderImageHtml,
  processImageGalleries,
  createImageGallery,
} from './image.js';

// Video processor
export {
  processVideos,
  isVideoUrl,           // NEW - check if URL is a video
  renderVideoHtml,
  createVideoPlayer,
  processVideoGalleries, 
  createVideoGallery,    
  createVideoWithPreview,
  createYouTubeEmbed,
  createVimeoEmbed,
  createLoomEmbed,
  createDailymotionEmbed,
} from './video.js';

// Audio processor
export {
  processAudio,
  createAudioPlayer,
  createSoundCloudEmbed,
  createSpotifyEmbed,
  createAppleMusicEmbed,
} from './audio.js';

export { 
  initializeAudioPlayers, 
  destroyAllPlayers,
} from './audioPlayer.js';

// Map processor
export {
  processMaps,
  createGoogleMapEmbed,
  createGoogleMapEmbedCoords,
  createOSMEmbed,
} from './map.js';

// Social media processor
export {
  processSocialEmbeds,
  createTwitterEmbed,
  createInstagramEmbed,
  createInstagramReelEmbed,
  createTikTokEmbed,
  createLinkedInEmbed,
  createRedditEmbed,
  createFacebookEmbed,
  createPinterestEmbed,
} from './social.js';

// Document processor
export {
  processPdfs,
  createPdfEmbed,
  processGoogleDocs,
  createGoogleDocEmbed,
  createGoogleFormEmbed,
  processOfficeDocuments,
  createOfficeEmbed,
} from './document.js';

// Code embed processor
export {
  processCodeEmbeds,
  createGistEmbed,
  createCodePenEmbed,
  createCodeSandboxEmbed,
  createJSFiddleEmbed,
  createStackBlitzEmbed,
  createReplitEmbed,
} from './codeEmbed.js';

// Data visualization processor
export {
  processDataViz,
  createTableauEmbed,
  createFlourishEmbed,
  createDatawrapperEmbed,
  createInfogramEmbed,
} from './dataViz.js';

// Design/3D processor
export {
  process3DEmbeds,
  createSketchfabEmbed,
  createFigmaEmbed,
  createFigmaPrototypeEmbed,
  createCanvaEmbed,
  createDribbbleEmbed,
  createBehanceEmbed,
} from './design.js';

// Interactive tools processor
export {
  processInteractiveEmbeds,
  createTypeformEmbed,
  createCalendlyEmbed,
  createGoogleCalendarEmbed,
  createCalcomEmbed,
  createNotionEmbed,
  createAirtableEmbed,
  createMiroEmbed,
} from './interactive.js';

// Mermaid diagrams processor
export {
  processMermaid,
  createMermaidBlock,
  initializeMermaid,
  loadMermaid,
  resetMermaidLoadState,
  isMermaidAvailable,
  hasMermaidLoadFailed,
  processMermaidInElement,
  rerenderMermaid,
  updateMermaidDiagram,
} from './mermaid.js';

// Table processor
export {
  processTables,
  createEnhancedTable,
  tableToCSV,
  downloadCSV,
  copyTableToClipboard,
  sortTable,
  filterTable,
  initializeTables,
} from './table.js';

// Math processor
export {
  processMath,
  createMathBlock,
  initializeMath,
  loadKaTeX,
  resetKaTeXLoadState,
  isKaTeXAvailable,
  hasKaTeXLoadFailed,
  processMathInElement,
  mathPatterns,
} from './math.js';

// Import defaults for namespace export
import imageProcessor from './image.js';
import videoProcessor from './video.js';
import audioProcessor from './audio.js';
import mapProcessor from './map.js';
import socialProcessor from './social.js';
import documentProcessor from './document.js';
import codeEmbedProcessor from './codeEmbed.js';
import dataVizProcessor from './dataViz.js';
import designProcessor from './design.js';
import interactiveProcessor from './interactive.js';
import mermaidProcessor from './mermaid.js';
import tableProcessor from './table.js';
import mathProcessor from './math.js';

// Default export with all processors grouped
export default {
  // Processor modules
  image: imageProcessor,
  video: videoProcessor,
  audio: audioProcessor,
  map: mapProcessor,
  social: socialProcessor,
  document: documentProcessor,
  codeEmbed: codeEmbedProcessor,
  dataViz: dataVizProcessor,
  design: designProcessor,
  interactive: interactiveProcessor,
  mermaid: mermaidProcessor,
  table: tableProcessor,
  math: mathProcessor,
  
  // Convenience aliases for main process functions
  processImages: imageProcessor.processImages,
  processVideos: videoProcessor.processVideos,
  processAudio: audioProcessor.processAudio,
  processMaps: mapProcessor.processMaps,
  processSocialEmbeds: socialProcessor.processSocialEmbeds,
  processPdfs: documentProcessor.processPdfs,
  processGoogleDocs: documentProcessor.processGoogleDocs,
  processOfficeDocuments: documentProcessor.processOfficeDocuments,
  processCodeEmbeds: codeEmbedProcessor.processCodeEmbeds,
  processDataViz: dataVizProcessor.processDataViz,
  process3DEmbeds: designProcessor.process3DEmbeds,
  processInteractiveEmbeds: interactiveProcessor.processInteractiveEmbeds,
  processMermaid: mermaidProcessor.processMermaid,
  processTables: tableProcessor.processTables,
  processMath: mathProcessor.processMath,
  
  // Initialization functions
  initializeMermaid: mermaidProcessor.initializeMermaid,
  initializeTables: tableProcessor.initializeTables,
  initializeMath: mathProcessor.initializeMath,

  // Render helpers
  renderImageHtml: imageProcessor.renderImageHtml
};