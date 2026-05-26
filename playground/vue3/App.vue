<script setup>
import { ref, computed } from 'vue'
import {
  ArtifactuseAgentMessage,
  ArtifactusePanel,
  ArtifactusePanelToggle,
  provideArtifactuse
} from '../../src/vue'
import { messages as mockMessages } from '../shared/mockMessages'
import { createStreamSimulator } from '../shared/streamSimulator'
import { playgroundWidgetCdnUrl, registerHostedPlaygroundWidgets } from '../shared/widgetConfig'

const { clearArtifacts, registerWidget } = provideArtifactuse({
  theme: 'light',
})

const messages = ref([])
const selectedMessageId = ref(mockMessages[0]?.id || '')
const streamSpeed = ref('fast')
const isStreaming = ref(false)
const showTestPanel = ref(true)
const widgetActionLog = ref([])
const widgetRegistryStatus = ref({ state: 'loading', count: 0 })

registerHostedPlaygroundWidgets(registerWidget).then((result) => {
  widgetRegistryStatus.value = {
    state: result.ok ? 'loaded' : 'failed',
    count: result.ok ? Object.keys(result.widgets || {}).length : 0,
  }
})

const selectedMessage = computed(() => {
  return mockMessages.find(m => m.id === selectedMessageId.value)
})

const simulator = createStreamSimulator({
  getMessages: () => messages.value,
  setMessages: (msgs) => { messages.value = msgs },
})

function streamSelected() {
  if (!selectedMessage.value) return

  isStreaming.value = true
  simulator.setSpeed(streamSpeed.value)
  simulator.streamMessage(selectedMessage.value, () => {
    isStreaming.value = false
  })
}

function streamAll() {
  isStreaming.value = true
  simulator.setSpeed(streamSpeed.value)
  simulator.streamAllMessages(mockMessages, () => {
    isStreaming.value = false
  })
}

function stopStream() {
  simulator.stopStream()
  isStreaming.value = false
}

function clearMessages() {
  simulator.clearStreamedMessages()
  messages.value = []
  widgetActionLog.value = []
  clearArtifacts()
}

function loadAllInstantly() {
  messages.value = [...mockMessages]
}

function handleWidgetAction(event) {
  widgetActionLog.value.unshift({
    action: event.action,
    template: event.template,
    time: new Date().toLocaleTimeString(),
  })

  if (widgetActionLog.value.length > 5) {
    widgetActionLog.value.pop()
  }
}
</script>

<template>
  <div class="app-container">
    <!-- Test Panel -->
    <div v-if="showTestPanel" class="test-panel">
      <div class="test-panel__header">
        <span>Stream Tester</span>
        <button class="test-panel__close" @click="showTestPanel = false">&times;</button>
      </div>

      <div class="test-panel__content">
        <div class="test-panel__field">
          <label>Message:</label>
          <select v-model="selectedMessageId">
            <option v-for="m in mockMessages" :key="m.id" :value="m.id">
              {{ m.id }}
            </option>
          </select>
        </div>

        <div class="test-panel__field">
          <label>Speed:</label>
          <select v-model="streamSpeed">
            <option value="fast">Fast (2ms)</option>
            <option value="medium">Medium (10ms)</option>
            <option value="slow">Slow (30ms)</option>
          </select>
        </div>

        <div class="test-panel__actions">
          <button @click="streamSelected" :disabled="isStreaming">
            Stream Selected
          </button>
          <button @click="streamAll" :disabled="isStreaming">
            Stream All
          </button>
          <button @click="stopStream" :disabled="!isStreaming">
            Stop
          </button>
        </div>

        <div class="test-panel__actions">
          <button @click="loadAllInstantly">
            Load All Instantly
          </button>
          <button @click="clearMessages">
            Clear
          </button>
        </div>

        <div class="test-panel__status">
          Messages: {{ messages.length }} / {{ mockMessages.length }}
          <span v-if="isStreaming" class="streaming-indicator">Streaming...</span>
        </div>

        <div class="test-panel__status">
          Widgets: {{ widgetRegistryStatus.state }}
          <template v-if="widgetRegistryStatus.state === 'loaded'">({{ widgetRegistryStatus.count }})</template>
          <span class="streaming-indicator">{{ playgroundWidgetCdnUrl }}</span>
        </div>

        <div v-if="widgetActionLog.length" class="test-panel__field">
          <label>Widget Actions:</label>
          <div class="test-panel__event-log">
            <div v-for="(entry, i) in widgetActionLog" :key="i" class="test-panel__event-entry">
              <span class="test-panel__event-time">{{ entry.time }}</span>
              <span>{{ entry.template }}:{{ entry.action }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle button when panel is hidden -->
    <button v-if="!showTestPanel" class="test-panel__toggle" @click="showTestPanel = true">
      Test
    </button>

    <div class="chat">
      <ArtifactuseAgentMessage
        v-for="(m, index) in messages"
        :key="m.id"
        :content="m.content"
        :message-id="m.id"
        :typing="m.typing === true"
        :is-last-message="index === messages.length - 1"
        @widget-action="handleWidgetAction"
      />
      <ArtifactusePanelToggle />
    </div>
    <ArtifactusePanel />
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

.test-panel__event-log {
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: monospace;
  max-height: 100px;
  overflow-y: auto;
}

.test-panel__event-entry {
  padding: 2px 0;
  color: #333;
}

.test-panel__event-time {
  color: #999;
  margin-right: 6px;
}
</style>
