import { describe, expect, it } from 'vitest';
import { extractCodeBlockArtifacts } from './detector.js';

describe('extractCodeBlockArtifacts', () => {
  it('renders widget artifacts as inline widget placeholders when inlinePreview is globally enabled', () => {
    const html = `<p>Approve this:</p>
<pre><code class="language-widget">{
  &quot;type&quot;: &quot;widget&quot;,
  &quot;template&quot;: &quot;approval-card&quot;,
  &quot;props&quot;: { &quot;title&quot;: &quot;Deploy&quot; },
  &quot;actions&quot;: [{ &quot;id&quot;: &quot;approve&quot;, &quot;label&quot;: &quot;Approve&quot; }],
  &quot;permissions&quot;: [&quot;state&quot;, &quot;actions&quot;]
}</code></pre>`;

    const result = extractCodeBlockArtifacts(html, 'msg-widget', {
      inlinePreview: { languages: true },
      inlineCode: { languages: true },
    });

    expect(result.artifacts).toHaveLength(1);
    expect(result.artifacts[0]).toMatchObject({
      type: 'widget',
      template: 'approval-card',
      isInline: true,
      isPanelArtifact: false,
    });
    expect(result.html).toContain('data-artifact-type="widget"');
    expect(result.html).toContain('artifactuse-inline-widget');
    expect(result.html).not.toContain('artifactuse-inline-preview');
    expect(result.html).not.toContain('<pre><code class="language-widget">');
  });
});
