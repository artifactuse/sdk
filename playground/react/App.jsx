import {
  ArtifactuseProvider,
  ArtifactuseAgentMessage,
  ArtifactusePanel,
  ArtifactusePanelToggle
} from '../../src/react'
import { messages } from '../shared/mockMessages'

export default function App() {
  return (
    <ArtifactuseProvider config={{ theme: 'dark' }}>
      <div className="app-container">
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
    </ArtifactuseProvider>
  )
}
