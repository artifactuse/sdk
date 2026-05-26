<script>
  import {
    ArtifactuseAgentMessage,
    ArtifactusePanel,
    ArtifactusePanelToggle,
    setArtifactuseContext
  } from '../../src/svelte'
  import { messages as mockMessages } from '../shared/mockMessages'
  import { createStreamSimulator } from '../shared/streamSimulator'
  import { playgroundWidgetCdnUrl, registerHostedPlaygroundWidgets } from '../shared/widgetConfig'

  const { clearArtifacts, openFile, registerWidget } = setArtifactuseContext({
    theme: 'dark',
  })

  let widgetRegistryStatus = {
    state: 'loading',
    count: 0,
  }

  registerHostedPlaygroundWidgets(registerWidget).then((result) => {
    widgetRegistryStatus = {
      state: result.ok ? 'loaded' : 'failed',
      count: result.ok ? Object.keys(result.widgets || {}).length : 0,
    }
  })

  const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADklEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==';
  const WAV_B64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  const PDF_B64 = 'JVBERi0xLjAKMSAwIG9iajw8L1BhZ2VzIDIgMCBSPj5lbmRvYmoKMiAwIG9iajw8L0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvTWVkaWFCb3hbMCAwIDMgM10+PmVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+';
  const BIN_B64 = btoa('\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f' + 'Hello, binary! \xff');

  async function fetchAsBase64(url) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin);
  }

  function testBinaryImage() { openFile('red-pixel.png', PNG_B64); }
  function testBinaryAudio() { openFile('silent.wav', WAV_B64); }
  async function testBinaryVideo() {
    const b64 = await fetchAsBase64('https://www.w3schools.com/html/mov_bbb.mp4');
    openFile('test.mp4', b64);
  }
  function testBinaryPdf() { openFile('minimal.pdf', PDF_B64); }
  async function testBinaryFont() {
    const b64 = await fetchAsBase64('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.woff2');
    openFile('Roboto.woff2', b64);
  }
  function testBinaryHex() { openFile('data.bin', BIN_B64); }

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

  function handleWidgetAction(event) {
    console.log('Widget action:', event.detail)
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
          <label for="message-select">Message:</label>
          <select id="message-select" bind:value={selectedMessageId}>
            {#each mockMessages as m (m.id)}
              <option value={m.id}>{m.id}</option>
            {/each}
          </select>
        </div>

        <div class="test-panel__field">
          <label for="speed-select">Speed:</label>
          <select id="speed-select" bind:value={streamSpeed}>
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

        <div class="test-panel__status">
          Widgets: {widgetRegistryStatus.state}
          {#if widgetRegistryStatus.state === 'loaded'} ({widgetRegistryStatus.count}){/if}
          <span class="streaming-indicator">{playgroundWidgetCdnUrl}</span>
        </div>

        <div class="test-panel__field">
          <span>Binary File Preview:</span>
        </div>
        <div class="test-panel__actions">
          <button on:click={testBinaryImage}>PNG</button>
          <button on:click={testBinaryAudio}>WAV</button>
          <button on:click={testBinaryVideo}>MP4</button>
        </div>
        <div class="test-panel__actions">
          <button on:click={testBinaryPdf}>PDF</button>
          <button on:click={testBinaryFont}>WOFF2</button>
          <button on:click={testBinaryHex}>BIN</button>
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
        typing={m.typing === true}
        isLastMessage={index === messages.length - 1}
        on:widget-action={handleWidgetAction}
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
