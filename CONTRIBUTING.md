# Contributing to Artifactuse

Thank you for your interest in contributing to Artifactuse! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Creating Custom Processors](#creating-custom-processors)
- [Adding New Artifact Types](#adding-new-artifact-types)
- [Framework Components](#framework-components)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/artifactuse.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
# Vue 3 playground (default)
npm run dev

# Or specific frameworks
npm run dev:vue3
npm run dev:vue2
npm run dev:react
npm run dev:svelte
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Project Structure

```
artifactuse/
├── src/
│   ├── index.js                # Main entry point
│   │
│   ├── core/                   # Core SDK functionality
│   │   ├── index.js            # Core exports
│   │   ├── bridge.js           # Framework bridge
│   │   ├── detector.js         # Artifact detection
│   │   ├── highlight.js        # Syntax highlighting
│   │   ├── state.js            # State management
│   │   ├── theme.js            # Theme management
│   │   │
│   │   └── processors/         # Content processors
│   │       ├── index.js        # Processor pipeline
│   │       ├── image.js        # Image processing & galleries
│   │       ├── video.js        # Video embeds (YouTube, Vimeo, etc.)
│   │       ├── audio.js        # Audio embeds (Spotify, SoundCloud, etc.)
│   │       ├── social.js       # Social media previews
│   │       ├── table.js        # Table enhancement
│   │       ├── math.js         # LaTeX/math rendering
│   │       ├── mermaid.js      # Mermaid diagram rendering
│   │       ├── map.js          # Map embeds (Google Maps, OSM)
│   │       ├── document.js     # Document embeds (PDF, Office)
│   │       ├── codeEmbed.js    # Code platform embeds (CodePen, etc.)
│   │       ├── design.js       # Design embeds (Figma, Sketchfab)
│   │       ├── interactive.js  # Interactive embeds (Typeform, etc.)
│   │       └── dataViz.js      # Data visualization embeds
│   │
│   ├── vue/                    # Vue 3 components
│   │   ├── index.js
│   │   ├── ArtifactuseAgentMessage.vue
│   │   ├── ArtifactusePanel.vue
│   │   ├── ArtifactuseCard.vue
│   │   ├── ArtifactuseViewer.vue
│   │   ├── ArtifactuseInlineForm.vue
│   │   ├── ArtifactuseSocialPreview.vue
│   │   └── ...
│   │
│   ├── vue2/                   # Vue 2 components
│   │   └── ...
│   │
│   ├── react/                  # React components
│   │   └── ...
│   │
│   ├── svelte/                 # Svelte components
│   │   └── ...
│   │
│   └── styles/                 # Modular CSS
│       ├── artifactuse.css     # Main entry (imports all)
│       │
│       ├── base/               # Foundation styles
│       │   ├── variables.css   # CSS variables, theme colors
│       │   └── reset.css       # Base resets, utilities
│       │
│       ├── components/         # UI component styles
│       │   ├── message.css     # ArtifactuseAgentMessage
│       │   ├── panel.css       # ArtifactusePanel
│       │   ├── card.css        # ArtifactuseCard
│       │   ├── toggle.css      # ArtifactusePanelToggle
│       │   ├── viewer.css      # ArtifactuseViewer
│       │   ├── form.css        # ArtifactuseInlineForm
│       │   └── social.css      # ArtifactuseSocialPreview
│       │
│       ├── processors/         # Processor-specific styles
│       │   ├── image.css       # Image containers, galleries
│       │   ├── video.css       # Video embeds, facades
│       │   ├── audio.css       # Audio players, embeds
│       │   ├── code.css        # Code blocks, embeds
│       │   ├── table.css       # Enhanced tables
│       │   ├── math.css        # Math/Mermaid rendering
│       │   └── embed.css       # Maps, docs, interactive
│       │
│       └── utilities/          # Utility styles
│           ├── animations.css  # Keyframes, transitions
│           └── responsive.css  # Media queries, print
│
├── playground/                 # Development playgrounds
│   ├── vue3/
│   ├── vue2/
│   ├── react/
│   └── svelte/
│
├── scripts/                    # Build scripts
│
├── dist/                       # Built output
├── vite.config.js              # Vite configuration
├── rollup.config.vue2.js       # Vue 2 build config
├── tsconfig.json               # TypeScript configuration
├── package.json
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

## Architecture

### Processing Pipeline

Artifactuse processes AI content through a modular pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Response Content                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Markdown Parser                           │
│                    (marked.js)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Processor Pipeline                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Code   │ │ Images  │ │ Videos  │ │ Social  │ → ...     │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Detector                               │
│            (Extract artifacts from processed HTML)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Output                                │
│         { html: "...", artifacts: [...] }                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

**Processors** transform specific content types in the HTML. Each processor:
- Receives HTML string
- Finds and transforms matching content
- Returns modified HTML

**Detector** extracts structured artifact data from processed HTML:
- Scans for artifact markers/patterns
- Creates artifact objects with metadata
- Returns artifacts array for state management

**State** manages artifacts, active panel, theme, etc.:
- Reactive state shared across components
- Event emission for cross-component communication

**Key Modules:**

| Module | Path | Description |
|--------|------|-------------|
| Processors | `src/core/processors/` | Content processors (images, videos, audio, social, etc.) |
| Detector | `src/core/detector.js` | Artifact detection and creation |
| State | `src/core/state.js` | Reactive state management |
| Theme | `src/core/theme.js` | Theme management |
| Highlight | `src/core/highlight.js` | Syntax highlighting |
| Bridge | `src/core/bridge.js` | Framework bridge utilities |
| Styles | `src/styles/` | Modular CSS (base, components, processors, utilities) |
| Vue 3 | `src/vue/` | Vue 3 components |
| Vue 2 | `src/vue2/` | Vue 2 components |
| React | `src/react/` | React components |
| Svelte | `src/svelte/` | Svelte components |

## Creating Custom Processors

Processors are functions that transform HTML content. Here's how to create one:

### Basic Processor Structure

```js
// src/core/processors/custom.js

/**
 * Process custom content in HTML
 * @param {string} html - Input HTML
 * @returns {string} - Transformed HTML
 */
export function processCustom(html) {
  // Protect content that shouldn't be processed
  const protectedContent = [];
  
  // Protect <pre> blocks
  html = html.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
    const placeholder = `__CUSTOM_PROTECTED_${protectedContent.length}__`;
    protectedContent.push(match);
    return placeholder;
  });
  
  // Your transformation logic
  const customRegex = /your-pattern-here/gi;
  html = html.replace(customRegex, (match, ...groups) => {
    return renderCustomHtml(match, groups);
  });
  
  // Restore protected content
  for (let i = protectedContent.length - 1; i >= 0; i--) {
    html = html.replace(`__CUSTOM_PROTECTED_${i}__`, protectedContent[i]);
  }
  
  return html;
}

/**
 * Render HTML for custom content
 */
function renderCustomHtml(content, data) {
  return `<div class="artifactuse-custom">
    ${content}
  </div>`;
}

export default {
  processCustom,
};
```

### Registering Your Processor

Add your processor to the pipeline in `src/core/processors/index.js`:

```js
import { processCustom } from './custom.js';

export function processContent(html, options = {}) {
  // ... existing processors
  
  if (options.processors?.custom !== false) {
    html = processCustom(html);
  }
  
  return html;
}
```

### Processor Best Practices

1. **Protect existing content** - Always protect `<pre>`, `<code>`, and already-processed elements
2. **Use specific selectors** - Avoid overly broad regex patterns
3. **Handle edge cases** - Empty content, malformed input, nested elements
4. **Add CSS classes** - Use `artifactuse-` prefix for styling
5. **Support theming** - Use CSS variables for colors
6. **Be idempotent** - Running twice should produce same result

## Adding New Artifact Types

### 1. Define the Artifact Structure

```js
// Example: Chart artifact
const chartArtifact = {
  id: 'artifact-chart-123',
  type: 'chart',
  title: 'Sales Data',
  language: 'json',
  code: JSON.stringify({ /* chart config */ }),
  isInline: false,
  messageId: 'msg-456',
  timestamp: Date.now(),
};
```

### 2. Update the Detector

In `src/core/detector.js`, add detection logic:

```js
export function detectArtifacts(html, messageId) {
  const artifacts = [];
  
  // ... existing detection
  
  // Detect chart artifacts
  const chartRegex = /```chart\n([\s\S]*?)```/g;
  let match;
  while ((match = chartRegex.exec(html)) !== null) {
    artifacts.push(createArtifact({
      type: 'chart',
      title: 'Chart',
      code: match[1],
      messageId,
    }));
  }
  
  return artifacts;
}
```

### 3. Create Panel Component (if needed)

For panel artifacts, create a viewer component:

```vue
<!-- src/vue/panels/ChartPanel.vue -->
<template>
  <div class="artifactuse-chart-panel">
    <!-- Chart rendering -->
  </div>
</template>
```

### 4. Add Styles

Add styles to the appropriate processor CSS file in `src/styles/processors/`:

```css
/* src/styles/processors/dataviz.css (or relevant file) */
.artifactuse-chart-panel {
  /* styles */
}
```

Or create a new file and import it in `src/styles/artifactuse.css`:

```css
/* src/styles/artifactuse.css */
@import './processors/chart.css';
```

## Framework Components

### Component Structure

Each framework has similar components with framework-specific syntax:

| Component | Vue 3 | Vue 2 | React | Svelte |
|-----------|-------|-------|-------|--------|
| Agent Message | `.vue` (setup) | `.vue` (setup) | `.jsx` | `.svelte` |
| Panel | `.vue` | `.vue` | `.jsx` | `.svelte` |
| Card | `.vue` | `.vue` | `.jsx` | `.svelte` |
| Viewer | `.vue` | `.vue` | `.jsx` | `.svelte` |
| Inline Form | `.vue` | `.vue` | `.jsx` | `.svelte` |
| Social Preview | `.vue` | `.vue` | `.jsx` | `.svelte` |

### Vue 2 Specifics

Vue 2 components use `setup(props, { emit })` with `@vue/composition-api`:

```vue
<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  name: 'MyComponent',
  props: { /* ... */ },
  setup(props, { emit }) {
    const myRef = ref(null);
    
    // ... logic
    
    return {
      myRef,
      // ... exposed values
    };
  },
};
</script>
```

### React Specifics

React components use hooks and JSX:

```jsx
import React, { useState, useEffect, useCallback } from 'react';

export default function MyComponent({ prop1, onEvent }) {
  const [state, setState] = useState(null);
  
  // ... logic
  
  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
}
```

### Svelte Specifics

Svelte components use reactive declarations:

```svelte
<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  
  export let prop1;
  
  const dispatch = createEventDispatcher();
  
  let localState = null;
  
  $: derivedValue = prop1 * 2;
</script>

<div class="my-component">
  <!-- template -->
</div>
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Writing Tests

```js
// src/core/processors/__tests__/image.test.js
import { describe, it, expect } from 'vitest';
import { processImages } from '../image.js';

describe('processImages', () => {
  it('should wrap image URLs in containers', () => {
    const input = '<p>Check this: https://example.com/photo.jpg</p>';
    const output = processImages(input);
    
    expect(output).toContain('artifactuse-image-container');
    expect(output).toContain('data-lightbox="true"');
  });
  
  it('should not process images in code blocks', () => {
    const input = '<pre><code>https://example.com/photo.jpg</code></pre>';
    const output = processImages(input);
    
    expect(output).toBe(input);
  });
});
```

## Pull Request Process

### Before Submitting

1. **Test your changes** - Run `npm test` and ensure all tests pass
2. **Lint your code** - Run `npm run lint` and fix any issues
3. **Update documentation** - Update README.md if adding features
4. **Add tests** - Include tests for new functionality

### PR Guidelines

1. **Branch naming**: `feature/description`, `fix/description`, `docs/description`
2. **Commit messages**: Use clear, descriptive messages
3. **PR description**: Explain what changes you made and why
4. **Keep PRs focused**: One feature/fix per PR

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test these changes?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Code Style

### General

- Use ES modules (`import`/`export`)
- Use `const` by default, `let` when reassignment needed
- Use template literals for string interpolation
- Use async/await for asynchronous code

### Naming Conventions

```js
// Functions: camelCase, verb prefix
function processImages(html) { }
function createArtifact(data) { }
function handleClick(event) { }

// Constants: UPPER_SNAKE_CASE
const IMAGE_EXTENSIONS = ['jpg', 'png', 'gif'];
const DEFAULT_THEME = 'dark';

// Classes: PascalCase
class Artifactuse { }

// CSS classes: kebab-case with prefix
.artifactuse-image-container { }
.artifactuse-panel-header { }
```

### CSS

CSS is organized into modular files:

- **`base/`** - Variables and resets (load first)
- **`components/`** - UI component styles (one file per component)
- **`processors/`** - Processor output styles (matches JS processors)
- **`utilities/`** - Animations and responsive rules (load last)

Use `artifactuse-` prefix for all classes and CSS variables for theming:

```css
/* Component */
.artifactuse-card { }

/* Element */
.artifactuse-card__header { }
.artifactuse-card__body { }

/* Modifier */
.artifactuse-card--active { }
.artifactuse-card--compact { }

/* Use CSS variables for colors */
.artifactuse-card {
  background: rgb(var(--artifactuse-surface));
  color: rgb(var(--artifactuse-text));
  border: 1px solid rgb(var(--artifactuse-border));
}
```

When adding new styles:
1. Add to the appropriate existing file, or
2. Create a new file and import it in `artifactuse.css`

### Comments

```js
/**
 * Process all image URLs in HTML
 * @param {string} html - Input HTML content
 * @returns {string} HTML with images wrapped in containers
 */
export function processImages(html) {
  // Protect content that shouldn't be processed
  // ...
}
```

## Questions?

- Open an issue for bugs or feature requests
- Join our Discord for community support
- Email support@artifactuse.com for other inquiries

Thank you for contributing! 🎉