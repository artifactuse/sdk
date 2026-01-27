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

function AppContent() {
  const { clearArtifacts } = useArtifactuse()
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
