# Artifactuse SDK - Configurable Panels

This document covers the configurable panels feature, which allows you to add, override, or disable panel types without updating the SDK.

## Quick Start

### Vue

```vue
<script setup>
import { provideArtifactuse } from 'artifactuse/vue';

const { sdk, state } = provideArtifactuse({
  // Add/override panels
  panels: {
    'chart': 'chart-panel',
    'video': 'https://video-cdn.com/editor-panel',
    'canvas': null, // disable
  }
});
</script>
```

### React

```jsx
import { ArtifactuseProvider } from 'artifactuse/react';

function App() {
  return (
    <ArtifactuseProvider
      panels={{
        'chart': 'chart-panel',
        'video': 'https://video-cdn.com/editor-panel',
        'canvas': null,
      }}
    >
      <YourApp />
    </ArtifactuseProvider>
  );
}
```

### Vanilla JS

```javascript
import createArtifactuse from 'artifactuse';

const sdk = createArtifactuse({
  panels: {
    'chart': 'chart-panel',
    'video': 'https://video-cdn.com/editor-panel',
  }
});
```

## Panel Configuration

### Configuration Formats

```javascript
{
  panels: {
    // 1. Relative path (uses default cdnUrl)
    'type': 'panel-path',
    
    // 2. Full URL (different CDN)
    'type': 'https://custom-cdn.com/panel',
    
    // 3. Explicit CDN per panel
    'type': { path: 'panel-path', cdn: 'https://custom-cdn.com' },
    
    // 4. Disable a panel
    'type': null,
  }
}
```

### Default Panels

The SDK includes these built-in panels:

| Type/Language | Panel Path |
|--------------|------------|
| `form` | `form-panel` |
| `video`, `videoeditor`, `timeline` | `editor-panel/video` |
| `canvas`, `whiteboard`, `drawing` | `editor-panel/canvas` |
| `json` | `json-panel` |
| `svg` | `svg-panel` |
| `diff`, `patch` | `diff-panel` |
| `javascript`, `js`, `python`, `py` | `code-panel` |
| `jsx`, `react` | `react-panel` |
| `vue` | `vue-panel` |
| `html`, `htm`, `markdown`, `md` | `html-panel` |
| `mermaid` | `mermaid-panel` |

### Override Examples

```javascript
// Override the video panel to use a custom CDN
provideArtifactuse({
  panels: {
    'video': 'https://my-video-cdn.com/editor-panel/video'
  }
});

// Add support for a new artifact type
provideArtifactuse({
  panels: {
    'chart': 'chart-panel',
    'diagram': { path: 'diagram-panel', cdn: 'https://diagrams.example.com' }
  }
});

// Disable canvas panels entirely
provideArtifactuse({
  panels: {
    'canvas': null,
    'whiteboard': null,
    'drawing': null
  }
});
```

## Runtime Panel Management

You can register and unregister panels at runtime. Both methods support single types or arrays of types/aliases:

### Vue

```vue
<script setup>
import { useArtifactuse } from 'artifactuse/vue';

const { registerPanel, unregisterPanel, hasPanel, panelTypes } = useArtifactuse();

// Register a single type
registerPanel('chart', 'https://charts.example.com/panel');

// Register multiple types/aliases at once
registerPanel(['python', 'py'], 'code-panel');
registerPanel(['javascript', 'js', 'jsx'], 'code-panel');

// Check if panel exists
if (hasPanel({ type: 'chart' })) {
  console.log('Chart panel is available');
}

// Get all registered panel types
console.log(panelTypes.value); // ['form', 'video', 'chart', 'python', 'py', ...]

// Unregister single type
unregisterPanel('chart');

// Unregister multiple types at once
unregisterPanel(['canvas', 'whiteboard', 'drawing']);
</script>
```

### React

```jsx
import { usePanelRegistry } from 'artifactuse/react';

function PluginLoader() {
  const { register, unregister, isRegistered, types } = usePanelRegistry();
  
  useEffect(() => {
    // Register with aliases
    register(['python', 'py'], 'code-panel');
    
    // Cleanup on unmount
    return () => unregister(['python', 'py']);
  }, []);
  
  return <div>Panel types: {types.join(', ')}</div>;
}
```

### Vanilla JS

```javascript
const sdk = createArtifactuse({ /* config */ });

// Register with aliases
sdk.registerPanel(['python', 'py'], 'code-panel');
sdk.registerPanel(['typescript', 'ts'], 'code-panel');

// Check
if (sdk.hasPanel({ language: 'py' })) {
  const url = sdk.getPanelUrl({ language: 'py' });
}

// Unregister multiple
sdk.unregisterPanel(['canvas', 'whiteboard', 'drawing']);

// Get all types
const types = sdk.getPanelTypes();
```

## API Reference

### `provideArtifactuse(options)` / `createArtifactuse(options)`

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cdnUrl` | `string` | `'https://cdn.artifactuse.com'` | Base CDN URL for panels |
| `panels` | `object` | `{}` | Panel configuration (merged with defaults) |
| `theme` | `'dark' \| 'light' \| 'auto'` | `'auto'` | Theme setting |
| `colors` | `object` | `null` | Custom theme colors |
| `processors` | `object` | `{ ... }` | Enable/disable processors |
| `branding` | `boolean` | `true` | Show Artifactuse branding |

### Panel Methods

| Method | Description |
|--------|-------------|
| `hasPanel(artifact)` | Check if panel exists for artifact |
| `getPanelUrl(artifact, options?)` | Get panel URL for artifact |
| `registerPanel(types, panel)` | Register panel (accepts string or string[]) |
| `unregisterPanel(types)` | Disable panel (accepts string or string[]) |
| `getPanelTypes()` | Get list of registered panel types |

### Panel URL Options

```javascript
const url = sdk.getPanelUrl(artifact, {
  theme: 'dark',           // Override theme
  accent: '#6366f1',       // Accent color
  params: {                // Additional query params
    feature: 'enabled'
  }
});
```

## Full Example

```javascript
import createArtifactuse, { DEFAULT_PANELS } from 'artifactuse';

// Create SDK with custom configuration
const sdk = createArtifactuse({
  // Custom CDN
  cdnUrl: 'https://my-cdn.example.com',
  
  // Custom panels
  panels: {
    // Add new panel types
    'chart': 'chart-panel',
    'spreadsheet': 'spreadsheet-panel',
    
    // Override with different CDN
    'video': 'https://video-cdn.com/editor-panel/video',
    
    // Explicit configuration
    'diagram': { 
      path: 'diagram-panel', 
      cdn: 'https://diagrams.example.com' 
    },
    
    // Disable built-in panels
    'canvas': null,
  },
  
  // Theme
  theme: 'dark',
  colors: {
    primary: '#6366f1',
  },
});

// Register with aliases at runtime
sdk.registerPanel(['python', 'py'], 'code-panel');
sdk.registerPanel(['typescript', 'ts', 'tsx'], 'code-panel');

// Process a message
const { html, artifacts } = sdk.processMessage(content, 'msg-1');

// Check panel availability
artifacts.forEach(artifact => {
  if (sdk.hasPanel(artifact)) {
    console.log(`Panel URL: ${sdk.getPanelUrl(artifact)}`);
  }
});

// Disable multiple panel types at once
sdk.unregisterPanel(['whiteboard', 'drawing']);

// List all available panels
console.log('Available panels:', sdk.getPanelTypes());
// ['form', 'video', 'json', 'chart', 'spreadsheet', 'diagram', 'python', 'py', ...]
```

## Migration Guide

If you're upgrading from a version with hardcoded panels:

1. **No changes required** - The SDK is backward compatible
2. **To customize** - Add `panels` to your configuration
3. **To disable a panel** - Set it to `null` in your config

```javascript
// Before (hardcoded - still works)
const sdk = createArtifactuse({
  cdnUrl: 'https://cdn.artifactuse.com'
});

// After (with customization)
const sdk = createArtifactuse({
  cdnUrl: 'https://cdn.artifactuse.com',
  panels: {
    'my-type': 'my-panel'
  }
});
```