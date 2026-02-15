// artifactuse/core/editor.js
// Optional CodeMirror 6 integration for the edit tab
// Users must provide CodeMirror modules via config.editor.modules

/**
 * Create an editor manager that uses user-provided CodeMirror modules
 *
 * @param {object} editorConfig - config.editor from SDK config
 * @param {object} editorConfig.modules - CodeMirror module imports
 * @param {string} editorConfig.theme - 'dark' | 'light' | 'auto'
 * @returns {object} Editor manager with create/destroy methods
 */
export function createEditorManager(editorConfig = {}) {
	const modules = editorConfig.modules || null;
	let themePreference = editorConfig.theme || 'dark';

	function isAvailable() {
		return !!(modules?.state && modules?.view);
	}

	/**
	 * Build dark theme using EditorView.theme
	 */
	function buildDarkTheme(EditorView) {
		return EditorView.theme({
			'&': {
				backgroundColor: '#1e1e1e',
				color: '#e4e4e7',
				height: '100%',
			},
			'.cm-content': {
				caretColor: 'var(--accent, #60a5fa)',
				fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
				fontSize: '13px',
				lineHeight: '1.6',
				padding: '12px 0',
			},
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: 'var(--accent, #60a5fa)',
				borderLeftWidth: '2px',
			},
			'.cm-selectionBackground, ::selection': {
				backgroundColor: 'rgba(99, 102, 241, 0.3) !important',
			},
			'.cm-focused .cm-selectionBackground': {
				backgroundColor: 'rgba(99, 102, 241, 0.3)',
			},
			'.cm-activeLine': {
				backgroundColor: 'rgba(255, 255, 255, 0.03)',
			},
			'.cm-activeLineGutter': {
				backgroundColor: 'rgba(255, 255, 255, 0.05)',
			},
			'.cm-gutters': {
				backgroundColor: 'transparent',
				color: '#52525b',
				border: 'none',
				paddingRight: '8px',
			},
			'.cm-lineNumbers .cm-gutterElement': {
				padding: '0 8px 0 16px',
				minWidth: '40px',
			},
			'.cm-foldGutter .cm-gutterElement': {
				padding: '0 4px',
				cursor: 'pointer',
				color: '#71717a',
			},
			'.cm-foldGutter .cm-gutterElement:hover': {
				color: '#a1a1aa',
			},
			'.cm-matchingBracket': {
				backgroundColor: 'rgba(99, 102, 241, 0.25)',
				outline: '1px solid rgba(99, 102, 241, 0.5)',
			},
			'.cm-tooltip': {
				backgroundColor: '#27272a',
				border: '1px solid #3f3f46',
				borderRadius: '6px',
			},
			'.cm-tooltip-autocomplete': {
				'& > ul': {
					fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
				},
				'& > ul > li': {
					padding: '4px 8px',
				},
				'& > ul > li[aria-selected]': {
					backgroundColor: 'rgba(99, 102, 241, 0.2)',
				},
			},
			'.cm-scroller': {
				overflow: 'auto',
			},
		}, { dark: true });
	}

	/**
	 * Build light theme using EditorView.theme
	 */
	function buildLightTheme(EditorView) {
		return EditorView.theme({
			'&': {
				backgroundColor: '#ffffff',
				color: '#27272a',
				height: '100%',
			},
			'.cm-content': {
				caretColor: 'var(--accent, #3b82f6)',
				fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
				fontSize: '13px',
				lineHeight: '1.6',
				padding: '12px 0',
			},
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: 'var(--accent, #3b82f6)',
				borderLeftWidth: '2px',
			},
			'.cm-selectionBackground, ::selection': {
				backgroundColor: 'rgba(59, 130, 246, 0.2) !important',
			},
			'.cm-focused .cm-selectionBackground': {
				backgroundColor: 'rgba(59, 130, 246, 0.2)',
			},
			'.cm-activeLine': {
				backgroundColor: 'rgba(0, 0, 0, 0.03)',
			},
			'.cm-activeLineGutter': {
				backgroundColor: 'rgba(0, 0, 0, 0.05)',
			},
			'.cm-gutters': {
				backgroundColor: 'transparent',
				color: '#a1a1aa',
				border: 'none',
				paddingRight: '8px',
			},
			'.cm-lineNumbers .cm-gutterElement': {
				padding: '0 8px 0 16px',
				minWidth: '40px',
			},
			'.cm-foldGutter .cm-gutterElement': {
				padding: '0 4px',
				cursor: 'pointer',
				color: '#a1a1aa',
			},
			'.cm-foldGutter .cm-gutterElement:hover': {
				color: '#71717a',
			},
			'.cm-matchingBracket': {
				backgroundColor: 'rgba(59, 130, 246, 0.15)',
				outline: '1px solid rgba(59, 130, 246, 0.4)',
			},
			'.cm-tooltip': {
				backgroundColor: '#ffffff',
				border: '1px solid #e4e4e7',
				borderRadius: '6px',
				boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
			},
			'.cm-tooltip-autocomplete': {
				'& > ul': {
					fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
				},
				'& > ul > li': {
					padding: '4px 8px',
				},
				'& > ul > li[aria-selected]': {
					backgroundColor: 'rgba(59, 130, 246, 0.1)',
				},
			},
			'.cm-scroller': {
				overflow: 'auto',
			},
		}, { dark: false });
	}

	/**
	 * Build syntax highlighting styles
	 */
	function buildHighlighting(HighlightStyle, tags, isDark) {
		if (isDark) {
			return HighlightStyle.define([
				{ tag: tags.keyword, color: '#c084fc' },
				{ tag: tags.operator, color: '#94a3b8' },
				{ tag: tags.special(tags.variableName), color: '#67e8f9' },
				{ tag: tags.typeName, color: '#fbbf24' },
				{ tag: tags.atom, color: '#fb923c' },
				{ tag: tags.number, color: '#fb923c' },
				{ tag: tags.definition(tags.variableName), color: '#67e8f9' },
				{ tag: tags.string, color: '#86efac' },
				{ tag: tags.special(tags.string), color: '#86efac' },
				{ tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },
				{ tag: tags.variableName, color: '#e4e4e7' },
				{ tag: tags.tagName, color: '#f87171' },
				{ tag: tags.bracket, color: '#a1a1aa' },
				{ tag: tags.meta, color: '#fbbf24' },
				{ tag: tags.link, color: '#60a5fa', textDecoration: 'underline' },
				{ tag: tags.heading, fontWeight: 'bold', color: '#f472b6' },
				{ tag: tags.emphasis, fontStyle: 'italic' },
				{ tag: tags.strong, fontWeight: 'bold' },
				{ tag: tags.strikethrough, textDecoration: 'line-through' },
				{ tag: tags.className, color: '#fbbf24' },
				{ tag: tags.propertyName, color: '#60a5fa' },
				{ tag: tags.function(tags.variableName), color: '#60a5fa' },
				{ tag: tags.function(tags.propertyName), color: '#60a5fa' },
				{ tag: tags.bool, color: '#fb923c' },
				{ tag: tags.null, color: '#fb923c' },
				{ tag: tags.regexp, color: '#f87171' },
			]);
		}

		return HighlightStyle.define([
			{ tag: tags.keyword, color: '#7c3aed' },
			{ tag: tags.operator, color: '#64748b' },
			{ tag: tags.special(tags.variableName), color: '#0891b2' },
			{ tag: tags.typeName, color: '#d97706' },
			{ tag: tags.atom, color: '#ea580c' },
			{ tag: tags.number, color: '#ea580c' },
			{ tag: tags.definition(tags.variableName), color: '#0891b2' },
			{ tag: tags.string, color: '#16a34a' },
			{ tag: tags.special(tags.string), color: '#16a34a' },
			{ tag: tags.comment, color: '#9ca3af', fontStyle: 'italic' },
			{ tag: tags.variableName, color: '#27272a' },
			{ tag: tags.tagName, color: '#dc2626' },
			{ tag: tags.bracket, color: '#71717a' },
			{ tag: tags.meta, color: '#d97706' },
			{ tag: tags.link, color: '#2563eb', textDecoration: 'underline' },
			{ tag: tags.heading, fontWeight: 'bold', color: '#db2777' },
			{ tag: tags.emphasis, fontStyle: 'italic' },
			{ tag: tags.strong, fontWeight: 'bold' },
			{ tag: tags.strikethrough, textDecoration: 'line-through' },
			{ tag: tags.className, color: '#d97706' },
			{ tag: tags.propertyName, color: '#2563eb' },
			{ tag: tags.function(tags.variableName), color: '#2563eb' },
			{ tag: tags.function(tags.propertyName), color: '#2563eb' },
			{ tag: tags.bool, color: '#ea580c' },
			{ tag: tags.null, color: '#ea580c' },
			{ tag: tags.regexp, color: '#dc2626' },
		]);
	}

	/**
	 * Resolve language extension from language string
	 */
	function getLanguageExtension(lang) {
		const normalized = lang?.toLowerCase();
		if ((normalized === 'javascript' || normalized === 'js' || normalized === 'jsx' || normalized === 'tsx' || normalized === 'typescript' || normalized === 'ts') && modules.langJavascript) {
			return modules.langJavascript.javascript();
		}
		if ((normalized === 'python' || normalized === 'py') && modules.langPython) {
			return modules.langPython.python();
		}
		// No language extension — plain text
		return [];
	}

	/**
	 * Resolve whether to use dark theme
	 */
	function isDark(sdkTheme) {
		if (themePreference === 'auto') {
			return sdkTheme === 'dark';
		}
		return themePreference === 'dark';
	}

	/**
	 * Create a CodeMirror editor instance
	 *
	 * @param {HTMLElement} container - DOM element to mount editor in
	 * @param {object} options
	 * @param {string} options.code - Initial code content
	 * @param {string} options.language - Language for syntax highlighting
	 * @param {string} options.sdkTheme - Current SDK theme ('dark'|'light')
	 * @param {function} options.onChange - Called on content changes with new code
	 * @returns {{ view: EditorView, getCode: () => string, setCode: (code: string) => void, destroy: () => void }}
	 */
	function create(container, options = {}) {
		if (!isAvailable()) {
			console.warn('Artifactuse: CodeMirror modules not provided. Editor not available.');
			return null;
		}

		const { EditorState } = modules.state;
		const {
			EditorView, keymap, lineNumbers, highlightActiveLineGutter,
			highlightSpecialChars, drawSelection, dropCursor,
			rectangularSelection, crosshairCursor, highlightActiveLine
		} = modules.view;
		const { defaultKeymap, history, historyKeymap, indentWithTab } = modules.commands;
		const {
			indentOnInput, syntaxHighlighting, bracketMatching,
			foldGutter, foldKeymap, HighlightStyle
		} = modules.language;
		const {
			closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap
		} = modules.autocomplete;

		const tags = modules.lezerHighlight?.tags || modules.language?.tags;
		const dark = isDark(options.sdkTheme);
		const theme = dark ? buildDarkTheme(EditorView) : buildLightTheme(EditorView);

		const extensions = [
			lineNumbers(),
			highlightActiveLineGutter(),
			highlightSpecialChars(),
			history(),
			foldGutter({
				openText: '\u25BE',
				closedText: '\u25B8',
			}),
			drawSelection(),
			dropCursor(),
			EditorState.allowMultipleSelections.of(true),
			indentOnInput(),
			...(tags ? [syntaxHighlighting(buildHighlighting(HighlightStyle, tags, dark))] : []),
			bracketMatching(),
			closeBrackets(),
			autocompletion(),
			rectangularSelection(),
			crosshairCursor(),
			highlightActiveLine(),
			keymap.of([
				...closeBracketsKeymap,
				...defaultKeymap,
				...historyKeymap,
				...foldKeymap,
				...completionKeymap,
				indentWithTab,
			]),
			getLanguageExtension(options.language),
			theme,
		];

		if (options.onChange) {
			extensions.push(
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						options.onChange(update.state.doc.toString());
					}
				})
			);
		}

		const state = EditorState.create({
			doc: options.code || '',
			extensions,
		});

		const view = new EditorView({
			state,
			parent: container,
		});

		return {
			view,
			getCode() {
				return view.state.doc.toString();
			},
			setCode(code) {
				const currentCode = view.state.doc.toString();
				if (currentCode !== code) {
					view.dispatch({
						changes: { from: 0, to: currentCode.length, insert: code },
					});
				}
			},
			destroy() {
				view.destroy();
			},
		};
	}

	function setTheme(newTheme) {
		themePreference = newTheme;
	}

	return {
		isAvailable,
		create,
		setTheme,
	};
}

export default createEditorManager;
