<script>
import { ref, computed } from 'vue'
import {
  ArtifactuseAgentMessage,
  ArtifactusePanel,
  ArtifactusePanelToggle,
  provideArtifactuse
} from '../../src/vue2'
import { messages as mockMessages } from '../shared/mockMessages'
import { createStreamSimulator } from '../shared/streamSimulator'

// CodeMirror modules for editor tab
import * as cmState from '@codemirror/state'
import * as cmView from '@codemirror/view'
import * as cmCommands from '@codemirror/commands'
import * as cmLanguage from '@codemirror/language'
import * as cmAutocomplete from '@codemirror/autocomplete'
import * as lezerHighlight from '@lezer/highlight'
// Language packages
import * as cmLangJavascript from '@codemirror/lang-javascript'
import * as cmLangPython from '@codemirror/lang-python'
import * as cmLangHtml from '@codemirror/lang-html'
import * as cmLangCss from '@codemirror/lang-css'
import * as cmLangJson from '@codemirror/lang-json'
import * as cmLangMarkdown from '@codemirror/lang-markdown'
import * as cmLangXml from '@codemirror/lang-xml'
import * as cmLangYaml from '@codemirror/lang-yaml'
import * as cmLangSql from '@codemirror/lang-sql'
import * as cmLangJava from '@codemirror/lang-java'
import * as cmLangCpp from '@codemirror/lang-cpp'
import * as cmLangGo from '@codemirror/lang-go'
import * as cmLangRust from '@codemirror/lang-rust'
import * as cmLangPhp from '@codemirror/lang-php'
import * as cmLangVue from '@codemirror/lang-vue'
import * as cmLangAngular from '@codemirror/lang-angular'
import * as cmLangLess from '@codemirror/lang-less'
import * as cmLangSass from '@codemirror/lang-sass'

export default {
  components: {
    ArtifactuseAgentMessage,
    ArtifactusePanel,
    ArtifactusePanelToggle,
  },
  setup() {
    // Must call provideArtifactuse in setup() for provide/inject to work
    const artifactuse = provideArtifactuse({
      theme: 'light',
      cdnUrl: 'http://localhost:8787/',
      //cdnUrl: 'https://cdn.artifactuse.com/',
      sharing: {
        apiUrl: 'http://api.artifactuse.test',
        appUrl: 'http://app.artifactuse.test',
        storageKey: 'artifactuse_auth',
      },
      editor: {
        modules: {
          state: cmState,
          view: cmView,
          commands: cmCommands,
          language: cmLanguage,
          autocomplete: cmAutocomplete,
          lezerHighlight: lezerHighlight,
          langJavascript: cmLangJavascript,
          langPython: cmLangPython,
          langHtml: cmLangHtml,
          langCss: cmLangCss,
          langJson: cmLangJson,
          langMarkdown: cmLangMarkdown,
          langXml: cmLangXml,
          langYaml: cmLangYaml,
          langSql: cmLangSql,
          langJava: cmLangJava,
          langCpp: cmLangCpp,
          langGo: cmLangGo,
          langRust: cmLangRust,
          langPhp: cmLangPhp,
          langVue: cmLangVue,
          langAngular: cmLangAngular,
          langLess: cmLangLess,
          langSass: cmLangSass,
        },
        theme: 'dark',
      },
      // panels: {
      //   // Add new panel type
      //   'form': 'http://localhost:5181/',
      //   // Override specific panel with different CDN
      //   'video': 'http://localhost:3001/video',
      //   // Disable a panel
      //   'canvas': 'http://localhost:3001/canvas',
      //   'diff': ' http://localhost:5176/',
      //   'html': 'http://localhost:5178/',
      //   'svg': 'http://localhost:5175/',
      //   'javascript': 'http://localhost:5177/',
      //   'python': 'http://localhost:5177/',
      //   'react': 'http://localhost:5179/',
      //   'vue': 'http://localhost:5180/',
      //   'json': 'http://localhost:3002/'

      // }
    })

    const messages = ref([])
    const selectedMessageId = ref(mockMessages[0]?.id || '')
    const streamSpeed = ref('fast')
    const isStreaming = ref(false)
    const showTestPanel = ref(true)

    const artifactCount = computed(() => {
      return artifactuse.artifactCount.value;
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
      artifactuse.clearArtifacts()
    }

    function loadAllInstantly() {
      messages.value = [...mockMessages]
    }

    // openFile / openCode tests
    function testOpenHtml() {
      artifactuse.openFile('index.html', '<!DOCTYPE html>\n<html>\n<head><title>Test</title></head>\n<body>\n  <h1>Hello World</h1>\n  <p>This is a test HTML file opened via <code>openFile()</code>.</p>\n</body>\n</html>')
    }

    function testOpenReact() {
      artifactuse.openFile('App.jsx', 'import React, { useState } from "react";\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div style={{ padding: 40, fontFamily: "sans-serif" }}>\n      <h1>Counter: {count}</h1>\n      <button onClick={() => setCount(c => c + 1)}>Increment</button>\n    </div>\n  );\n}')
    }

    function testOpenJson() {
      artifactuse.openFile('data.json', JSON.stringify({ name: 'Artifactuse', version: '1.0.0', features: ['openFile', 'openCode', 'panels'] }, null, 2))
    }

    function testOpenMarkdown() {
      artifactuse.openFile('readme.md', '# Hello Markdown\n\nThis file was opened via `openFile("readme.md", ...)`.\n\n## Features\n\n- Auto-detect language from extension\n- Falls back to code-panel for unknown types\n- Works across all frameworks\n\n```js\nsdk.openFile("readme.md", content);\n```')
    }

    function testOpenUnknown() {
      artifactuse.openFile('config.xyz', 'key = value\nhost = localhost\nport = 3000\n\n[section]\nenabled = true')
    }

    function testOpenCode() {
      artifactuse.openCode('function greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("World");', 'javascript', { title: 'My Script' })
    }

    // New feature demos
    function testViewModeCode() {
      artifactuse.openFile('page.html', '<!DOCTYPE html>\n<html>\n<body>\n  <h1>viewMode: code</h1>\n  <p>This opened with the Code tab active instead of Preview.</p>\n</body>\n</html>', { viewMode: 'code' })
    }

    function testCodeOnly() {
      artifactuse.openFile('utils.py', 'def greet(name):\n    print(f"Hello, {name}!")\n\ndef add(a, b):\n    return a + b\n\nif __name__ == "__main__":\n    greet("World")\n    print(add(2, 3))', { tabs: ['code'] })
    }

    function testNoSplit() {
      artifactuse.openFile('card.html', '<!DOCTYPE html>\n<html>\n<body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f0f0">\n  <div style="background:#fff;padding:32px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1)">\n    <h2>No Split Tab</h2>\n    <p>Only Preview and Code tabs are visible.</p>\n  </div>\n</body>\n</html>', { tabs: ['preview', 'code'] })
    }

    function testTxtFallback() {
      artifactuse.openFile('config.ini', '[database]\nhost = localhost\nport = 5432\nname = myapp_db\n\n[server]\nport = 3000\ndebug = true\nlog_level = info')
    }

    function testEditTab() {
      artifactuse.openFile('app.js', 'function hello(name) {\n  console.log(`Hello, ${name}!`);\n}\n\nfunction add(a, b) {\n  return a + b;\n}\n\nhello("World");\nconsole.log(add(2, 3));', { tabs: ['edit'] })
    }

    function testPanelUrl() {
      artifactuse.openFile('simulation.html', '<h1>Custom Panel</h1>', {
        panelUrl: 'https://megan-39df41ad.boostgpt.test/w/b0979b81-2e21-49d8-9451-7fbea323afe3/simulations/index.html'
      })
    }

    // updateFile test
    const updateFileArtifact = ref(null)
    let updateFileCounter = 0
    const updateFileVersions = [
      '<h1>Version 1</h1>\n<p>Original content</p>',
      '<h1>Version 2</h1>\n<p style="color:blue">Updated via updateFile!</p>',
      '<h1>Version 3</h1>\n<p style="color:green">Third update, same tab.</p>',
    ]

    function testUpdateFileOpen() {
      updateFileCounter = 0
      updateFileArtifact.value = artifactuse.openFile('demo.html', updateFileVersions[0], {
        panelUrl: 'http://localhost:8787/html-panel/'
      })
    }

    function testUpdateFileUpdate() {
      if (!updateFileArtifact.value) return alert('Click "updateFile: Open" first')
      updateFileCounter = (updateFileCounter + 1) % updateFileVersions.length
      artifactuse.updateFile(updateFileArtifact.value, updateFileVersions[updateFileCounter])
    }

    // Edit tab language tests
    function testEditLang(filename, code) {
      artifactuse.openFile(filename, code, { tabs: ['edit'] })
    }

    const langSamples = {
      'style.css': 'body {\n  margin: 0;\n  font-family: sans-serif;\n  background: #1a1a2e;\n  color: #e4e4e7;\n}\n\n.container {\n  display: flex;\n  justify-content: center;\n  padding: 2rem;\n}',
      'page.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Test</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n  <p class="intro">Welcome</p>\n</body>\n</html>',
      'data.json': '{\n  "name": "Artifactuse",\n  "version": "1.0.0",\n  "features": ["openFile", "edit"],\n  "config": {\n    "theme": "dark",\n    "enabled": true\n  }\n}',
      'notes.md': '# Project Notes\n\n## Features\n\n- **Bold text** and *italic*\n- `inline code`\n\n```js\nconsole.log("hello");\n```\n\n> A blockquote here',
      'config.xml': '<?xml version="1.0" encoding="UTF-8"?>\n<config>\n  <database>\n    <host>localhost</host>\n    <port>5432</port>\n  </database>\n  <server port="3000" debug="true" />\n</config>',
      'config.yaml': 'server:\n  host: localhost\n  port: 3000\n  debug: true\n\ndatabase:\n  engine: postgres\n  name: myapp\n  credentials:\n    user: admin\n    password: secret',
      'query.sql': 'SELECT u.id, u.name, COUNT(o.id) AS order_count\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE u.created_at > \'2024-01-01\'\nGROUP BY u.id, u.name\nHAVING COUNT(o.id) > 5\nORDER BY order_count DESC\nLIMIT 10;',
      'Main.java': 'import java.util.List;\nimport java.util.stream.Collectors;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> names = List.of("Alice", "Bob", "Charlie");\n        String result = names.stream()\n            .filter(n -> n.length() > 3)\n            .collect(Collectors.joining(", "));\n        System.out.println(result);\n    }\n}',
      'main.cpp': '#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {3, 1, 4, 1, 5};\n    std::sort(nums.begin(), nums.end());\n    for (const auto& n : nums) {\n        std::cout << n << " ";\n    }\n    return 0;\n}',
      'main.go': 'package main\n\nimport (\n\t"fmt"\n\t"strings"\n)\n\nfunc greet(name string) string {\n\treturn fmt.Sprintf("Hello, %s!", strings.Title(name))\n}\n\nfunc main() {\n\tfmt.Println(greet("world"))\n}',
      'main.rs': 'use std::collections::HashMap;\n\nfn main() {\n    let mut scores: HashMap<&str, i32> = HashMap::new();\n    scores.insert("Alice", 10);\n    scores.insert("Bob", 20);\n\n    for (name, score) in &scores {\n        println!("{}: {}", name, score);\n    }\n}',
      'index.php': '<?php\n\nclass UserController {\n    private array $users = [];\n\n    public function index(): string {\n        $filtered = array_filter($this->users, fn($u) => $u[\'active\']);\n        return json_encode($filtered);\n    }\n\n    public function store(array $data): void {\n        $this->users[] = $data;\n    }\n}',
      'App.vue': '<template>\n  <div class="app">\n    <h1>{{ title }}</h1>\n    <button @click="count++">Count: {{ count }}</button>\n  </div>\n</template>\n\n<style scoped>\n.app {\n  padding: 20px;\n  font-family: sans-serif;\n}\n</style>',
      'style.less': '@primary: #6366f1;\n@radius: 8px;\n\n.card {\n  background: darken(@primary, 40%);\n  border-radius: @radius;\n  padding: 16px;\n\n  &__title {\n    color: lighten(@primary, 20%);\n    font-size: 1.2em;\n  }\n\n  &:hover {\n    background: darken(@primary, 35%);\n  }\n}',
      'style.scss': '$primary: #6366f1;\n$radius: 8px;\n\n.card {\n  background: darken($primary, 40%);\n  border-radius: $radius;\n  padding: 16px;\n\n  &__title {\n    color: lighten($primary, 20%);\n    font-size: 1.2em;\n  }\n\n  &:hover {\n    background: darken($primary, 35%);\n  }\n}',
      'App.tsx': 'import React, { useState } from "react";\n\ninterface Props {\n  name: string;\n  age?: number;\n}\n\nconst Greeting: React.FC<Props> = ({ name, age = 0 }) => {\n  const [count, setCount] = useState<number>(0);\n  return (\n    <div>\n      <h1>Hello, {name}!</h1>\n      <p>Age: {age}, Clicks: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>Click</button>\n    </div>\n  );\n};',
      'utils.py': 'from dataclasses import dataclass\nfrom typing import List, Optional\n\n@dataclass\nclass User:\n    name: str\n    email: str\n    age: Optional[int] = None\n\ndef filter_adults(users: List[User]) -> List[User]:\n    return [u for u in users if u.age and u.age >= 18]\n\nif __name__ == "__main__":\n    users = [User("Alice", "alice@test.com", 25)]\n    print(filter_adults(users))',
    }

    // Listen for edit:save events
    artifactuse.on('edit:save', (data) => {
      console.log('[edit:save]', data)
      alert('Code saved! Check console for data.')
    })

    return {
      messages,
      mockMessages,
      selectedMessageId,
      streamSpeed,
      isStreaming,
      showTestPanel,
      selectedMessage,
      streamSelected,
      streamAll,
      stopStream,
      clearMessages,
      loadAllInstantly,
      artifactCount,
      testOpenHtml,
      testOpenReact,
      testOpenJson,
      testOpenMarkdown,
      testOpenUnknown,
      testOpenCode,
      testViewModeCode,
      testCodeOnly,
      testNoSplit,
      testTxtFallback,
      testEditTab,
      testPanelUrl,
      testEditLang,
      langSamples,
      testUpdateFileOpen,
      testUpdateFileUpdate,
    }
  },
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

        <div class="test-panel__field">
          <label>Open File Tests:</label>
        </div>
        <div class="test-panel__actions">
          <button @click="testOpenHtml">HTML</button>
          <button @click="testOpenReact">React</button>
          <button @click="testOpenJson">JSON</button>
        </div>
        <div class="test-panel__actions">
          <button @click="testOpenMarkdown">Markdown</button>
          <button @click="testOpenUnknown">Unknown (.xyz)</button>
        </div>
        <div class="test-panel__actions">
          <button @click="testOpenCode">openCode()</button>
        </div>

        <div class="test-panel__field">
          <label>New Features:</label>
        </div>
        <div class="test-panel__actions">
          <button @click="testViewModeCode">viewMode: code</button>
          <button @click="testCodeOnly">Code Only</button>
        </div>
        <div class="test-panel__actions">
          <button @click="testNoSplit">No Split</button>
          <button @click="testTxtFallback">txt (.ini)</button>
        </div>
        <div class="test-panel__actions">
          <button @click="testEditTab">Edit Tab</button>
          <button @click="testPanelUrl">panelUrl</button>
        </div>
        <div class="test-panel__actions">
          <button @click="testUpdateFileOpen">updateFile: Open</button>
          <button @click="testUpdateFileUpdate">updateFile: Update</button>
        </div>

        <div class="test-panel__field">
          <label>Edit Languages:</label>
        </div>
        <div class="test-panel__actions">
          <button v-for="(code, filename) in langSamples" :key="filename" @click="testEditLang(filename, code)">
            {{ filename.split('.').pop() }}
          </button>
        </div>

        <div class="test-panel__status">
          Messages: {{ messages.length }} / {{ mockMessages.length }}
          <span v-if="isStreaming" class="streaming-indicator">Streaming...</span>
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
        :is-last-message="index === messages.length - 1"
      />
      <ArtifactusePanelToggle v-if="artifactCount > 0" class="h-8 w-8 flex items-center justify-center cursor-pointer rounded-full disabled:opacity-65 disabled:cursor-default transition-all duration-200 hover:bg-gray-100 hover:text-gray-600" />
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
  height: 500px;
  overflow: scroll;
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
