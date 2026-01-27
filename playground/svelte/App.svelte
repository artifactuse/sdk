<script>
  import {
    ArtifactuseAgentMessage,
    ArtifactusePanel,
    ArtifactusePanelToggle,
    setArtifactuseContext
  } from '../../src/svelte'
  import { messages as mockMessages } from '../shared/mockMessages'
  import { createStreamSimulator } from '../shared/streamSimulator'

  const { clearArtifacts } = setArtifactuseContext({ theme: 'dark' })

  let messages = []
  let selectedMessageId = mockMessages[0]?.id || ''
  let streamSpeed = 'fast'
  let isStreaming = false
  let showTestPanel = true

  $: selectedMessage = mockMessages.find(m => m.id === selectedMessageId)

  const simulator = createStreamSimulator({
    getMessages: () => messages,
    setMessages: (msgs) => { messages = msgs },
  })

  function streamSelected() {
    if (!selectedMessage) return

    isStreaming = true
    simulator.setSpeed(streamSpeed)
    simulator.streamMessage(selectedMessage, () => {
      isStreaming = false
    })
  }

  function streamAll() {
    isStreaming = true
    simulator.setSpeed(streamSpeed)
    simulator.streamAllMessages(mockMessages, () => {
      isStreaming = false
    })
  }

  function stopStream() {
    simulator.stopStream()
    isStreaming = false
  }

  function clearMessages() {
    simulator.clearStreamedMessages()
    messages = []
    clearArtifacts()
  }

  function loadAllInstantly() {
    messages = [...mockMessages]
  }
</script>

<div class="app-container">
  <!-- Test Panel -->
  {#if showTestPanel}
    <div class="test-panel">
      <div class="test-panel__header">
        <span>Stream Tester</span>
        <button class="test-panel__close" on:click={() => showTestPanel = false}>&times;</button>
      </div>

      <div class="test-panel__content">
        <div class="test-panel__field">
          <label>Message:</label>
          <select bind:value={selectedMessageId}>
            {#each mockMessages as m (m.id)}
              <option value={m.id}>{m.id}</option>
            {/each}
          </select>
        </div>

        <div class="test-panel__field">
          <label>Speed:</label>
          <select bind:value={streamSpeed}>
            <option value="fast">Fast (2ms)</option>
            <option value="medium">Medium (10ms)</option>
            <option value="slow">Slow (30ms)</option>
          </select>
        </div>

        <div class="test-panel__actions">
          <button on:click={streamSelected} disabled={isStreaming}>
            Stream Selected
          </button>
          <button on:click={streamAll} disabled={isStreaming}>
            Stream All
          </button>
          <button on:click={stopStream} disabled={!isStreaming}>
            Stop
          </button>
        </div>

        <div class="test-panel__actions">
          <button on:click={loadAllInstantly}>
            Load All Instantly
          </button>
          <button on:click={clearMessages}>
            Clear
          </button>
        </div>

        <div class="test-panel__status">
          Messages: {messages.length} / {mockMessages.length}
          {#if isStreaming}
            <span class="streaming-indicator">Streaming...</span>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Toggle button when panel is hidden -->
  {#if !showTestPanel}
    <button class="test-panel__toggle" on:click={() => showTestPanel = true}>
      Test
    </button>
  {/if}

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

  /* Test Panel Styles */
  .test-panel {
    position: fixed;
    top: 10px;
    right: 10px;
    width: 280px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
  }

  .test-panel__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
  }

  .test-panel__close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    padding: 0;
    line-height: 1;
  }

  .test-panel__close:hover {
    color: #333;
  }

  .test-panel__content {
    padding: 12px;
  }

  .test-panel__field {
    margin-bottom: 10px;
  }

  .test-panel__field label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: #555;
  }

  .test-panel__field select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
  }

  .test-panel__actions {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .test-panel__actions button {
    flex: 1;
    min-width: 80px;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s;
  }

  .test-panel__actions button:hover:not(:disabled) {
    background: #f0f0f0;
    border-color: #bbb;
  }

  .test-panel__actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .test-panel__status {
    padding: 8px;
    background: #f9f9f9;
    border-radius: 4px;
    font-size: 11px;
    color: #666;
  }

  .streaming-indicator {
    color: #0066cc;
    font-weight: 500;
    margin-left: 8px;
  }

  .test-panel__toggle {
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 16px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }

  .test-panel__toggle:hover {
    background: #f5f5f5;
  }
</style>
