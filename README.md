# Artifactuse

**The Artifact SDK for AI Agents** - Turn AI outputs into interactive experiences.

Artifactuse is a lightweight SDK that transforms AI-generated content into rich, interactive artifacts. Support for code previews, video editors, canvas/whiteboards, forms, social media previews, and more.

## Features

- 🎨 **Rich Content Detection** - Automatically detect and render code blocks, images, videos, maps, embeds, and more
- 📦 **Artifact Cards** - Beautiful inline cards for code artifacts
- 🖼️ **Media Lightbox** - Click images and PDFs to view fullscreen with zoom and download
- 🖥️ **Panel Viewer** - Side panel with preview, code view, and split mode
- 📝 **Interactive Forms** - Inline and panel forms with 17+ field types
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
        v-for="msg in messages" 
        :key="msg.id"
        :content="msg.content"
        :message-id="msg.id"
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
        v-for="msg in messages" 
        :key="msg.id"
        :content="msg.content"
        :message-id="msg.id"
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
        {messages.map(msg => (
          <ArtifactuseAgentMessage 
            key={msg.id}
            content={msg.content}
            messageId={msg.id}
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

<style>
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }
</style>
```

```svelte
<!-- Chat.svelte -->
<script>
  import { 
    ArtifactuseAgentMessage, 
    ArtifactusePanel, 
    ArtifactusePanelToggle 
  } from 'artifactuse/svelte';
</script>

<div class="app-container">
  <div class="chat">
    {#each messages as msg (msg.id)}
      <ArtifactuseAgentMessage 
        content={msg.content}
        messageId={msg.id}
        on:formSubmit={handleFormSubmit}
        on:socialCopy={handleSocialCopy}
      />
    {/each}
    
    <ArtifactusePanelToggle />
  </div>
  
  <ArtifactusePanel on:aiRequest={handleAIRequest} />
</div>

<style>
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

## Components

### `<ArtifactuseAgentMessage>`

Renders AI agent messages with automatic artifact detection. Inline artifacts (simple forms, social previews) are rendered directly in the message. Panel artifacts (code, complex forms) show as clickable cards. Images and PDFs automatically open in a lightbox viewer when clicked.

```vue
<ArtifactuseAgentMessage
  :content="message.content"
  :message-id="message.id"
  :typing="isStreaming"
  @artifact-detected="onDetected"
  @artifact-open="onOpen"
  @form-submit="onFormSubmit"
  @form-cancel="onFormCancel"
  @social-copy="onSocialCopy"
  @media-open="onMediaOpen"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | string | required | The raw message content from AI |
| `messageId` | string | auto | Unique identifier for the message |
| `inlineCards` | boolean | `true` | Show artifact cards inline |
| `typing` | boolean | `false` | Whether message is still streaming |

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `artifact-detected` | `artifacts[]` | Emitted when artifacts are found |
| `artifact-open` | `artifact` | Emitted when user opens an artifact |
| `form-submit` | `{ formId, values }` | Emitted when inline form is submitted |
| `form-cancel` | `{ formId }` | Emitted when inline form is cancelled |
| `social-copy` | `{ platform, text }` | Emitted when social preview text is copied |
| `media-open` | `{ type, src, alt, caption }` | Emitted when image/PDF is opened in viewer |

### `<ArtifactuseViewer>`

Fullscreen lightbox viewer for images and PDFs. Automatically integrated with `ArtifactuseAgentMessage` - you don't need to add this component manually unless you want standalone usage.

```vue
<ArtifactuseViewer
  :is-open="viewerOpen"
  :type="viewerType"
  :src="viewerSrc"
  :alt="viewerAlt"
  :caption="viewerCaption"
  @close="viewerOpen = false"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | `false` | Whether viewer is open |
| `type` | string | `'image'` | Content type: `'image'` or `'pdf'` |
| `src` | string | `''` | Media URL |
| `alt` | string | `''` | Alt text for images |
| `caption` | string | `''` | Caption displayed below media |

**Events:**

| Event | Description |
|-------|-------------|
| `close` | Emitted when viewer is closed (click overlay, Escape key, or close button) |

**Features:**

- Zoom toggle for images (click image or zoom button)
- Download button
- Keyboard support (Escape to close)
- Click outside to close
- Body scroll lock when open

### `<ArtifactusePanel>`

Side panel for viewing artifact previews and code.

```vue
<ArtifactusePanel
  @ai-request="handleAIRequest"
  @save="handleSave"
  @export="handleExport"
  @form-submit="handleFormSubmit"
/>
```

### `<ArtifactusePanelToggle>`

Toggle button with artifact count badge.

```vue
<ArtifactusePanelToggle />
```

## Artifact Types

Artifactuse automatically detects and renders various artifact types from AI responses.

### Code Artifacts (Panel)

Code artifacts open in the side panel with syntax highlighting and live preview.

- **HTML** - HTML documents with live preview
- **JSX / React** - React components with live preview and hot reload
- **Vue** - Vue single-file components with live preview
- **JavaScript** - JavaScript code with syntax highlighting and execution
- **Python** - Python code with syntax highlighting
- **JSON** - JSON data with tree viewer and formatting
- **SVG** - SVG graphics with live preview and editing
- **Diff / Patch** - Code diffs with side-by-side or unified view
- **Canvas / Whiteboard** - Interactive drawing canvas and whiteboard
- **Video Editor** - Timeline-based video editing interface
- **Forms (Panel)** - Complex forms with wizard variant, file uploads, or 4+ fields

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
  
  processMessage,     // Process AI content
  openArtifact,       // Open artifact in panel
  closePanel,         // Close panel
  togglePanel,        // Toggle panel visibility
  toggleFullscreen,   // Toggle fullscreen mode
  setViewMode,        // Set 'preview' | 'code' | 'split'
  getPanelUrl,        // Get panel URL for artifact
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
});
```

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

// Social events
on('social:copy', ({ platform, text }) => {
  console.log('Copied from:', platform);
});

// Media events
on('media:open', ({ type, src, alt, caption }) => {
  console.log('Media opened:', type, src);
});
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