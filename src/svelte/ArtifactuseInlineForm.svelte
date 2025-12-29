<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let form;
  export let theme = 'dark';
  export let accent = null;
  
  const dispatch = createEventDispatcher();
  
  let containerEl;
  let values = {};
  let errors = {};
  let isSubmitting = false;
  
  $: formId = form.id || `form-${Date.now()}`;
  $: variantClass = `artifactuse-form-${form.variant || 'fields'}`;
  $: fields = form.data?.fields || [];
  $: buttons = form.data?.buttons || [];
  
  /**
   * Parse color string to RGB
   */
  function parseColor(color) {
    if (!color) return null;
    const str = color.trim();
    
    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) return `${r}, ${g}, ${b}`;
      }
    }
    
    const rgbMatch = str.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
    
    const parts = str.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (parts.length >= 3) return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
    
    return null;
  }
  
  // Apply accent color
  function applyAccent() {
    if (containerEl && accent) {
      const rgb = parseColor(accent);
      if (rgb) {
        containerEl.style.setProperty('--artifactuse-primary', rgb);
      }
    }
  }
  
  onMount(applyAccent);
  $: if (accent) applyAccent();
  
  // Initialize values
  function initValues() {
    const defaults = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === 'checkbox') defaults[f.name] = false;
      else defaults[f.name] = '';
    });
    values = defaults;
    errors = {};
  }
  
  $: if (form) initValues();
  
  function isTextInput(type) {
    return ['text', 'email', 'password', 'tel', 'url', 'number'].includes(type);
  }
  
  function updateField(name, value) {
    values[name] = value;
    if (errors[name]) {
      delete errors[name];
      errors = errors;
    }
  }
  
  function validate() {
    const newErrors = {};
    
    fields.forEach(field => {
      const value = values[field.name];
      if (field.required && !value && value !== 0 && value !== false) {
        newErrors[field.name] = `${field.label || 'This field'} is required`;
      }
    });
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }
  
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    isSubmitting = true;
    
    dispatch('submit', {
      formId,
      action: 'submit',
      values,
      timestamp: Date.now(),
    });
    
    setTimeout(() => {
      isSubmitting = false;
    }, 500);
  }
  
  function handleButtonClick(action) {
    dispatch('submit', {
      formId,
      action,
      values: {},
      timestamp: Date.now(),
    });
  }
  
  function handleCancel() {
    dispatch('cancel', {
      formId,
      action: 'cancel',
      timestamp: Date.now(),
    });
  }
</script>

<div 
  bind:this={containerEl}
  class="artifactuse-inline-form {variantClass}"
  data-artifactuse-theme={theme}
>
  {#if form.title}
    <div class="artifactuse-form-title">{form.title}</div>
  {/if}
  
  {#if form.description}
    <p class="artifactuse-form-description">{form.description}</p>
  {/if}
  
  {#if form.variant === 'buttons'}
    <div class="artifactuse-form-button-group">
      {#each buttons as btn}
        <button
          type="button"
          class="artifactuse-form-btn artifactuse-form-btn-{btn.style || 'primary'}"
          disabled={btn.disabled}
          on:click={() => handleButtonClick(btn.id)}
        >
          {btn.label}
        </button>
      {/each}
    </div>
  {:else}
    <form class="artifactuse-form" on:submit={handleSubmit}>
      <div class="artifactuse-form-grid">
        {#each fields as field}
          <div class="artifactuse-form-field">
            {#if field.type === 'checkbox'}
              <label class="artifactuse-checkbox-label">
                <input
                  type="checkbox"
                  checked={values[field.name]}
                  disabled={field.disabled}
                  class="artifactuse-checkbox"
                  on:change={(e) => updateField(field.name, e.target.checked)}
                />
                <span>{field.label}{#if field.required}<span class="artifactuse-required">*</span>{/if}</span>
              </label>
            {:else}
              <label for="{formId}-{field.name}" class="artifactuse-label">
                {field.label}{#if field.required}<span class="artifactuse-required">*</span>{/if}
              </label>
              
              {#if isTextInput(field.type)}
                <input
                  id="{formId}-{field.name}"
                  type={field.type}
                  value={values[field.name] || ''}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  required={field.required}
                  class="artifactuse-input"
                  on:input={(e) => updateField(field.name, e.target.value)}
                />
              {:else if field.type === 'textarea'}
                <textarea
                  id="{formId}-{field.name}"
                  value={values[field.name] || ''}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  required={field.required}
                  rows={field.rows || 3}
                  class="artifactuse-textarea"
                  on:input={(e) => updateField(field.name, e.target.value)}
                ></textarea>
              {:else if field.type === 'select'}
                <select
                  id="{formId}-{field.name}"
                  value={values[field.name] || ''}
                  disabled={field.disabled}
                  required={field.required}
                  class="artifactuse-select"
                  on:change={(e) => updateField(field.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {#each field.options || [] as opt}
                    <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
                  {/each}
                </select>
              {:else if field.type === 'radio'}
                <div class="artifactuse-radio-group">
                  {#each field.options || [] as opt}
                    <label class="artifactuse-radio-label">
                      <input
                        type="radio"
                        name={field.name}
                        value={opt.value}
                        checked={values[field.name] === opt.value}
                        disabled={opt.disabled || field.disabled}
                        class="artifactuse-radio"
                        on:change={() => updateField(field.name, opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  {/each}
                </div>
              {/if}
              
              {#if field.helpText}
                <span class="artifactuse-help-text">{field.helpText}</span>
              {/if}
            {/if}
            
            {#if errors[field.name]}
              <span class="artifactuse-error-text">{errors[field.name]}</span>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="artifactuse-form-actions">
        {#if form.cancelLabel}
          <button
            type="button"
            class="artifactuse-form-btn artifactuse-form-btn-secondary"
            on:click={handleCancel}
          >
            {form.cancelLabel}
          </button>
        {/if}
        <button
          type="submit"
          class="artifactuse-form-btn artifactuse-form-btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : (form.submitLabel || 'Submit')}
        </button>
      </div>
    </form>
  {/if}
</div>

<style>
  .artifactuse-error-text {
    color: rgb(var(--artifactuse-error, 239, 68, 68));
    font-size: 12px;
    margin-top: 4px;
  }
</style>
