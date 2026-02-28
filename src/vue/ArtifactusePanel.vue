<template>
  <!-- Main panel (flex child when not fullscreen) -->
  <Transition name="artifactuse-panel">
    <div 
      v-if="state.isPanelOpen"
      class="artifactuse-panel"
      :class="{ 
        'artifactuse-panel--fullscreen': state.isFullscreen,
        'artifactuse-panel--list': !activeArtifact && hasArtifacts,
        'artifactuse-panel--empty': !hasArtifacts
      }"
      :style="!state.isFullscreen ? { width: `${effectivePanelWidth}%` } : undefined"
    >
      <!-- Resize handle (left edge) -->
      <div 
        v-if="!state.isFullscreen"
        class="artifactuse-panel__resize-handle"
        @mousedown.prevent="startPanelResize"
      >
        <div class="artifactuse-panel__resize-handle-line"></div>
      </div>

      <!-- ============================================ -->
      <!-- EMPTY STATE: No artifacts -->
      <!-- ============================================ -->
      <template v-if="!hasArtifacts">
        <header class="artifactuse-panel__header artifactuse-panel__header--simple">
          <div class="artifactuse-panel__title">
            <span class="artifactuse-panel__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </span>
            <div class="artifactuse-panel__title-content">
              <span class="artifactuse-panel__name">Artifacts</span>
            </div>
          </div>
          <div class="artifactuse-panel__actions">
            <button 
              class="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close panel"
              @click="closePanel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>
        
        <div class="artifactuse-panel__empty">
          <div class="artifactuse-panel__empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <h3 class="artifactuse-panel__empty-title">No artifacts yet</h3>
          <p class="artifactuse-panel__empty-text">
            Code blocks, forms, and other interactive content will appear here as the AI generates them.
          </p>
        </div>
        
        <footer class="artifactuse-panel__footer artifactuse-panel__footer--simple">
          <a 
            v-if="showBranding"
            href="https://artifactuse.com" 
            target="_blank" 
            rel="noopener noreferrer"
            class="artifactuse-panel__branding"
          >
            <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
              <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
            </svg>
            <span>Artifactuse</span>
          </a>
        </footer>
      </template>

      <!-- ============================================ -->
      <!-- LIST VIEW: Has artifacts but none selected -->
      <!-- ============================================ -->
      <template v-else-if="!activeArtifact">
        <header class="artifactuse-panel__header artifactuse-panel__header--simple">
          <div class="artifactuse-panel__title">
            <span class="artifactuse-panel__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </span>
            <div class="artifactuse-panel__title-content">
              <span class="artifactuse-panel__name">Artifacts</span>
              <span class="artifactuse-panel__meta">{{ nonInlineArtifacts.length }} available</span>
            </div>
          </div>
          <div class="artifactuse-panel__actions">
            <!-- Download All button -->
            <button 
              class="artifactuse-panel__action"
              :class="{ 'artifactuse-panel__action--loading': isDownloadingAll }"
              :disabled="isDownloadingAll"
              title="Download all as ZIP"
              @click="handleDownloadAll"
            >
              <svg v-if="!isDownloadingAll" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <svg v-else class="artifactuse-panel__spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"></circle>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close panel"
              @click="closePanel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>
        
        <div class="artifactuse-panel__list">
          <div class="artifactuse-panel__list-items">
            <button
              v-for="(artifact, index) in nonInlineArtifacts"
              :key="artifact.id"
              class="artifactuse-panel__list-item"
              @click="selectArtifact(artifact)"
            >
              <span 
                class="artifactuse-panel__list-item-icon"
                v-html="getArtifactIcon(artifact.language)"
              ></span>
              <div class="artifactuse-panel__list-item-content">
                <span class="artifactuse-panel__list-item-title">
                  {{ artifact.title || 'Untitled' }}
                </span>
                <span class="artifactuse-panel__list-item-meta">
                  {{ getLanguageDisplayName(artifact.language) }}
                  <template v-if="artifact.lineCount">
                    • {{ artifact.lineCount }} lines
                  </template>
                </span>
              </div>
              <span class="artifactuse-panel__list-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            </button>
          </div>
        </div>
        
        <footer class="artifactuse-panel__footer artifactuse-panel__footer--simple">
          <a 
            v-if="showBranding"
            href="https://artifactuse.com" 
            target="_blank" 
            rel="noopener noreferrer"
            class="artifactuse-panel__branding"
          >
            <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
              <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
            </svg>
            <span>Artifactuse</span>
          </a>
        </footer>
      </template>

      <!-- ============================================ -->
      <!-- DETAIL VIEW: Active artifact selected -->
      <!-- ============================================ -->
      <template v-else>
        <!-- Panel header -->
        <header class="artifactuse-panel__header">
          <!-- Back button (only when navigated from list view) -->
          <button 
            v-if="cameFromList"
            class="artifactuse-panel__back"
            title="Back to list"
            @click="goBackToList"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <div class="artifactuse-panel__title">
            <span 
              class="artifactuse-panel__icon"
              v-html="languageIcon"
            ></span>
            <div class="artifactuse-panel__title-content">
              <span class="artifactuse-panel__name">{{ activeArtifact.title || 'Untitled' }}</span>
              <span class="artifactuse-panel__meta">
                {{ languageDisplay }}
                <template v-if="activeArtifact.lineCount">
                  • {{ activeArtifact.lineCount }} lines
                </template>
              </span>
            </div>
          </div>
          
          <!-- View mode tabs (icon only) -->
          <div class="artifactuse-panel__tabs">
            <button
              v-if="!activeArtifact.tabs || activeArtifact.tabs.includes('preview')"
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'preview' }"
              :disabled="!activeArtifact.isPreviewable"
              title="Preview"
              @click="setViewMode('preview')"
            >
              <!-- Eye icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button
              v-if="!activeArtifact.tabs || activeArtifact.tabs.includes('code')"
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'code' }"
              title="Code"
              @click="setViewMode('code')"
            >
              <!-- Code icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            <button
              v-if="!activeArtifact.tabs || activeArtifact.tabs.includes('split')"
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'split' }"
              :disabled="!activeArtifact.isPreviewable"
              title="Split view"
              @click="setViewMode('split')"
            >
              <!-- Split icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="3" x2="12" y2="21"></line>
              </svg>
            </button>
            <button
              v-if="activeArtifact.tabs && activeArtifact.tabs.includes('edit') && isEditorAvailable"
              class="artifactuse-panel__tab"
              :class="{ 'artifactuse-panel__tab--active': state.viewMode === 'edit' }"
              title="Edit"
              @click="setViewMode('edit')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>

          <!-- Header actions (icon only) -->
          <div class="artifactuse-panel__actions">
            <button
              v-if="state.viewMode === 'edit'"
              class="artifactuse-panel__action artifactuse-panel__action--save"
              title="Save"
              @click="handleEditorSave"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </button>
            <button
              class="artifactuse-panel__action"
              :title="state.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'"
              @click="toggleFullscreen"
            >
              <svg v-if="!state.isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
            
            <button 
              class="artifactuse-panel__action artifactuse-panel__action--close"
              title="Close panel"
              @click="closePanel"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>
        
        <!-- Panel content -->
        <div
          ref="contentRef"
          class="artifactuse-panel__content"
          :class="[
            `artifactuse-panel__content--${state.viewMode}`,
            { 'artifactuse-panel__content--transitioning': isTransitioning }
          ]"
        >
          <!-- Transition overlay -->
          <div v-if="isTransitioning" class="artifactuse-panel__loading">
            <div class="artifactuse-panel__spinner"></div>
          </div>

          <!-- Preview pane -->
          <div
            v-if="state.viewMode === 'preview' || state.viewMode === 'split'"
            class="artifactuse-panel__preview"
            :style="state.viewMode === 'split' ? { width: `${splitPosition}%` } : undefined"
          >
            <!-- Loading spinner -->
            <div v-if="iframeLoading && panelUrl" class="artifactuse-panel__loading">
              <div class="artifactuse-panel__spinner"></div>
            </div>
            
            <iframe
              v-if="panelUrl"
              ref="iframeRef"
              :src="panelUrl"
              class="artifactuse-panel__iframe"
              :class="{ 'artifactuse-panel__iframe--loading': iframeLoading }"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
              allow="camera; microphone; fullscreen; geolocation; display-capture; autoplay; clipboard-write"
              @load="handleIframeLoad"
              @error="handleIframeError"
            ></iframe>
            <div v-else class="artifactuse-panel__no-preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 17H7A5 5 0 0 1 7 7h2"></path>
                <path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <p>Preview not available for {{ languageDisplay }}</p>
            </div>
          </div>
          
          <!-- Code pane - always mounted, shown/hidden via v-show -->
          <div
            v-show="state.viewMode === 'code' || state.viewMode === 'split'"
            class="artifactuse-panel__code"
            :style="state.viewMode === 'split' ? { width: `${100 - splitPosition}%` } : undefined"
          >
            <!-- Split resize handle (inside code pane) -->
            <div 
              v-if="state.viewMode === 'split'"
              class="artifactuse-panel__split-handle"
              @mousedown.prevent="startSplitResize"
            >
              <div class="artifactuse-panel__split-handle-line"></div>
            </div>
            
            <div class="artifactuse-panel__code-scroll" ref="codeScrollRef" @scroll="handleCodeScroll">
              <div class="artifactuse-panel__line-numbers" ref="lineNumbersRef"></div>
              <pre class="artifactuse-panel__code-block" :class="`language-${normalizedLanguage}`"><code
                ref="codeRef"
                :key="activeArtifact.id"
                :class="`language-${normalizedLanguage}`"
              ></code></pre>
            </div>
          </div>

          <!-- Edit pane (CodeMirror) -->
          <div
            v-show="state.viewMode === 'edit'"
            class="artifactuse-panel__edit"
          >
            <div ref="editorContainerRef" class="artifactuse-panel__editor-container"></div>
          </div>
        </div>

        <!-- Panel footer -->
        <footer class="artifactuse-panel__footer">
          <div class="artifactuse-panel__footer-left">
            <!-- Powered by Artifactuse -->
            <a 
              v-if="showBranding"
              href="https://artifactuse.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="artifactuse-panel__branding"
            >
              <svg width="16" height="16" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
              </svg>
              <span>Artifactuse</span>
            </a>
            
            <!-- Size badge -->
            <span v-if="activeArtifact.size" class="artifactuse-panel__badge">
              {{ formatBytes(activeArtifact.size) }}
            </span>
          </div>
          
          <div class="artifactuse-panel__footer-right">
            <!-- Copy button (icon only) -->
            <button 
              class="artifactuse-panel__footer-action"
              :class="{ 'artifactuse-panel__footer-action--success': copied }"
              :title="copied ? 'Copied!' : 'Copy code'"
              @click="handleCopy"
            >
              <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            
            <!-- Download button (icon only) -->
            <button
              class="artifactuse-panel__footer-action"
              title="Download file"
              @click="handleDownload"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>

            <!-- Share button + popup -->
            <div v-if="sharingEnabled" style="position: relative;">
              <button
                class="artifactuse-panel__footer-action"
                title="Share"
                @click="toggleSharePopup"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>

              <!-- Share popup -->
              <Transition name="artifactuse-popup">
                <div v-if="showShareModal" class="artifactuse-share-popup">
                  <div class="artifactuse-share-popup__header">
                    <span class="artifactuse-share-popup__title">
                      {{ shareModalState === 'success' ? (updatedArtifactName ? 'Artifact updated!' : 'Link created!') : shareModalState === 'update-list' ? 'Update saved artifact' : 'Share Artifact' }}
                    </span>
                    <button class="artifactuse-share-popup__close" @click="closeShareModal">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div class="artifactuse-share-popup__body">
                    <!-- Loading state -->
                    <div v-if="shareModalState === 'loading'" class="artifactuse-share-popup__loading">
                      <div class="artifactuse-share-popup__spinner"></div>
                      <p class="artifactuse-share-popup__loading-text">Creating link...</p>
                    </div>

                    <!-- Error state -->
                    <div v-else-if="shareModalState === 'error'">
                      <div class="artifactuse-share-popup__error">
                        <p class="artifactuse-share-popup__error-text">{{ shareError }}</p>
                      </div>
                      <div class="artifactuse-share-popup__actions">
                        <button class="artifactuse-share-popup__btn artifactuse-share-popup__btn--secondary" @click="shareModalState = 'options'">
                          Back
                        </button>
                        <button class="artifactuse-share-popup__btn artifactuse-share-popup__btn--primary" @click="retryShare">
                          Retry
                        </button>
                      </div>
                    </div>

                    <!-- Options state (initial) -->
                    <div v-else-if="shareModalState === 'options'" class="artifactuse-share-popup__options">
                      <button class="artifactuse-share-popup__option" @click="handleQuickShare">
                        <div class="artifactuse-share-popup__option-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </div>
                        <div class="artifactuse-share-popup__option-content">
                          <p class="artifactuse-share-popup__option-title">Share link</p>
                          <p class="artifactuse-share-popup__option-desc">Expires in 30 days</p>
                        </div>
                      </button>
                      <button class="artifactuse-share-popup__option" @click="handleSaveOption">
                        <div class="artifactuse-share-popup__option-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                          </svg>
                        </div>
                        <div class="artifactuse-share-popup__option-content">
                          <p class="artifactuse-share-popup__option-title">Save to account</p>
                          <p class="artifactuse-share-popup__option-desc">Permanent, manageable</p>
                        </div>
                      </button>
                      <button class="artifactuse-share-popup__option" @click="handleUpdateOption">
                        <div class="artifactuse-share-popup__option-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </div>
                        <div class="artifactuse-share-popup__option-content">
                          <p class="artifactuse-share-popup__option-title">Update saved</p>
                          <p class="artifactuse-share-popup__option-desc">Replace an existing artifact</p>
                        </div>
                      </button>
                    </div>

                    <!-- Update list state -->
                    <div v-else-if="shareModalState === 'update-list'">
                      <div v-if="savedArtifactsLoading" class="artifactuse-share-popup__loading">
                        <div class="artifactuse-share-popup__spinner"></div>
                        <p class="artifactuse-share-popup__loading-text">Loading artifacts...</p>
                      </div>
                      <div v-else-if="savedArtifacts.length === 0" class="artifactuse-share-popup__empty">
                        No saved artifacts of this type
                      </div>
                      <div v-else class="artifactuse-share-popup__artifact-list">
                        <button
                          v-for="artifact in savedArtifacts"
                          :key="artifact.project?.uuid || artifact.id"
                          class="artifactuse-share-popup__artifact-item"
                          @click="handleUpdateArtifact(artifact)"
                        >
                          <span class="artifactuse-share-popup__artifact-name">{{ artifact.project?.name || 'Untitled' }}</span>
                          <span class="artifactuse-share-popup__artifact-date">{{ formatExpiryDate(artifact.project?.created_at) }}</span>
                        </button>
                      </div>
                      <button class="artifactuse-share-popup__back-btn" @click="shareModalState = 'options'">Back</button>
                    </div>

                    <!-- Success state -->
                    <div v-else-if="shareModalState === 'success'" class="artifactuse-share-popup__success">
                      <div class="artifactuse-share-popup__success-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div class="artifactuse-share-popup__link-wrapper">
                        <input
                          type="text"
                          class="artifactuse-share-popup__link"
                          :value="shareUrl"
                          readonly
                          @click="$event.target.select()"
                        />
                        <button
                          class="artifactuse-share-popup__copy-btn"
                          :class="{ 'artifactuse-share-popup__copy-btn--copied': shareLinkCopied }"
                          @click="copyShareLink"
                        >
                          {{ shareLinkCopied ? 'Copied!' : 'Copy' }}
                        </button>
                      </div>
                      <div v-if="shareExpiresAt && !shareIsSaved" class="artifactuse-share-popup__expiry">
                        <span class="artifactuse-share-popup__expiry-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </span>
                        <span class="artifactuse-share-popup__expiry-text">
                          Expires {{ formatExpiryDate(shareExpiresAt) }}
                        </span>
                      </div>
                      <div v-if="!shareIsSaved" class="artifactuse-share-popup__save-prompt">
                        <p class="artifactuse-share-popup__save-prompt-text">Keep it permanently?</p>
                        <button class="artifactuse-share-popup__save-prompt-btn" @click="handleSaveOption">
                          Save to account
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="artifactuse-share-popup__footer">
                    <a href="https://artifactuse.com" target="_blank" rel="noopener noreferrer" class="artifactuse-share-popup__branding">
                      <svg width="12" height="12" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.6667 41.6673V10.4173C16.6667 9.86478 16.4472 9.33488 16.0565 8.94418C15.6658 8.55348 15.1359 8.33398 14.5833 8.33398H4.16667C3.0616 8.33398 2.00179 8.77297 1.22039 9.55437C0.438987 10.3358 0 11.3956 0 12.5007V37.5006C0 38.6057 0.438987 39.6655 1.22039 40.4469C2.00179 41.2283 3.0616 41.6673 4.16667 41.6673H29.1667C30.2717 41.6673 31.3315 41.2283 32.1129 40.4469C32.8943 39.6655 33.3333 38.6057 33.3333 37.5006V27.084C33.3333 26.5314 33.1138 26.0015 32.7231 25.6108C32.3324 25.2201 31.8025 25.0007 31.25 25.0007H0" fill="#5F51C8"/>
                        <path d="M39.5833 0H27.0833C25.9327 0 25 0.93274 25 2.08333V14.5833C25 15.7339 25.9327 16.6667 27.0833 16.6667H39.5833C40.7339 16.6667 41.6667 15.7339 41.6667 14.5833V2.08333C41.6667 0.93274 40.7339 0 39.5833 0Z" fill="#695AE0"/>
                      </svg>
                      <span>Powered by Artifactuse</span>
                    </a>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Open in new tab (icon only) -->
            <button 
              v-if="panelUrl"
              class="artifactuse-panel__footer-action"
              title="Open in new tab"
              @click="handleOpenInNewTab"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </button>
            
            <!-- Artifact navigation (if multiple non-inline) -->
            <div 
              v-if="nonInlineArtifacts.length > 1"
              class="artifactuse-panel__nav"
            >
              <button 
                class="artifactuse-panel__nav-btn"
                :disabled="currentNonInlineIndex <= 0"
                title="Previous artifact"
                @click="navigateToPrevNonInline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              
              <!-- Clickable indicator that opens popup -->
              <button 
                class="artifactuse-panel__nav-trigger"
                title="View all artifacts"
                @click="toggleArtifactList"
              >
                <span>{{ currentNonInlineIndex + 1 }} / {{ nonInlineArtifacts.length }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              <button 
                class="artifactuse-panel__nav-btn"
                :disabled="currentNonInlineIndex >= nonInlineArtifacts.length - 1"
                title="Next artifact"
                @click="navigateToNextNonInline"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              
              <!-- Artifact list popup -->
              <Transition name="artifactuse-popup">
                <div 
                  v-if="showArtifactList"
                  class="artifactuse-panel__artifact-list"
                >
                  <div class="artifactuse-panel__artifact-list-header">
                    <span>Artifacts</span>
                    <button 
                      class="artifactuse-panel__artifact-list-close"
                      @click="showArtifactList = false"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div class="artifactuse-panel__artifact-list-items">
                    <button
                      v-for="(artifact, index) in nonInlineArtifacts"
                      :key="artifact.id"
                      class="artifactuse-panel__artifact-item"
                      :class="{ 'artifactuse-panel__artifact-item--active': artifact.id === activeArtifact.id }"
                      @click="selectArtifact(artifact)"
                    >
                      <span 
                        class="artifactuse-panel__artifact-item-icon"
                        v-html="getArtifactIcon(artifact.language)"
                      ></span>
                      <div class="artifactuse-panel__artifact-item-content">
                        <span class="artifactuse-panel__artifact-item-title">
                          {{ artifact.title || 'Untitled' }}
                        </span>
                        <span class="artifactuse-panel__artifact-item-meta">
                          {{ getLanguageDisplayName(artifact.language) }}
                          <template v-if="artifact.lineCount">
                            • {{ artifact.lineCount }} lines
                          </template>
                        </span>
                      </div>
                      <span class="artifactuse-panel__artifact-item-index">
                        {{ index + 1 }}
                      </span>
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </footer>
      </template>
    </div>
  </Transition>

</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useArtifactuse } from './index.js';
import { getLanguageDisplayName, getFileExtension, getLanguageIcon, formatBytes, computeSimpleDiff } from '../core/detector.js';
import { normalizeLanguage as normalizeLang, isPrismAvailable } from '../core/highlight.js';
import JSZip from 'jszip';

// Emits
const emit = defineEmits(['close', 'ai-request', 'save', 'export', 'resize']);

const props = defineProps({
  panelWidth: { type: Number, default: undefined },
  splitPosition: { type: Number, default: undefined },
});

// Composable
const { 
  state, 
  activeArtifact, 
  artifactCount,
  hasArtifacts,
  closePanel, 
  toggleFullscreen, 
  setViewMode,
  getPanelUrl,
  openArtifact,
  instance,
} = useArtifactuse();

// Refs
const iframeRef = ref(null);
const codeRef = ref(null);
const contentRef = ref(null);
const lineNumbersRef = ref(null);
const codeScrollRef = ref(null);
const editorContainerRef = ref(null);
const copied = ref(false);
const showArtifactList = ref(false);
const iframeLoading = ref(true);
const isTransitioning = ref(false);
const cameFromList = ref(false); // Track if user navigated from list view
const isDownloadingAll = ref(false); // Track download all progress

// Share modal state
const showShareModal = ref(false);
const shareModalState = ref('options'); // 'options' | 'email' | 'loading' | 'success' | 'verify' | 'error'
const shareUrl = ref('');
const shareExpiresAt = ref(null);
const shareError = ref('');
const shareLinkCopied = ref(false);
const shareIsSaved = ref(false);
const savedArtifacts = ref([]);
const savedArtifactsLoading = ref(false);
const updatedArtifactName = ref('');

// Timers
let streamEndTimer = null;
let iframeLoadTimer = null;

// Editor (CodeMirror) instance — not reactive to avoid proxy overhead
let editorInstance = null;
const isEditorAvailable = computed(() => instance.editor?.isAvailable() || false);

// Panel width (percentage) — prop > global config > default
const panelWidth = ref(
  Math.min(Math.max(props.panelWidth ?? instance.config?.panelWidth ?? 65, 25), 75)
);
const splitPosition = ref(
  Math.min(Math.max(props.splitPosition ?? instance.config?.splitPosition ?? 50, 20), 80)
);

// Computed
const languageDisplay = computed(() => {
  if (!activeArtifact.value) return '';
  return getLanguageDisplayName(activeArtifact.value.language);
});

const languageIcon = computed(() => {
  if (!activeArtifact.value) return '';
  const iconPath = getLanguageIcon(activeArtifact.value.language);
  if (!iconPath) return '';
  return `<svg viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>`;
});

const panelUrl = computed(() => {
  if (!activeArtifact.value) return null;
  let url = getPanelUrl(activeArtifact.value);
  if (url && activeArtifact.value._refreshToken) {
    url += (url.includes('?') ? '&' : '?') + '_t=' + activeArtifact.value._refreshToken;
  }
  return url;
});

const currentArtifactIndex = computed(() => {
  if (!activeArtifact.value || !state.artifacts.length) return -1;
  return state.artifacts.findIndex(a => a.id === activeArtifact.value.id);
});

const normalizedLanguage = computed(() => {
  if (!activeArtifact.value) return 'plaintext';
  return normalizeLang(activeArtifact.value.language || 'plaintext');
});

const nonInlineArtifacts = computed(() => {
  return state.artifacts.filter(a => !a.isInline);
});

const currentNonInlineIndex = computed(() => {
  if (!activeArtifact.value) return -1;
  return nonInlineArtifacts.value.findIndex(a => a.id === activeArtifact.value.id);
});

const showBranding = computed(() => {
  // Check if branding is enabled in config (defaults to true)
  return instance.config?.branding !== false;
});

const sharingEnabled = computed(() => {
  return instance.share?.enabled !== false;
});

const isAuthenticated = computed(() => {
  return instance.share?.isAuthenticated() || false;
});

// Effective panel width - smaller for list/empty views
const effectivePanelWidth = computed(() => {
  if (!activeArtifact.value) {
    // List or empty view - use smaller width (30% or min 320px equivalent)
    return Math.min(panelWidth.value, 30);
  }
  return panelWidth.value;
});

// Helper function to get artifact icon
function getArtifactIcon(language) {
  const iconPath = getLanguageIcon(language);
  if (!iconPath) return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  return `<svg viewBox="0 0 24 24" fill="currentColor">${iconPath}</svg>`;
}

// Go back to list view
function goBackToList() {
  cameFromList.value = false;
  instance.state.clearActiveArtifact();
}

// Smartdiff: per-line language-aware highlighting
function highlightSmartDiff(artifact) {
  if (artifact.language !== 'smartdiff') return null;
  try {
    const data = JSON.parse(artifact.code);
    if (data.oldCode === undefined || data.newCode === undefined) return null;
    const lang = data.language || 'plaintext';
    const grammar = isPrismAvailable() && window.Prism.languages[lang];
    const diffLines = computeSimpleDiff(data.oldCode, data.newCode).split('\n');

    const highlighted = diffLines.map(line => {
      const prefix = line[0];
      const content = line.slice(1);
      const hl = grammar ? window.Prism.highlight(content, grammar, lang) : content;
      if (prefix === '-') return `<span class="token deleted">${hl}</span>`;
      if (prefix === '+') return `<span class="token inserted">${hl}</span>`;
      return hl;
    }).join('\n');

    return { html: highlighted, lineCount: diffLines.length };
  } catch { return null; }
}

// Line numbers generation
function generateLineNumbers() {
  if (lineNumbersRef.value && activeArtifact.value?.code) {
    const sd = highlightSmartDiff(activeArtifact.value);
    const lines = sd ? sd.lineCount : activeArtifact.value.code.split('\n').length;
    lineNumbersRef.value.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
  }
}

// Prism highlighting
function highlightCode() {
  if (codeRef.value && isPrismAvailable() && activeArtifact.value?.code) {
    const sd = highlightSmartDiff(activeArtifact.value);
    if (sd) {
      codeRef.value.innerHTML = sd.html;
    } else {
      const grammar = window.Prism.languages[normalizedLanguage.value];
      if (grammar) {
        codeRef.value.innerHTML = window.Prism.highlight(
          activeArtifact.value.code,
          grammar,
          normalizedLanguage.value
        );
      } else {
        codeRef.value.textContent = activeArtifact.value.code;
      }
    }
    codeRef.value.dataset.highlighted = 'true';

    // Sync Prism background to containers
    nextTick(() => {
      syncPrismBackground();
    });
  }
}

// Sync Prism theme background to code containers
function syncPrismBackground() {
  const pre = codeRef.value?.closest('pre');
  if (pre && codeScrollRef.value && lineNumbersRef.value) {
    const computedStyle = window.getComputedStyle(pre);
    const bgColor = computedStyle.backgroundColor;
    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      codeScrollRef.value.style.backgroundColor = bgColor;
      lineNumbersRef.value.style.backgroundColor = bgColor;
    }
  }
}

// Reset code container inline styles
function resetCodeContainerStyles() {
  if (codeScrollRef.value) {
    codeScrollRef.value.style.backgroundColor = '';
  }
  if (lineNumbersRef.value) {
    lineNumbersRef.value.style.backgroundColor = '';
  }
}

// Update code view (line numbers + highlighting)
function updateCodeView() {
  nextTick(() => {
    generateLineNumbers();
    highlightCode();
  });
}

// Editor (CodeMirror) functions
function initEditor() {
  if (!isEditorAvailable.value || !editorContainerRef.value || !activeArtifact.value) return;
  destroyEditor();
  editorInstance = instance.editor.create(editorContainerRef.value, {
    code: activeArtifact.value.code || '',
    language: activeArtifact.value.editorLanguage || activeArtifact.value.language || 'plaintext',
    sdkTheme: instance.getTheme(),
  });
}

function destroyEditor() {
  if (editorInstance) {
    editorInstance.destroy();
    editorInstance = null;
  }
}

function handleEditorSave() {
  if (!editorInstance || !activeArtifact.value) return;
  const code = editorInstance.getCode();
  instance.emit('edit:save', {
    artifactId: activeArtifact.value.id,
    artifact: activeArtifact.value,
    code,
  });
}

// Methods
function handleIframeLoad() {
  clearTimeout(iframeLoadTimer);
  iframeLoading.value = false;
  if (iframeRef.value && activeArtifact.value) {
    instance.bridge.setIframe(iframeRef.value);
    instance.bridge.loadArtifact(activeArtifact.value);
  }
}

function handleIframeError() {
  clearTimeout(iframeLoadTimer);
  iframeLoading.value = false;
}

function startIframeLoadTimeout() {
  clearTimeout(iframeLoadTimer);
  iframeLoadTimer = setTimeout(() => {
    // Hide loader after 10 seconds even if load event doesn't fire
    iframeLoading.value = false;
  }, 1000);
}

async function handleCopy() {
  if (!activeArtifact.value) return;
  
  try {
    await navigator.clipboard.writeText(activeArtifact.value.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

function handleDownload() {
  if (!activeArtifact.value) return;
  
  const { code, language, title } = activeArtifact.value;
  const extension = getFileExtension(language);
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`;
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function handleDownloadAll() {
  if (isDownloadingAll.value || nonInlineArtifacts.value.length === 0) return;
  
  isDownloadingAll.value = true;
  
  try {
    const zip = new JSZip();
    const usedFilenames = new Map(); // Track used filenames to handle duplicates
    
    for (const artifact of nonInlineArtifacts.value) {
      if (!artifact.code) continue; // Skip empty artifacts
      
      const extension = getFileExtension(artifact.language);
      let baseFilename = (artifact.title || 'untitled')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, ''); // Remove special characters
      
      // Handle duplicate filenames
      let filename = `${baseFilename}.${extension}`;
      const count = usedFilenames.get(filename) || 0;
      if (count > 0) {
        filename = `${baseFilename}-${count}.${extension}`;
      }
      usedFilenames.set(`${baseFilename}.${extension}`, count + 1);
      
      zip.file(filename, artifact.code);
    }
    
    // Generate zip and trigger download
    const blob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const zipFilename = `artifacts-${timestamp}.zip`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to create ZIP:', error);
  } finally {
    isDownloadingAll.value = false;
  }
}

// Share methods
function toggleSharePopup() {
  if (showShareModal.value) {
    showShareModal.value = false;
    return;
  }

  if (!activeArtifact.value) return;

  // Reset popup state
  shareModalState.value = 'options';
  shareUrl.value = '';
  shareExpiresAt.value = null;
  shareError.value = '';
  shareLinkCopied.value = false;
  shareIsSaved.value = false;
  savedArtifacts.value = [];
  savedArtifactsLoading.value = false;
  updatedArtifactName.value = '';

  showShareModal.value = true;
}

function closeShareModal() {
  showShareModal.value = false;
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function handleQuickShare() {
  if (!activeArtifact.value || !instance.share) return;

  shareModalState.value = 'loading';
  shareError.value = '';

  try {
    const result = await instance.share.share(activeArtifact.value);
    shareUrl.value = result.url;
    shareExpiresAt.value = result.expiresAt;
    shareIsSaved.value = false;
    shareModalState.value = 'success';
  } catch (error) {
    shareError.value = error.message || 'Failed to create share link';
    shareModalState.value = 'error';
  }
}

async function handleSaveOption() {
  // If already authenticated, go straight to save
  if (isAuthenticated.value) {
    handleSave();
  } else {
    // Open auth popup
    shareModalState.value = 'loading';
    try {
      await instance.share.openAuthPopup();
      // Auth successful, now save
      handleSave();
    } catch (error) {
      if (error.message === 'Authentication cancelled') {
        shareModalState.value = 'options';
      } else {
        shareError.value = error.message || 'Authentication failed';
        shareModalState.value = 'error';
      }
    }
  }
}

async function handleSave() {
  if (!activeArtifact.value || !instance.share) return;

  shareModalState.value = 'loading';
  shareError.value = '';

  try {
    const result = await instance.share.save(activeArtifact.value);
    shareUrl.value = result.url;
    shareExpiresAt.value = null;
    shareIsSaved.value = true;
    shareModalState.value = 'success';
  } catch (error) {
    shareError.value = error.message || 'Failed to save artifact';
    shareModalState.value = 'error';
  }
}

function retryShare() {
  // Determine what to retry based on previous state
  if (shareIsSaved.value) {
    handleSave();
  } else {
    handleQuickShare();
  }
}

async function handleUpdateOption() {
  if (!instance.share) return;

  // Check auth first
  if (!isAuthenticated.value) {
    shareModalState.value = 'loading';
    try {
      await instance.share.openAuthPopup();
    } catch (error) {
      if (error.message === 'Authentication cancelled') {
        shareModalState.value = 'options';
      } else {
        shareError.value = error.message || 'Authentication failed';
        shareModalState.value = 'error';
      }
      return;
    }
  }

  // Fetch artifacts
  shareModalState.value = 'update-list';
  savedArtifactsLoading.value = true;

  try {
    const lang = activeArtifact.value?.language || null;
    const result = await instance.share.listArtifacts(lang);
    savedArtifacts.value = result.projects || [];
  } catch (error) {
    shareError.value = error.message || 'Failed to load artifacts';
    shareModalState.value = 'error';
  } finally {
    savedArtifactsLoading.value = false;
  }
}

async function handleUpdateArtifact(artifact) {
  if (!activeArtifact.value || !instance.share) return;

  const projectUuid = artifact.project?.uuid;
  if (!projectUuid) return;

  shareModalState.value = 'loading';
  shareError.value = '';

  try {
    const result = await instance.share.updateArtifact(projectUuid, activeArtifact.value);
    shareUrl.value = result.url || '';
    shareExpiresAt.value = null;
    shareIsSaved.value = true;
    updatedArtifactName.value = artifact.project?.name || 'Untitled';
    shareModalState.value = 'success';
  } catch (error) {
    shareError.value = error.message || 'Failed to update artifact';
    shareModalState.value = 'error';
  }
}

async function copyShareLink() {
  if (!shareUrl.value) return;

  try {
    await navigator.clipboard.writeText(shareUrl.value);
    shareLinkCopied.value = true;
    setTimeout(() => { shareLinkCopied.value = false; }, 2000);
  } catch (error) {
    console.error('Failed to copy link:', error);
  }
}

function handleOpenInNewTab() {
  if (panelUrl.value) {
    window.open(panelUrl.value, '_blank');
  }
}

function handleCodeScroll() {
  // Sync line numbers scroll position with code scroll
  if (lineNumbersRef.value && codeScrollRef.value) {
    lineNumbersRef.value.style.transform = `translateY(-${codeScrollRef.value.scrollTop}px)`;
  }
}

function toggleArtifactList() {
  showArtifactList.value = !showArtifactList.value;
}

function selectArtifact(artifact) {
  cameFromList.value = true;
  openArtifact(artifact);
  showArtifactList.value = false;
}

function navigateToPrevNonInline() {
  const newIndex = currentNonInlineIndex.value - 1;
  if (newIndex >= 0) {
    openArtifact(nonInlineArtifacts.value[newIndex]);
  }
}

function navigateToNextNonInline() {
  const newIndex = currentNonInlineIndex.value + 1;
  if (newIndex < nonInlineArtifacts.value.length) {
    openArtifact(nonInlineArtifacts.value[newIndex]);
  }
}

// Close artifact list when clicking outside
function handleClickOutside(e) {
  const nav = document.querySelector('.artifactuse-panel__nav');
  if (nav && !nav.contains(e.target)) {
    showArtifactList.value = false;
  }
}

// ============================================
// Panel resize (fixed implementation)
// ============================================
let panelResizeState = null;

function startPanelResize(e) {
  panelResizeState = {
    startX: e.clientX,
    startWidth: panelWidth.value,
  };
  
  document.addEventListener('mousemove', handlePanelResize);
  document.addEventListener('mouseup', stopPanelResize);
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  
  // Prevent iframe from capturing mouse events
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.style.pointerEvents = 'none');
}

function handlePanelResize(e) {
  if (!panelResizeState) return;
  
  const windowWidth = window.innerWidth;
  const deltaX = panelResizeState.startX - e.clientX;
  const deltaPercent = (deltaX / windowWidth) * 100;
  const newWidth = panelResizeState.startWidth + deltaPercent;
  
  panelWidth.value = Math.min(Math.max(newWidth, 25), 75);
  
  // Emit resize event for live updates
  emit('resize', { width: panelWidth.value });
}

function stopPanelResize() {
  const wasResizing = panelResizeState !== null;
  panelResizeState = null;
  
  document.removeEventListener('mousemove', handlePanelResize);
  document.removeEventListener('mouseup', stopPanelResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // Re-enable iframe mouse events
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.style.pointerEvents = '');
  
  // Emit resize event with current width
  if (wasResizing) {
    emit('resize', { width: panelWidth.value });
  }
}

// ============================================
// Split resize (fixed implementation)
// ============================================
let splitResizeState = null;

function startSplitResize(e) {
  if (!contentRef.value) return;
  
  const rect = contentRef.value.getBoundingClientRect();
  splitResizeState = {
    startX: e.clientX,
    startPosition: splitPosition.value,
    contentLeft: rect.left,
    contentWidth: rect.width,
  };
  
  document.addEventListener('mousemove', handleSplitResize);
  document.addEventListener('mouseup', stopSplitResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  // Prevent iframe from capturing mouse events
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.style.pointerEvents = 'none');
}

function handleSplitResize(e) {
  if (!splitResizeState) return;
  
  const relativeX = e.clientX - splitResizeState.contentLeft;
  const newPosition = (relativeX / splitResizeState.contentWidth) * 100;
  
  splitPosition.value = Math.min(Math.max(newPosition, 20), 80);
}

function stopSplitResize() {
  splitResizeState = null;
  
  document.removeEventListener('mousemove', handleSplitResize);
  document.removeEventListener('mouseup', stopSplitResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // Re-enable iframe mouse events
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => iframe.style.pointerEvents = '');
}

// Watch for artifact changes
watch(activeArtifact, (newArtifact, oldArtifact) => {
  if (newArtifact) {
    // Check if transitioning between different previewability types
    if (oldArtifact && oldArtifact.isPreviewable !== newArtifact.isPreviewable) {
      isTransitioning.value = true;
      setTimeout(() => {
        isTransitioning.value = false;
      }, 150);
    }

    // Set iframe loading when artifact changes
    if (!oldArtifact || newArtifact.id !== oldArtifact.id) {
      resetCodeContainerStyles();
      iframeLoading.value = true;
      startIframeLoadTimeout();
    }

    // Check if code changed
    if (!oldArtifact || newArtifact.id !== oldArtifact.id || newArtifact.code !== oldArtifact.code) {
      // Update code view immediately on each change
      updateCodeView();

      // Update editor content if in edit mode
      if (state.viewMode === 'edit') {
        if (!oldArtifact || newArtifact.id !== oldArtifact.id) {
          nextTick(() => initEditor());
        } else if (editorInstance) {
          editorInstance.setCode(newArtifact.code || '');
        }
      }

      // Debounce iframe updates only
      clearTimeout(streamEndTimer);
      streamEndTimer = setTimeout(() => {
        if (iframeRef.value && newArtifact.isPreviewable) {
          instance.bridge.loadArtifact(newArtifact);
        }
      }, 500);
    }
  }
}, { deep: true });

// Watch viewMode to update code view
watch(() => state.viewMode, (newMode) => {
  if (newMode === 'code' || newMode === 'split') {
    updateCodeView();
  }
  if (newMode === 'edit') {
    nextTick(() => initEditor());
  }
});

// Watch panel open state
watch(() => state.isPanelOpen, (isOpen) => {
  if (isOpen && activeArtifact.value) {
    updateCodeView();
  }
  if (!isOpen) {
    destroyEditor();
  }
});

// Watch prop changes for panelWidth/splitPosition
watch(() => props.panelWidth, (val) => {
  if (val !== undefined) {
    panelWidth.value = Math.min(Math.max(val, 25), 75);
  }
});

watch(() => props.splitPosition, (val) => {
  if (val !== undefined) {
    splitPosition.value = Math.min(Math.max(val, 20), 80);
  }
});

// Bridge event forwarding
onMounted(() => {
  instance.on('ai:request', (data) => emit('ai-request', data));
  instance.on('save:request', (data) => emit('save', data));
  instance.on('export:complete', (data) => emit('export', data));
  
  // Close artifact list when clicking outside
  document.addEventListener('click', handleClickOutside);
  
  // Initial code view update
  if (state.isPanelOpen && activeArtifact.value) {
    updateCodeView();
  }
});

onUnmounted(() => {
  stopPanelResize();
  stopSplitResize();
  destroyEditor();
  document.removeEventListener('click', handleClickOutside);
  clearTimeout(streamEndTimer);
  clearTimeout(iframeLoadTimer);
});
</script>