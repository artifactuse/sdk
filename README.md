# Artifactuse

**The Artifact SDK for AI Agents** - Turn AI outputs into interactive experiences.

Artifactuse is a lightweight SDK that transforms AI-generated content into rich, interactive artifacts. Support for code previews, video editors, canvas/whiteboards, forms, social media previews, and more.

## Features

- 🎨 **Rich Content Detection** - Automatically detect and render code blocks, images, videos, maps, embeds, and more
- 📦 **Artifact Cards** - Beautiful inline cards for code artifacts
- 👁️ **Inline Code Preview** - Truncated syntax-highlighted code previews with click-to-open panel
- 🖼️ **Media Lightbox** - Click images and PDFs to view fullscreen with zoom and download
- 🖥️ **Panel Viewer** - Side panel with preview, code view, and split mode
- 📝 **Interactive Forms** - Inline and panel forms with 17+ field types, auto-collapse after submission
- 📱 **Social Previews** - Platform-accurate previews for Twitter, LinkedIn, Instagram, and more
- 🌗 **Theme Support** - Dark/light mode with customizable colors
- 🔌 **Framework Agnostic** - Works with Vue 3, Vue 2, React, Svelte, or vanilla JS
- 📡 **Event System** - Hook into AI requests, form submissions, exports
- ☁️ **Cloud Ready** - Built for SaaS integration

## Installation

```bash
npm install artifactuse
```

## Syntax Highlighting (Optional)

For code syntax highlighting in the panel, include Prism.js:

```bash
npm install prismjs
```

```js
import Prism from 'prismjs'
// Import languages you need
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-jsx'

// Import a Prism theme of your choice
import 'prismjs/themes/prism-tomorrow.css'  // dark theme
// or 'prismjs/themes/prism.css'            // light theme
```

Or use CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/components/prism-javascript.min.js"></script>
<link href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.css" rel="stylesheet" />
```

## Quick Start (Vue 3 / Nuxt 3)

```vue
<template>
  <div class="app-container">
    <div class="chat">
      <!-- Render AI messages with artifact detection -->
      <ArtifactuseAgentMessage 
        v-for="(msg, index) in messages" 
        :key="msg.id"
        :content="msg.content"
        :message-id="msg.id"
        :is-last-message="index === messages.length - 1"
        @form-submit="handleFormSubmit"
        @social-copy="handleSocialCopy"
      />
      
      <!-- Toggle button with badge -->
      <ArtifactusePanelToggle />
    </div>
    
    <!-- Artifact panel (side panel for previews) -->
    <ArtifactusePanel @ai-request="handleAIRequest" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { 
  ArtifactuseAgentMessage, 
  ArtifactusePanel, 
  ArtifactusePanelToggle,
  provideArtifactuse 
} from 'artifactuse/vue';
import 'artifactuse/styles';

// Initialize Artifactuse
provideArtifactuse({
  theme: 'dark',
});

const messages = ref([]);

// Handle form submissions from inline forms
function handleFormSubmit({ formId, values }) {
  console.log('Form submitted:', formId, values);
}

// Handle social preview copy
function handleSocialCopy({ platform, text }) {
  console.log('Copied:', platform, text);
}

// Handle AI requests from panel artifacts
async function handleAIRequest({ prompt, context }) {
  const response = await yourAI.chat(prompt);
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
}

.app-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.chat {
  flex: 1;
  padding: 20px;
  min-width: 0;
  overflow-y: auto;
}
</style>
```

## Quick Start (Vue 2.7 / Nuxt 2)

```vue
<template>
  <div class="app-container">
    <div class="chat">
      <ArtifactuseAgentMessage 
        v-for="(msg, index) in messages" 
        :key="msg.id"
        :content="msg.content"
        :message-id="msg.id"
        :is-last-message="index === messages.length - 1"
        @form-submit="handleFormSubmit"
        @social-copy="handleSocialCopy"
      />
      
      <ArtifactusePanelToggle />
    </div>
    
    <ArtifactusePanel @ai-request="handleAIRequest" />
    
    <!-- Required: Portal target for fullscreen/mobile -->
    <portal-target name="artifactuse" />
  </div>
</template>

<script>
import { 
  ArtifactuseAgentMessage, 
  ArtifactusePanel, 
  ArtifactusePanelToggle,
  provideArtifactuse 
} from 'artifactuse/vue2';
import 'artifactuse/styles';

export default {
  components: {
    ArtifactuseAgentMessage,
    ArtifactusePanel,
    ArtifactusePanelToggle,
  },
  setup() {
    provideArtifactuse({
      theme: 'dark',
    });
    
    // ... your setup code
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
}

.app-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.chat {
  flex: 1;
  padding: 20px;
  min-width: 0;
  overflow-y: auto;
}
</style>
```

### Vue 2.6 + @vue/composition-api

If you're using Vue 2.6 with `@vue/composition-api` or `@nuxtjs/composition-api`, add this alias to your build config:

**Nuxt 2:**

```js
// nuxt.config.js
export default {
  build: {
    extend(config) {
      config.resolve.alias['vue'] = '@vue/composition-api';
    }
  }
}
```

**Webpack:**

```js
// webpack.config.js
module.exports = {
  resolve: {
    alias: {
      'vue': '@vue/composition-api'
    }
  }
}
```

**Vue CLI:**

```js
// vue.config.js
module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        'vue': '@vue/composition-api'
      }
    }
  }
}
```

> **Note:** Vue 2.7+ has the Composition API built-in and works without any alias configuration.

## Quick Start (React / Next.js)

```jsx
import { useState } from 'react';
import { 
  ArtifactuseProvider,
  ArtifactuseAgentMessage, 
  ArtifactusePanel, 
  ArtifactusePanelToggle 
} from 'artifactuse/react';
import 'artifactuse/styles';
import './styles.css';

function App() {
  return (
    <ArtifactuseProvider config={{ theme: 'dark' }}>
      <Chat />
    </ArtifactuseProvider>
  );
}

function Chat() {
  const [messages, setMessages] = useState([]);
  
  return (
    <div className="app-container">
      <div className="chat">
        {messages.map((msg, index) => (
          <ArtifactuseAgentMessage 
            key={msg.id}
            content={msg.content}
            messageId={msg.id}
            isLastMessage={index === messages.length - 1}
            onFormSubmit={handleFormSubmit}
            onSocialCopy={handleSocialCopy}
          />
        ))}
        
        <ArtifactusePanelToggle />
      </div>
      
      <ArtifactusePanel onAIRequest={handleAIRequest} />
    </div>
  );
}
```

```css
/* styles.css */
html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.chat {
  flex: 1;
  padding: 20px;
  min-width: 0;
  overflow-y: auto;
}
```

## Quick Start (Svelte / SvelteKit)

```svelte
<!-- +layout.svelte -->
<script>
  import { setArtifactuseContext } from 'artifactuse/svelte';
  import 'artifactuse/styles';
  
  setArtifactuseContext({ theme: 'dark' });
</script>

<slot />
```

```svelte
<!-- +page.svelte -->
<script>
  import { 
    ArtifactuseAgentMessage, 
    ArtifactusePanel, 
    ArtifactusePanelToggle 
  } from 'artifactuse/svelte';
  
  let messages = [];
  
  function handleFormSubmit(event) {
    const { formId, values } = event.detail;
    console.log('Form submitted:', formId, values);
  }
</script>

<div class="app-container">
  <div class="chat">
    {#each messages as msg, index (msg.id)}
      <ArtifactuseAgentMessage 
        content={msg.content}
        messageId={msg.id}
        isLastMessage={index === messages.length - 1}
        on:form-submit={handleFormSubmit}
      />
    {/each}
    
    <ArtifactusePanelToggle />
  </div>
  
  <ArtifactusePanel on:ai-request={handleAIRequest} />
</div>

<style>
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }
  
  .app-container {
    display: flex;
    height: 100%;
    overflow: hidden;
  }
  
  .chat {
    flex: 1;
    padding: 20px;
    min-width: 0;
    overflow-y: auto;
  }
</style>
```

## Artifacts

### What are Artifacts?

Artifacts are structured content blocks detected in AI responses. They can be:

- **Explicit** - JSON blocks with `type` field (forms, social previews)
- **Implicit** - Auto-detected from content (code blocks, images, videos)

### Panel Artifacts

Panel artifacts open in a side panel with preview, code view, and editing capabilities.

- **Code** - JavaScript, TypeScript, Python, HTML, CSS, React, Vue, Svelte
- **HTML/React/Vue** - Live preview with code editing
- **Mermaid** - Diagrams with live preview
- **SVG** - SVG graphics with live preview and editing
- **Diff / Patch** - Code diffs with side-by-side or unified view (`diff`, `patch`, or `smartdiff` for structured JSON diffs)
- **Canvas / Whiteboard** - Interactive drawing canvas and whiteboard
- **Video Editor** - Timeline-based video editing interface
- **Forms (Panel)** - Complex forms with wizard variant, file uploads, or 4+ fields

#### Inline Code Preview (Optional)

By default, extracted code blocks render as compact artifact cards. With `inlinePreview` enabled, they show a **truncated syntax-highlighted preview** (first N lines) directly in the message. Click the preview to open the full artifact in the panel.

- Configurable per language — unlisted languages still render as cards
- Requires [Prism.js](https://prismjs.com/) for syntax highlighting (see [Syntax Highlighting](#syntax-highlighting))
- `smartdiff` artifacts use the actual language for full syntax highlighting with deleted/inserted backgrounds
- Truncated previews show a fade gradient with "View full code (N lines)" label

```js
provideArtifactuse({
  inlinePreview: {
    maxLines: 15,
    languages: ['smartdiff', 'html', 'javascript'],
  },
});
```

### Inline Artifacts

Inline artifacts render directly within the message.

#### Forms (Inline)

Simple forms render inline. Set `display: "inline"` or use buttons variant with few simple fields.

```json
{
  "type": "form",
  "variant": "fields",
  "display": "inline",
  "title": "Contact Us",
  "data": {
    "fields": [
      { "name": "name", "type": "text", "label": "Name", "required": true },
      { "name": "email", "type": "email", "label": "Email" }
    ]
  }
}
```

**Variants:** `fields`, `wizard`, `buttons`

**Form Collapse Behavior:** Inline forms automatically collapse after user interaction (submit, cancel, or custom button click) to keep the chat clean. After page refresh, only the last message's forms remain active.

#### Social Previews

Platform-accurate social media post previews:

```json
{
  "type": "social",
  "platform": "twitter",
  "data": {
    "author": {
      "name": "Acme Corp",
      "handle": "@acmecorp",
      "verified": true
    },
    "content": {
      "text": "Excited to announce our new product! 🚀",
      "media": [{ "type": "image", "url": "https://..." }]
    },
    "engagement": {
      "likes": 1200,
      "retweets": 340
    }
  }
}
```

**Platforms:** Twitter/X, LinkedIn, Instagram, Facebook, Threads, TikTok, YouTube

#### Media & Embeds

| Type | Supported |
|------|-----------|
| **Images** | jpg, jpeg, png, gif, webp, svg, bmp, ico, avif |
| **Videos** | YouTube, Vimeo, Loom, Wistia, Dailymotion, MP4, WebM, MOV |
| **Audio** | Spotify, SoundCloud, Apple Music, MP3, WAV, OGG |
| **Maps** | Google Maps, OpenStreetMap |
| **Documents** | PDF, Google Docs/Sheets/Slides, Microsoft Office |
| **Code Platforms** | CodePen, CodeSandbox, JSFiddle, Replit, StackBlitz |
| **Design & 3D** | Figma, Sketchfab |
| **Interactive** | Typeform, Calendly, Airtable, Miro, Notion |
| **Data Viz** | Flourish, Datawrapper, Tableau Public |

## Composable / Hooks

```js
// Vue 3
import { useArtifactuse } from 'artifactuse/vue';

// Vue 2
import { useArtifactuse } from 'artifactuse/vue2';

// React
import { useArtifactuse } from 'artifactuse/react';

// Svelte
import { getArtifactuseContext } from 'artifactuse/svelte';

const {
  state,              // Reactive state
  activeArtifact,     // Currently open artifact
  artifactCount,      // Number of artifacts
  hasArtifacts,       // Boolean
  
  // Panel state
  panelTypes,         // List of registered panel types
  activePanelUrl,     // URL for active artifact's panel
  
  processMessage,     // Process AI content
  openArtifact,       // Open artifact in panel
  closePanel,         // Close panel
  togglePanel,        // Toggle panel visibility
  toggleFullscreen,   // Toggle fullscreen mode
  setViewMode,        // Set 'preview' | 'code' | 'split' | 'edit'
  getPanelUrl,        // Get panel URL for artifact

  // Programmatic API
  openFile,           // Open file in panel (auto-detect language from extension)
  openCode,           // Open code in panel (explicit language)
  updateFile,          // Update existing artifact's code and refresh panel
  clearArtifacts,     // Clear all artifacts

  // Panel management
  hasPanel,           // Check if panel exists for artifact
  registerPanel,      // Register panel (string or string[])
  unregisterPanel,    // Disable panel (string or string[])
  getPanelTypes,      // Get all panel types
  
  // Theme
  getTheme,           // Get current theme
  setTheme,           // Set theme
  
  on,                 // Subscribe to events
  off,                // Unsubscribe
} = useArtifactuse();
```

## Configuration

```js
provideArtifactuse({
  // CDN URL for panel artifacts
  // Defaults to https://cdn.artifactuse.com
  // Set this only if self-hosting panels
  cdnUrl: 'https://cdn.artifactuse.com',
  
  // Theme: 'dark' | 'light' | 'auto'
  theme: 'auto',
  
  // Custom colors - hex or RGB format both work
  colors: {
    primary: '#6366f1',       // hex format
    background: '#111827',
    surface: '31, 41, 55',    // RGB format also works
    text: '#f3f4f6',
  },
  
  // Show "Powered by Artifactuse" branding in panel footer
  // Set to false to hide (requires paid license)
  branding: true,
  
  // Enable/disable processors
  processors: {
    codeBlocks: true,
    images: true,
    videos: true,
    audio: true,
    maps: true,
    social: true,
    documents: true,
    tables: true,
    math: true,
  },
  
  // Code extraction settings
  codeExtraction: {
    minLines: 3,
    minLength: 50,
  },

  // Inline preview: show truncated code inline instead of artifact cards (optional)
  // Default: null (disabled — all extracted code shows as cards)
  inlinePreview: {
    maxLines: 15,                                        // max lines before truncation
    languages: ['smartdiff', 'html', 'javascript', 'jsx'], // or true for all extracted languages
  },

  // Code Editor (Optional) — CodeMirror 6 for the edit tab
  // Requires: @codemirror/state, @codemirror/view, @codemirror/commands,
  //           @codemirror/language, @codemirror/autocomplete
  // Optional: language packages and @lezer/highlight (for syntax highlighting)
  editor: {
    modules: {
      // Required
      state: cmState,                       // @codemirror/state
      view: cmView,                         // @codemirror/view
      commands: cmCommands,                 // @codemirror/commands
      language: cmLanguage,                 // @codemirror/language
      autocomplete: cmAutocomplete,         // @codemirror/autocomplete
      // Syntax highlighting (optional)
      lezerHighlight: lezerHighlight,       // @lezer/highlight
      // Language packages (all optional — add only what you need)
      langJavascript: cmLangJavascript,     // @codemirror/lang-javascript (js/jsx/ts/tsx)
      langPython: cmLangPython,             // @codemirror/lang-python
      langHtml: cmLangHtml,                 // @codemirror/lang-html
      langCss: cmLangCss,                   // @codemirror/lang-css
      langJson: cmLangJson,                 // @codemirror/lang-json
      langMarkdown: cmLangMarkdown,         // @codemirror/lang-markdown
      langXml: cmLangXml,                   // @codemirror/lang-xml
      langYaml: cmLangYaml,                 // @codemirror/lang-yaml
      langSql: cmLangSql,                   // @codemirror/lang-sql
      langJava: cmLangJava,                 // @codemirror/lang-java
      langCpp: cmLangCpp,                   // @codemirror/lang-cpp (c/c++)
      langGo: cmLangGo,                     // @codemirror/lang-go
      langRust: cmLangRust,                 // @codemirror/lang-rust
      langPhp: cmLangPhp,                   // @codemirror/lang-php
      langVue: cmLangVue,                   // @codemirror/lang-vue
      langAngular: cmLangAngular,           // @codemirror/lang-angular
      langLess: cmLangLess,                 // @codemirror/lang-less
      langSass: cmLangSass,                 // @codemirror/lang-sass (sass/scss)
    },
    theme: 'dark', // 'dark' | 'light' | 'auto'
  },
});
```

## Panels

The SDK supports configurable panels that can be added, overridden, or disabled without updating the SDK.

```js
provideArtifactuse({
  panels: {
    // Add new panel type
    'chart': 'chart-panel',
    
    // Use a different CDN for specific panel
    'video': 'https://my-video-cdn.com/editor-panel',
    
    // Disable a built-in panel
    'canvas': null,
  }
});

// Runtime registration with aliases
const { registerPanel, unregisterPanel } = useArtifactuse();

registerPanel(['python', 'py'], 'code-panel');
registerPanel(['typescript', 'ts', 'tsx'], 'code-panel');
unregisterPanel(['canvas', 'whiteboard', 'drawing']);
```

For full documentation on panel configuration, runtime management, and examples, see **[PANELS.md](./PANELS.md)**.

## Events

```js
const { on } = useArtifactuse();

// AI assistance requested from panel
on('ai:request', async ({ prompt, context, requestId }) => {
  const response = await yourAI.chat(prompt);
});

// Save requested
on('save:request', async ({ artifactId, data }) => {
  await saveToCloud(artifactId, data);
});

// Export completed
on('export:complete', ({ artifactId, blob, filename }) => {
  // Download or upload the exported file
});

// Form events
on('form:submit', ({ formId, action, values }) => {
  console.log('Form submitted:', values);
});

on('form:cancel', ({ formId }) => {
  console.log('Form cancelled');
});

on('form:button-click', ({ formId, action, buttonName, values }) => {
  console.log('Custom button clicked:', action, buttonName);
});

// Social events
on('social:copy', ({ platform, text }) => {
  console.log('Copied from:', platform);
});

// Media events
on('media:open', ({ type, src, alt, caption }) => {
  console.log('Media opened:', type, src);
});

// Code editor saved (edit tab)
on('edit:save', ({ artifactId, artifact, code }) => {
  console.log('Code saved:', code);
});
```

## Programmatic API

Open artifacts directly without processing AI message content:

### openFile

Opens a file in the panel, auto-detecting the language from the file extension:

```js
const { openFile } = useArtifactuse();

// Basic usage
openFile('app.jsx', code);

// With options
openFile('utils.py', code, {
  title: 'My Utils',           // Custom display title (defaults to filename)
  tabs: ['code', 'edit'],       // Control which tabs are visible
  viewMode: 'code',             // Initial view mode
});
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | `string` | Yes | Filename with extension (e.g. `'app.jsx'`, `'style.css'`) |
| `code` | `string` | Yes | The file content |
| `options.title` | `string` | No | Custom title (defaults to filename) |
| `options.tabs` | `string[]` | No | Visible tabs: `'preview'`, `'code'`, `'split'`, `'edit'` |
| `options.viewMode` | `string` | No | Initial view mode |
| `options.language` | `string` | No | Override auto-detected language |
| `options.panelUrl` | `string` | No | Custom iframe URL (bypasses panel registry) |

### openCode

Opens code in the panel with an explicit language:

```js
const { openCode } = useArtifactuse();

openCode('console.log("hello")', 'javascript');
openCode(pythonCode, 'python', { title: 'My Script', tabs: ['code', 'edit'] });
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | `string` | Yes | The code content |
| `language` | `string` | Yes | Language identifier (e.g. `'javascript'`, `'python'`, `'html'`) |
| `options` | `object` | No | Same options as `openFile` |

> **Note:** If the language has no registered panel, it falls back to `txt` (plain text) in the code panel.

### updateFile

Updates an existing artifact's code in place and refreshes the panel (no duplicate tabs):

```js
const { openFile, updateFile } = useArtifactuse();

// First open — returns artifact reference
const artifact = openFile('app.html', code, { panelUrl: '...' });

// Later — update in place, refreshes iframe
updateFile(artifact, newCode);
updateFile(artifact.id, newCode, { panelUrl: newUrl });
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `artifact` | `object\|string` | Yes | Artifact object (from `openFile`) or artifact ID string |
| `code` | `string` | Yes | New code content |
| `options.title` | `string` | No | Update display title |
| `options.tabs` | `string[]` | No | Update visible tabs |
| `options.panelUrl` | `string` | No | Update custom iframe URL |

> **Note:** `updateFile` triggers the `artifact:updated` event with `{ artifactId, artifact }`.

### clearArtifacts

Removes all artifacts and closes the panel:

```js
const { clearArtifacts } = useArtifactuse();

clearArtifacts();
```

## Framework Support

| Framework | Import Path | Status |
|-----------|-------------|--------|
| Vue 3 | `artifactuse/vue` | ✅ |
| Vue 2.7+ | `artifactuse/vue2` | ✅ |
| Vue 2.6 | `artifactuse/vue2` | ✅ (requires alias) |
| Nuxt 3 | `artifactuse/vue` | ✅ |
| Nuxt 2 | `artifactuse/vue2` | ✅ |
| React 18+ | `artifactuse/react` | ✅ |
| Next.js | `artifactuse/react` | ✅ |
| Svelte 4/5 | `artifactuse/svelte` | ✅ |
| SvelteKit | `artifactuse/svelte` | ✅ |

## Theming

```js
const { setTheme } = useArtifactuse();

setTheme('dark');
setTheme('light');
setTheme('auto'); // Follow system preference
```

Or use CSS variables:

```css
:root {
  --artifactuse-primary: 99, 102, 241;
  --artifactuse-background: 17, 24, 39;
  --artifactuse-surface: 31, 41, 55;
  --artifactuse-text: 243, 244, 246;
}
```

### Modular CSS Imports

Import all styles:

```js
import 'artifactuse/styles';
```

Or import only what you need:

```js
// Base (required)
import 'artifactuse/styles/base/variables.css';
import 'artifactuse/styles/base/reset.css';

// Components (pick what you use)
import 'artifactuse/styles/components/message.css';
import 'artifactuse/styles/components/panel.css';
import 'artifactuse/styles/components/card.css';
import 'artifactuse/styles/components/viewer.css';
import 'artifactuse/styles/components/form.css';
import 'artifactuse/styles/components/social.css';
import 'artifactuse/styles/components/toggle.css';

// Processors (pick what you use)
import 'artifactuse/styles/processors/image.css';
import 'artifactuse/styles/processors/video.css';
import 'artifactuse/styles/processors/audio.css';
import 'artifactuse/styles/processors/code.css';
import 'artifactuse/styles/processors/table.css';
import 'artifactuse/styles/processors/math.css';
import 'artifactuse/styles/processors/embed.css';

// Utilities
import 'artifactuse/styles/utilities/animations.css';
import 'artifactuse/styles/utilities/responsive.css';
```

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

### Architecture

Artifactuse uses a modular processor pipeline:

```
AI Content → Markdown Parser → Processors → Rendered HTML
                                   ↓
                              Detector → Artifacts
```

**Key modules:**

- `src/core/processors/` - Content processors (images, videos, audio, social, etc.)
- `src/core/detector.js` - Artifact detection and creation
- `src/core/state.js` - Reactive state management
- `src/styles/` - Modular CSS (base, components, processors, utilities)
- `src/vue/`, `src/vue2/`, `src/react/`, `src/svelte/` - Framework components

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## License

MIT © [Artifactuse](https://artifactuse.com). Crafted with ❤️ by the [BoostGPT Team](https://boostgpt.co).

---

**[Documentation](https://artifactuse.com/docs)** · **[Examples](https://artifactuse.com/docs/examples)** · **[Contributing](./CONTRIBUTING.md)**