<script>
import {
  ArtifactuseAgentMessage,
  ArtifactusePanel,
  ArtifactusePanelToggle,
  provideArtifactuse
} from '../../src/vue2'
import { messages } from '../shared/mockMessages'

export default {
  components: {
    ArtifactuseAgentMessage,
    ArtifactusePanel,
    ArtifactusePanelToggle,
  },
  data() {
    return { messages }
  },
  created() {
    provideArtifactuse({ 
      theme: 'dark',
      panels: {
        // Add new panel type
        'form': 'http://localhost:5181/',
        // Override specific panel with different CDN
        'video': 'http://localhost:3001/video',
        // Disable a panel
        'canvas': 'http://localhost:3001/canvas',
        'diff': ' http://localhost:5176/',
        'html': 'http://localhost:5178/',
        'svg': 'http://localhost:5175/',
        'javascript': 'http://localhost:5177/',
        'python': 'http://localhost:5177/',
        'react': 'http://localhost:5179/',
        'vue': 'http://localhost:5180/',
        'json': 'http://localhost:3002/'

      }
    })
  },
}
</script>

<template>
  <div class="app-container">
    <div class="chat">
      <ArtifactuseAgentMessage
        v-for="(m, index) in messages"
        :key="m.id"
        :content="m.content"
        :message-id="m.id"
        :is-last-message="index === messages.length - 1"
      />
      <ArtifactusePanelToggle />
    </div>
    <ArtifactusePanel />

    <!-- Required: Portal target for fullscreen/mobile backdrop -->
    <portal-target name="artifactuse" />
  </div>
</template>

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