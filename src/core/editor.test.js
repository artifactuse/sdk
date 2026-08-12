import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import createArtifactuse from './index.js';
import { createEditorManager, resolveEditorIsDark } from './editor.js';

/**
 * Minimal stand-ins for the CodeMirror modules a host passes via
 * config.editor.modules. Only the surface createEditorManager touches.
 */
function createFakeModules() {
  const noop = () => ({ ext: true });

  class Compartment {
    of(extension) {
      return { compartment: this, extension };
    }
    reconfigure(extension) {
      return { reconfigure: true, compartment: this, extension };
    }
  }

  class EditorView {
    constructor({ state, parent }) {
      this.state = state;
      this.parent = parent;
      this.dispatched = [];
      this.destroyed = false;
    }
    dispatch(tr) {
      this.dispatched.push(tr);
    }
    destroy() {
      this.destroyed = true;
    }
  }
  EditorView.theme = (spec, options) => ({ theme: true, dark: !!options?.dark, spec });
  EditorView.updateListener = { of: noop };

  return {
    state: {
      Compartment,
      EditorState: {
        allowMultipleSelections: { of: noop },
        create: ({ doc, extensions }) => ({
          doc: { toString: () => doc },
          extensions,
        }),
      },
    },
    view: {
      EditorView,
      keymap: { of: noop },
      lineNumbers: noop,
      highlightActiveLineGutter: noop,
      highlightSpecialChars: noop,
      drawSelection: noop,
      dropCursor: noop,
      rectangularSelection: noop,
      crosshairCursor: noop,
      highlightActiveLine: noop,
    },
    commands: {
      defaultKeymap: [],
      history: noop,
      historyKeymap: [],
      indentWithTab: {},
    },
    language: {
      indentOnInput: noop,
      syntaxHighlighting: (style) => ({ highlight: true, style }),
      bracketMatching: noop,
      foldGutter: noop,
      foldKeymap: [],
      HighlightStyle: { define: (specs) => ({ specs }) },
    },
    autocomplete: {
      closeBrackets: noop,
      closeBracketsKeymap: [],
      autocompletion: noop,
      completionKeymap: [],
    },
    lezerHighlight: {
      tags: new Proxy({}, {
        get: () => {
          const tag = () => tag;
          return tag;
        },
      }),
    },
  };
}

/**
 * Pull the dark flag out of the theme extension the editor built, descending
 * through arrays and compartment wrappers.
 */
function isDarkExtension(extensions) {
  if (Array.isArray(extensions)) {
    for (const entry of extensions) {
      const found = isDarkExtension(entry);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!extensions || typeof extensions !== 'object') return undefined;
  if (extensions.theme) return extensions.dark;
  if (extensions.extension) return isDarkExtension(extensions.extension);
  return undefined;
}

function lastReconfigureIsDark(view) {
  const reconfigures = view.dispatched.filter((tr) => tr.effects?.reconfigure);
  if (!reconfigures.length) return undefined;
  return isDarkExtension(reconfigures[reconfigures.length - 1].effects.extension);
}

describe('resolveEditorIsDark', () => {
  it("defers to the SDK theme only when the preference is 'auto'", () => {
    expect(resolveEditorIsDark('auto', 'dark')).toBe(true);
    expect(resolveEditorIsDark('auto', 'light')).toBe(false);
  });

  it('pins regardless of the SDK theme when explicitly set', () => {
    expect(resolveEditorIsDark('dark', 'light')).toBe(true);
    expect(resolveEditorIsDark('light', 'dark')).toBe(false);
  });
});

describe('createEditorManager theming', () => {
  it("defaults the preference to 'auto' so it follows the SDK theme", () => {
    const manager = createEditorManager({ modules: createFakeModules() });
    const editor = manager.create({}, { code: 'x', sdkTheme: 'light' });

    expect(isDarkExtension(editor.view.state.extensions)).toBe(false);
  });

  it('restyles a live editor when the SDK theme changes', () => {
    const manager = createEditorManager({ modules: createFakeModules(), theme: 'auto' });
    const editor = manager.create({}, { code: 'x', sdkTheme: 'dark' });

    expect(isDarkExtension(editor.view.state.extensions)).toBe(true);

    manager.setSdkTheme('light');

    expect(lastReconfigureIsDark(editor.view)).toBe(false);
  });

  it('leaves a pinned editor alone when the SDK theme changes', () => {
    const manager = createEditorManager({ modules: createFakeModules(), theme: 'dark' });
    const editor = manager.create({}, { code: 'x', sdkTheme: 'dark' });

    expect(manager.setSdkTheme('light')).toBeUndefined();

    // Still dark, and no transaction was dispatched to get there
    expect(isDarkExtension(editor.view.state.extensions)).toBe(true);
    expect(editor.view.dispatched.filter((tr) => tr.effects?.reconfigure)).toHaveLength(0);
  });

  it('restyles when the editor preference itself changes', () => {
    const manager = createEditorManager({ modules: createFakeModules(), theme: 'dark' });
    const editor = manager.create({}, { code: 'x', sdkTheme: 'light' });

    manager.setTheme('auto');

    expect(lastReconfigureIsDark(editor.view)).toBe(false);
  });

  it('stops restyling a destroyed editor', () => {
    const manager = createEditorManager({ modules: createFakeModules(), theme: 'auto' });
    const editor = manager.create({}, { code: 'x', sdkTheme: 'dark' });

    editor.destroy();
    manager.setSdkTheme('light');

    expect(editor.view.destroyed).toBe(true);
    expect(editor.view.dispatched.filter((tr) => tr.effects?.reconfigure)).toHaveLength(0);
  });

  it('keeps working when the host passes a state module without Compartment', () => {
    const modules = createFakeModules();
    delete modules.state.Compartment;

    const manager = createEditorManager({ modules, theme: 'auto' });
    const editor = manager.create({}, { code: 'x', sdkTheme: 'dark' });

    expect(isDarkExtension(editor.view.state.extensions)).toBe(true);
    expect(editor.restyle()).toBe(false);
  });
});

describe('SDK theme changes reach the editor', () => {
  beforeEach(() => {
    globalThis.window = {
      addEventListener() {},
      removeEventListener() {},
      matchMedia() {
        return {
          matches: false,
          addEventListener() {},
          removeEventListener() {},
        };
      },
      location: { href: 'https://host.example' },
    };
    globalThis.document = {
      documentElement: {
        setAttribute() {},
        classList: { add() {}, remove() {} },
        style: { setProperty() {} },
      },
    };
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
  });

  it('sdk.setTheme() restyles an open editor', () => {
    const sdk = createArtifactuse({
      theme: 'dark',
      editor: { modules: createFakeModules(), theme: 'auto' },
    });

    const editor = sdk.editor.create({}, { code: 'const a = 1', sdkTheme: sdk.getTheme() });
    expect(isDarkExtension(editor.view.state.extensions)).toBe(true);

    sdk.setTheme('light');

    expect(sdk.getTheme()).toBe('light');
    expect(lastReconfigureIsDark(editor.view)).toBe(false);
  });
});
