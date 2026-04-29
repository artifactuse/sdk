import { useState, useMemo, useCallback } from 'react'
import {
  ArtifactuseProvider,
  ArtifactuseAgentMessage,
  ArtifactusePanel,
  ArtifactusePanelToggle,
  useArtifactuse
} from '../../src/react'
import { messages as mockMessages } from '../shared/mockMessages'
import { createStreamSimulator } from '../shared/streamSimulator'

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

function AppContent() {
  const { clearArtifacts, openFile } = useArtifactuse()
  const [messages, setMessages] = useState([])
  const [selectedMessageId, setSelectedMessageId] = useState(mockMessages[0]?.id || '')
  const [streamSpeed, setStreamSpeed] = useState('fast')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showTestPanel, setShowTestPanel] = useState(true)

  const selectedMessage = useMemo(() => {
    return mockMessages.find(m => m.id === selectedMessageId)
  }, [selectedMessageId])

  const simulator = useMemo(() => {
    return createStreamSimulator({
      getMessages: () => messages,
      setMessages: setMessages,
    })
  }, [])

  // Update simulator's getMessages to use current messages
  useMemo(() => {
    simulator.getMessages = () => messages
  }, [messages, simulator])

  const streamSelected = useCallback(() => {
    if (!selectedMessage) return

    setIsStreaming(true)
    simulator.setSpeed(streamSpeed)
    simulator.streamMessage(selectedMessage, () => {
      setIsStreaming(false)
    })
  }, [selectedMessage, streamSpeed, simulator])

  const streamAll = useCallback(() => {
    setIsStreaming(true)
    simulator.setSpeed(streamSpeed)
    simulator.streamAllMessages(mockMessages, () => {
      setIsStreaming(false)
    })
  }, [streamSpeed, simulator])

  const stopStream = useCallback(() => {
    simulator.stopStream()
    setIsStreaming(false)
  }, [simulator])

  const clearMessages = useCallback(() => {
    simulator.clearStreamedMessages()
    setMessages([])
    clearArtifacts()
  }, [simulator, clearArtifacts])

  const loadAllInstantly = useCallback(() => {
    setMessages([...mockMessages])
  }, [])

  const testBinaryImage = useCallback(() => openFile('red-pixel.png', PNG_B64), [openFile])
  const testBinaryAudio = useCallback(() => openFile('silent.wav', WAV_B64), [openFile])
  const testBinaryVideo = useCallback(async () => {
    const b64 = await fetchAsBase64('https://www.w3schools.com/html/mov_bbb.mp4');
    openFile('test.mp4', b64);
  }, [openFile])
  const testBinaryPdf = useCallback(() => openFile('minimal.pdf', PDF_B64), [openFile])
  const testBinaryFont = useCallback(async () => {
    const b64 = await fetchAsBase64('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.woff2');
    openFile('Roboto.woff2', b64);
  }, [openFile])
  const testBinaryHex = useCallback(() => openFile('data.bin', BIN_B64), [openFile])

  return (
    <div className="app-container">
      {/* Test Panel */}
      {showTestPanel && (
        <div className="test-panel">
          <div className="test-panel__header">
            <span>Stream Tester</span>
            <button className="test-panel__close" onClick={() => setShowTestPanel(false)}>&times;</button>
          </div>

          <div className="test-panel__content">
            <div className="test-panel__field">
              <label>Message:</label>
              <select value={selectedMessageId} onChange={(e) => setSelectedMessageId(e.target.value)}>
                {mockMessages.map(m => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
            </div>

            <div className="test-panel__field">
              <label>Speed:</label>
              <select value={streamSpeed} onChange={(e) => setStreamSpeed(e.target.value)}>
                <option value="fast">Fast (2ms)</option>
                <option value="medium">Medium (10ms)</option>
                <option value="slow">Slow (30ms)</option>
              </select>
            </div>

            <div className="test-panel__actions">
              <button onClick={streamSelected} disabled={isStreaming}>
                Stream Selected
              </button>
              <button onClick={streamAll} disabled={isStreaming}>
                Stream All
              </button>
              <button onClick={stopStream} disabled={!isStreaming}>
                Stop
              </button>
            </div>

            <div className="test-panel__actions">
              <button onClick={loadAllInstantly}>
                Load All Instantly
              </button>
              <button onClick={clearMessages}>
                Clear
              </button>
            </div>

            <div className="test-panel__status">
              Messages: {messages.length} / {mockMessages.length}
              {isStreaming && <span className="streaming-indicator">Streaming...</span>}
            </div>

            <div className="test-panel__field">
              <label>Binary File Preview:</label>
            </div>
            <div className="test-panel__actions">
              <button onClick={testBinaryImage}>PNG</button>
              <button onClick={testBinaryAudio}>WAV</button>
              <button onClick={testBinaryVideo}>MP4</button>
            </div>
            <div className="test-panel__actions">
              <button onClick={testBinaryPdf}>PDF</button>
              <button onClick={testBinaryFont}>WOFF2</button>
              <button onClick={testBinaryHex}>BIN</button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button when panel is hidden */}
      {!showTestPanel && (
        <button className="test-panel__toggle" onClick={() => setShowTestPanel(true)}>
          Test
        </button>
      )}

      <div className="chat">
        {messages.map((m, index) => (
          <ArtifactuseAgentMessage
            key={m.id}
            content={m.content}
            messageId={m.id}
            isLastMessage={index === messages.length - 1}
          />
        ))}
        <ArtifactusePanelToggle />
      </div>
      <ArtifactusePanel />
    </div>
  )
}

export default function App() {
  return (
    <ArtifactuseProvider config={{ theme: 'dark' }}>
      <AppContent />
    </ArtifactuseProvider>
  )
}
