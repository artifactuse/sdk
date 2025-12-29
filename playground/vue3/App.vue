<script setup>
import {
  ArtifactuseAgentMessage,
  ArtifactusePanel,
  ArtifactusePanelToggle,
  provideArtifactuse
} from '../../src/vue'
import { messages } from '../shared/mockMessages'

provideArtifactuse({ theme: 'dark' })
</script>

<template>
  <div class="chat">
    <ArtifactuseAgentMessage
      v-for="m in messages"
      :key="m.id"
      :content="m.content"
      :message-id="m.id"
    />
    <ArtifactusePanel />
    <ArtifactusePanelToggle />
  </div>
</template>
