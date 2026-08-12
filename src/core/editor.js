// artifactuse/core/editor.js
// Optional CodeMirror 6 integration for the edit tab
// Users must provide CodeMirror modules via config.editor.modules

/**
 * Resolve whether an editor should render dark.
 *
 * Two independent inputs: the editor's own preference (from config.editor.theme)
 * and the SDK's resolved theme. Only 'auto' defers to the SDK.
 *
 * @param {string} preference - 'dark' | 'light' | 'auto'
 * @param {string} sdkTheme - SDK's resolved theme ('dark' | 'light')
 * @returns {boolean}
 */
export function resolveEditorIsDark(preference, sdkTheme) {
	if (preference === 'auto') {
		return sdkTheme === 'dark';
	}
	return preference === 'dark';
}

/**
 * Create an editor manager that uses user-provided CodeMirror modules
 *
 * @param {object} editorConfig - config.editor from SDK config
 * @param {object} editorConfig.modules - CodeMirror module imports
 * @param {string} [editorConfig.theme='auto'] - 'dark' | 'light' | 'auto'.
 *   'auto' follows the SDK theme and restyles open editors when it changes.
 * @returns {object} Editor manager with create/destroy methods
 */
export function createEditorManager(editorConfig = {}) {
	const modules = editorConfig.modules || null;
	let themePreference = editorConfig.theme || 'auto';

	// SDK's resolved theme — kept live via setSdkTheme(), unlike the per-create
	// options.sdkTheme which goes stale as soon as the host changes theme.
	let sdkTheme = 'dark';

	// Editors currently mounted, so a theme change can reach them
	const liveEditors = new Set();

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
	 * Language → CodeMirror module mapping
	 * Each entry: { mod: module key in config.editor.modules, fn: factory function name, opts?: options }
	 */
	const LANG_MAP = {
		'javascript': { mod: 'langJavascript', fn: 'javascript' },
		'js':         { mod: 'langJavascript', fn: 'javascript' },
		'jsx':        { mod: 'langJavascript', fn: 'javascript', opts: { jsx: true } },
		'typescript': { mod: 'langJavascript', fn: 'javascript', opts: { typescript: true } },
		'ts':         { mod: 'langJavascript', fn: 'javascript', opts: { typescript: true } },
		'tsx':        { mod: 'langJavascript', fn: 'javascript', opts: { jsx: true, typescript: true } },
		'python':     { mod: 'langPython', fn: 'python' },
		'py':         { mod: 'langPython', fn: 'python' },
		'html':       { mod: 'langHtml', fn: 'html' },
		'htm':        { mod: 'langHtml', fn: 'html' },
		'css':        { mod: 'langCss', fn: 'css' },
		'json':       { mod: 'langJson', fn: 'json' },
		'markdown':   { mod: 'langMarkdown', fn: 'markdown' },
		'md':         { mod: 'langMarkdown', fn: 'markdown' },
		'xml':        { mod: 'langXml', fn: 'xml' },
		'yaml':       { mod: 'langYaml', fn: 'yaml' },
		'yml':        { mod: 'langYaml', fn: 'yaml' },
		'sql':        { mod: 'langSql', fn: 'sql' },
		'java':       { mod: 'langJava', fn: 'java' },
		'cpp':        { mod: 'langCpp', fn: 'cpp' },
		'c':          { mod: 'langCpp', fn: 'cpp' },
		'c++':        { mod: 'langCpp', fn: 'cpp' },
		'go':         { mod: 'langGo', fn: 'go' },
		'golang':     { mod: 'langGo', fn: 'go' },
		'rust':       { mod: 'langRust', fn: 'rust' },
		'rs':         { mod: 'langRust', fn: 'rust' },
		'php':        { mod: 'langPhp', fn: 'php' },
		'vue':        { mod: 'langVue', fn: 'vue' },
		'angular':    { mod: 'langAngular', fn: 'angular' },
		'less':       { mod: 'langLess', fn: 'less' },
		'sass':       { mod: 'langSass', fn: 'sass', opts: { indented: true } },
		'scss':       { mod: 'langSass', fn: 'sass' },
	};

	/**
	 * Resolve language extension from language string
	 */
	function getLanguageExtension(lang) {
		const entry = LANG_MAP[lang?.toLowerCase()];
		if (!entry) return [];
		const mod = modules[entry.mod];
		if (!mod || typeof mod[entry.fn] !== 'function') return [];
		return entry.opts ? mod[entry.fn](entry.opts) : mod[entry.fn]();
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
	 * @returns {{ view: EditorView, getCode: () => string, setCode: (code: string) => void, restyle: () => boolean, destroy: () => void }}
	 */
	function create(container, options = {}) {
		if (!isAvailable()) {
			console.warn('Artifactuse: CodeMirror modules not provided. Editor not available.');
			return null;
		}

		const { EditorState, Compartment } = modules.state;
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

		// Seed from the caller — panels pass instance.getTheme(), the freshest value
		if (options.sdkTheme) {
			sdkTheme = options.sdkTheme;
		}

		// Per-instance: a compartment shared across editors would reconfigure
		// whichever one dispatched last.
		const themeCompartment = Compartment ? new Compartment() : null;

		function themeExtensions() {
			const dark = resolveEditorIsDark(themePreference, sdkTheme);
			return [
				...(tags ? [syntaxHighlighting(buildHighlighting(HighlightStyle, tags, dark))] : []),
				dark ? buildDarkTheme(EditorView) : buildLightTheme(EditorView),
			];
		}

		// What's currently mounted, so pinned editors skip pointless transactions
		let appliedDark = resolveEditorIsDark(themePreference, sdkTheme);

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
			// Theme + syntax highlighting, swappable without rebuilding the view
			themeCompartment ? themeCompartment.of(themeExtensions()) : themeExtensions(),
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

		const entry = {
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
			// Swap the theme in place — preserves doc, selection, scroll and undo history
			restyle() {
				if (!themeCompartment) return false;

				const dark = resolveEditorIsDark(themePreference, sdkTheme);
				if (dark === appliedDark) return false;
				appliedDark = dark;

				view.dispatch({
					effects: themeCompartment.reconfigure(themeExtensions()),
				});
				return true;
			},
			destroy() {
				liveEditors.delete(entry);
				view.destroy();
			},
		};

		liveEditors.add(entry);

		return entry;
	}

	function refreshTheme() {
		liveEditors.forEach((entry) => entry.restyle());
	}

	/**
	 * Track the SDK's resolved theme. Called by the SDK when the theme changes;
	 * only affects editors whose preference is 'auto'.
	 */
	function setSdkTheme(resolved) {
		if (!resolved || resolved === sdkTheme) return;
		sdkTheme = resolved;
		refreshTheme();
	}

	/**
	 * Set the editor's own theme preference ('dark' | 'light' | 'auto')
	 */
	function setTheme(preference) {
		if (!preference || preference === themePreference) return;
		themePreference = preference;
		refreshTheme();
	}

	return {
		isAvailable,
		create,
		setTheme,
		setSdkTheme,
	};
}

export default createEditorManager;
