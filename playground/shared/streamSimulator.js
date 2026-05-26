// Stream simulator for testing artifact streaming behavior
// Framework-agnostic utility that works with any reactive messages array

/**
 * Creates a stream simulator instance
 * @param {Object} options
 * @param {Function} options.getMessages - Function to get current messages array
 * @param {Function} options.setMessages - Function to set messages array (for frameworks that need it)
 * @param {Function} options.updateMessage - Function to update a specific message by id
 */
export function createStreamSimulator({ getMessages, setMessages, updateMessage }) {
  let streamInterval = null;
  let isStreaming = false;
  let currentMessageIndex = 0;
  let currentCharIndex = 0;
  let currentStreamingId = null;
  let speed = 5; // ms per character

  const speeds = {
    fast: 2,
    medium: 10,
    slow: 30,
  };

  /**
   * Stream a single message character by character
   * @param {Object} message - The message object with id and content
   * @param {Function} onComplete - Callback when streaming completes
   */
  function streamMessage(message, onComplete) {
    if (isStreaming) {
      stopStream();
    }

    isStreaming = true;
    currentCharIndex = 0;
    const fullContent = message.content;

    // Create empty message placeholder
    const streamingMessage = {
      id: `streaming-${message.id}`,
      content: '',
      typing: true,
    };
    currentStreamingId = streamingMessage.id;

    const messages = getMessages();
    const newMessages = [...messages, streamingMessage];
    if (setMessages) {
      setMessages(newMessages);
    }

    streamInterval = setInterval(() => {
      if (currentCharIndex < fullContent.length) {
        streamingMessage.content = fullContent.substring(0, currentCharIndex + 1);
        streamingMessage.typing = true;

        if (updateMessage) {
          updateMessage(streamingMessage.id, streamingMessage.content, { typing: true });
        } else if (setMessages) {
          // For Vue 2 reactivity, we need to replace the array
          const msgs = getMessages();
          const idx = msgs.findIndex(m => m.id === streamingMessage.id);
          if (idx !== -1) {
            msgs[idx] = { ...streamingMessage };
            setMessages([...msgs]);
          }
        }

        currentCharIndex++;
      } else {
        streamingMessage.content = fullContent;
        streamingMessage.typing = false;

        if (updateMessage) {
          updateMessage(streamingMessage.id, streamingMessage.content, { typing: false });
        } else if (setMessages) {
          const msgs = getMessages();
          const idx = msgs.findIndex(m => m.id === streamingMessage.id);
          if (idx !== -1) {
            msgs[idx] = { ...streamingMessage };
            setMessages([...msgs]);
          }
        }

        stopStream();
        if (onComplete) onComplete();
      }
    }, speed);

    return streamingMessage.id;
  }

  /**
   * Stream all messages sequentially
   * @param {Array} messagesToStream - Array of messages to stream
   * @param {Function} onAllComplete - Callback when all messages are streamed
   */
  function streamAllMessages(messagesToStream, onAllComplete) {
    if (isStreaming) {
      stopStream();
    }

    currentMessageIndex = 0;

    function streamNext() {
      if (currentMessageIndex < messagesToStream.length) {
        const msg = messagesToStream[currentMessageIndex];
        currentMessageIndex++;
        streamMessage(msg, streamNext);
      } else {
        if (onAllComplete) onAllComplete();
      }
    }

    streamNext();
  }

  /**
   * Stop the current stream
   */
  function stopStream() {
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }

    if (currentStreamingId) {
      const messages = getMessages();
      const idx = messages.findIndex(m => m.id === currentStreamingId);
      if (idx !== -1 && messages[idx]?.typing) {
        messages[idx] = { ...messages[idx], typing: false };
        if (setMessages) setMessages([...messages]);
        if (updateMessage) updateMessage(currentStreamingId, messages[idx].content, { typing: false });
      }
    }

    currentStreamingId = null;
    isStreaming = false;
  }

  /**
   * Set streaming speed
   * @param {string} speedName - 'fast', 'medium', or 'slow'
   */
  function setSpeed(speedName) {
    if (speeds[speedName]) {
      speed = speeds[speedName];
    }
  }

  /**
   * Clear all streamed messages (messages with id starting with 'streaming-')
   */
  function clearStreamedMessages() {
    stopStream();
    const messages = getMessages();
    const filtered = messages.filter(m => !m.id.startsWith('streaming-'));
    if (setMessages) {
      setMessages(filtered);
    }
  }

  return {
    streamMessage,
    streamAllMessages,
    stopStream,
    setSpeed,
    clearStreamedMessages,
    isStreaming: () => isStreaming,
    speeds: Object.keys(speeds),
  };
}

export default createStreamSimulator;
