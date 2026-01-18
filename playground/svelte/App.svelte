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

<div class="app-container">
  <div class="chat">
    {#each messages as m, index (m.id)}
      <ArtifactuseAgentMessage
        content={m.content}
        messageId={m.id}
        isLastMessage={index === messages.length - 1}
      />
    {/each}
    <ArtifactusePanelToggle />
  </div>
  <ArtifactusePanel />
</div>

<style>
  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
  }

  :global(#app) {
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