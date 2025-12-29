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
    provideArtifactuse({ theme: 'dark' })
  },
}
</script>

<template>
  <div>
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
