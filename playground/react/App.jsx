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
      {messages.map(m => (
        <ArtifactuseAgentMessage
          key={m.id}
          content={m.content}
          messageId={m.id}
        />
      ))}
      <ArtifactusePanel />
      <ArtifactusePanelToggle />
    </ArtifactuseProvider>
  )
}
