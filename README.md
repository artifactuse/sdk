# Artifactuse

**The Artifact SDK for AI Agents** - Turn AI outputs into interactive experiences.

Artifactuse is a lightweight SDK that transforms AI-generated content into rich, interactive artifacts. Support for code previews, video editors, canvas/whiteboards, forms, social media previews, and more.

## Features

- 🎨 **Rich Content Detection** - Automatically detect and render code blocks, images, videos, maps, embeds, and more
- 📦 **Artifact Cards** - Beautiful inline cards for code artifacts
- 🖼️ **Panel Viewer** - Side panel with preview, code view, and split mode
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

## Quick Start (Vue 3 / Nuxt 3)

```vue
<template>
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
  </div>
  
  <!-- Artifact panel (side panel for previews) -->
  <ArtifactusePanel @ai-request="handleAIRequest" />
  
  <!-- Toggle button with badge -->
  <ArtifactusePanelToggle />
</template>

<script setup>
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
  cdnUrl: 'https://cdn.artifactuse.com',
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
```

## Components

### `<ArtifactuseAgentMessage>`

Renders AI agent messages with automatic artifact detection. Inline artifacts (simple forms, social previews) are rendered directly in the message. Panel artifacts (code, complex forms) show as clickable cards.

```vue
<ArtifactuseAgentMessage
  :content="message.content"
  :message-id="message.id"
  @artifact-detected="onDetected"
  @artifact-open="onOpen"
  @form-submit="onFormSubmit"
  @form-cancel="onFormCancel"
  @social-copy="onSocialCopy"
/>
```

**Props:**
- `content` (string, required) - The raw message content from AI
- `messageId` (string) - Unique identifier for the message
- `inlineCards` (boolean, default: true) - Show artifact cards inline

**Events:**
- `artifact-detected` - Emitted when artifacts are found
- `artifact-open` - Emitted when user opens an artifact
- `form-submit` - Emitted when inline form is submitted
- `form-cancel` - Emitted when inline form is cancelled
- `social-copy` - Emitted when social preview text is copied

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

#### HTML

HTML documents with live preview.

#### JSX / React

React components with live preview and hot reload.

#### Vue

Vue single-file components with live preview.

#### JavaScript

JavaScript code with syntax highlighting and execution.

#### Python

Python code with syntax highlighting.

#### JSON

JSON data with tree viewer and formatting.

#### SVG

SVG graphics with live preview and editing.

#### Diff / Patch

Code diffs with side-by-side or unified view.

#### Canvas / Whiteboard

Interactive drawing canvas and whiteboard.

#### Video Editor

Timeline-based video editing interface.

#### Forms (Panel)

Complex forms open in panel. Set `display: "panel"` or use wizard variant, file uploads, or 4+ fields.

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

**Features:** Platform-accurate styling, character counter, media preview, engagement stats, copy to clipboard

#### Images

Auto-detected image URLs and links:

- jpg, jpeg, png, gif, webp, svg, bmp, ico, avif

#### Videos

Video embeds and direct video files:

- YouTube, Vimeo, Loom, Wistia, Dailymotion
- MP4, WebM, MOV direct files

#### Audio

Audio embeds and direct audio files:

- Spotify, SoundCloud, Apple Music
- MP3, WAV, OGG direct files

#### Maps

Map embeds:

- Google Maps
- OpenStreetMap

#### Documents

Document embeds and previews:

- PDF files
- Google Docs, Sheets, Slides
- Microsoft Office (via Office Online)

#### Code Platforms

Live code embeds:

- CodePen
- CodeSandbox
- JSFiddle
- Replit
- StackBlitz

#### Design & 3D

Design tool embeds:

- Figma
- Sketchfab (3D models)

#### Interactive

Interactive embeds:

- Typeform
- Calendly
- Airtable
- Miro
- Notion

#### Data Visualization

Chart and data embeds:

- Flourish
- Datawrapper
- Tableau Public

## Architecture

```
AI Response → processMessage()
           ↓
    extractCodeBlockArtifacts()  ← Detects code, form, social
           ↓
    Returns { html, artifacts[] }
           ↓
    ArtifactuseAgentMessage renders:
           ↓
    ┌─────────────────────────────────────┐
    │ type: form + isInline    → <InlineForm>      │
    │ type: social             → <SocialPreview>   │
    │ type: code               → <Card> → Panel    │
    │ type: form + !isInline   → <Card> → Panel    │
    └─────────────────────────────────────┘
```

## Composable / Hooks

```js
// Vue 3
import { useArtifactuse } from 'artifactuse/vue';

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
on('ai:request', ({ prompt, context, requestId }) => {
  const response = await yourAI.chat(prompt);
});

// Save requested
on('save:request', ({ artifactId, data }) => {
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
```

## Quick Start (React / Next.js)

```jsx
import { 
  ArtifactuseProvider,
  ArtifactuseAgentMessage, 
  ArtifactusePanel, 
  ArtifactusePanelToggle,
  useArtifactuse 
} from 'artifactuse/react';
import 'artifactuse/styles';

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
      
      <ArtifactusePanel onAIRequest={handleAIRequest} />
      <ArtifactusePanelToggle />
    </div>
  );
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
<!-- Chat.svelte -->
<script>
  import { 
    ArtifactuseAgentMessage, 
    ArtifactusePanel, 
    ArtifactusePanelToggle 
  } from 'artifactuse/svelte';
</script>

{#each messages as msg (msg.id)}
  <ArtifactuseAgentMessage 
    content={msg.content}
    messageId={msg.id}
    on:formSubmit={handleFormSubmit}
    on:socialCopy={handleSocialCopy}
  />
{/each}

<ArtifactusePanel on:aiRequest={handleAIRequest} />
<ArtifactusePanelToggle />
```

## Framework Support

| Framework | Import Path | Status |
|-----------|-------------|--------|
| Vue 3 | `artifactuse/vue` | ✅ |
| Vue 2 | `artifactuse/vue2` | ✅ |
| Nuxt 3 | `artifactuse/vue` | ✅ |
| Nuxt 2 | `artifactuse/vue2` | ✅ |
| React | `artifactuse/react` | ✅ |
| Next.js | `artifactuse/react` | ✅ |
| Svelte | `artifactuse/svelte` | ✅ |
| SvelteKit | `artifactuse/svelte` | ✅ |

## Theming

```js
const { setTheme } = useArtifactuse();

setTheme('dark');
setTheme('light');
setTheme('auto'); // Follow system preference
```

Or use CSS variables (hex colors are auto-converted to RGB internally for `rgba()` support):

```css
:root {
  --artifactuse-primary: 99, 102, 241;
  --artifactuse-background: 17, 24, 39;
  --artifactuse-surface: 31, 41, 55;
  --artifactuse-text: 243, 244, 246;
}
```

**Supported color formats:**
```js
// All of these work:
colors: {
  primary: '#6366f1',      // 6-digit hex
  surface: '#1f2937',      // 6-digit hex
  text: '#fff',            // 3-digit shorthand
  border: '75, 85, 99',    // RGB string
}
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

## License

MIT © [Artifactuse](https://artifactuse.com). Crafted with ❤️ by the [BoostGPT Team](https://boostgpt.co).

---

**[Documentation](https://artifactuse.com/docs)** · **[Examples](https://artifactuse.com/docs/examples)** 