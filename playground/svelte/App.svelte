<script>
  import {
    ArtifactuseAgentMessage,
    ArtifactusePanel,
    ArtifactusePanelToggle,
    setArtifactuseContext
  } from '../../src/svelte'
  import { messages } from '../shared/mockMessages'

  setArtifactuseContext({ theme: 'dark' })
</script>

{#each messages as m (m.id)}
  <ArtifactuseAgentMessage
    content={m.content}
    messageId={m.id}
  />
{/each}

<ArtifactusePanel />
<ArtifactusePanelToggle />
