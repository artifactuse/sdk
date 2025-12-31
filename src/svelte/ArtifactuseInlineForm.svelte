<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let artifact;
  export let theme = 'dark';
  export let accent = null;
  
  const dispatch = createEventDispatcher();
  
  let containerEl;
  let values = {};
  let errors = {};
  let isSubmitting = false;
  
  // Parse form data from artifact.code
  $: form = parseForm(artifact?.code);
  $: formId = artifact?.id || form.id || `form-${Date.now()}`;
  $: variantClass = `artifactuse-form-${form.variant || 'fields'}`;
  $: formFields = form.data?.fields || [];
  $: buttonFields = form.variant === 'buttons' ? formFields : [];
  $: hasButtonsField = formFields.some(f => f.type === 'buttons');
  
  /**
   * Parse form JSON from code
   */
  function parseForm(code) {
    try {
      return JSON.parse(code);
    } catch {
      return { title: 'Invalid Form', variant: 'fields', data: { fields: [] } };
    }
  }
  
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
  
  /**
   * Normalize options (handle string[] and {label, value}[])
   */
  function normalizeOptions(options) {
    if (!options) return [];
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
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
  
  // Initialize values when form changes
  function initValues() {
    const defaults = {};
    formFields.forEach(f => {
      if (['buttons', 'divider', 'heading'].includes(f.type)) return;
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === 'checkbox') defaults[f.name] = false;
      else defaults[f.name] = '';
    });
    // Apply form-level defaults
    if (form.data?.defaults) {
      Object.assign(defaults, form.data.defaults);
    }
    values = defaults;
    errors = {};
  }
  
  $: if (artifact?.code) initValues();
  
  function isTextInput(type) {
    return ['text', 'email', 'password', 'tel', 'url', 'number', 'date', 'time', 'datetime-local'].includes(type);
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
    
    formFields.forEach(field => {
      if (['buttons', 'divider', 'heading'].includes(field.type)) return;
      
      const value = values[field.name];
      
      // Required validation
      if (field.required && !value && value !== 0 && value !== false) {
        newErrors[field.name] = `${field.label || 'This field'} is required`;
        return;
      }
      
      // Pattern validation
      if (field.pattern && value) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          newErrors[field.name] = field.patternMessage || `${field.label || 'This field'} is invalid`;
          return;
        }
      }
      
      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Please enter a valid email address';
          return;
        }
      }
      
      // Min/max length validation
      if (field.minLength && value && value.length < field.minLength) {
        newErrors[field.name] = `Minimum ${field.minLength} characters required`;
        return;
      }
      if (field.maxLength && value && value.length > field.maxLength) {
        newErrors[field.name] = `Maximum ${field.maxLength} characters allowed`;
        return;
      }
    });
    
    // Apply form-level validation rules
    const validation = form.data?.validation;
    if (validation) {
      Object.entries(validation).forEach(([fieldName, rules]) => {
        if (newErrors[fieldName]) return;
        
        const value = values[fieldName];
        
        if (rules.pattern && value) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            newErrors[fieldName] = rules.message || `${fieldName} is invalid`;
          }
        }
      });
    }
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }
  
  function resetForm() {
    initValues();
  }
  
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    
    isSubmitting = true;
    
    dispatch('submit', {
      formId,
      action: 'submit',
      values: { ...values },
      timestamp: Date.now(),
    });
    
    setTimeout(() => {
      isSubmitting = false;
    }, 500);
  }
  
  function handleButtonAction(btn) {
    const action = btn.action || 'custom';
    
    switch (action) {
      case 'submit':
        // Trigger form submit
        const formEl = containerEl?.querySelector('form');
        if (formEl) {
          formEl.requestSubmit();
        }
        break;
        
      case 'cancel':
        dispatch('cancel', {
          formId,
          action: 'cancel',
          buttonName: btn.name || 'cancel',
          timestamp: Date.now(),
        });
        break;
        
      case 'reset':
        resetForm();
        dispatch('reset', {
          formId,
          action: 'reset',
          buttonName: btn.name || 'reset',
          timestamp: Date.now(),
        });
        break;
        
      case 'custom':
      default:
        dispatch('button-click', {
          formId,
          action,
          buttonName: btn.name || btn.label,
          buttonLabel: btn.label,
          values: { ...values },
          timestamp: Date.now(),
        });
        break;
    }
  }
</script>

<div 
  bind:this={containerEl}
  class="artifactuse-inline-form {variantClass}"
  data-artifactuse-theme={theme}
>
  <!-- Header -->
  {#if form.title || form.description}
    <div class="artifactuse-form-header">
      {#if form.title}
        <div class="artifactuse-form-title">{form.title}</div>
      {/if}
      {#if form.description}
        <p class="artifactuse-form-description">{form.description}</p>
      {/if}
    </div>
  {/if}
  
  <!-- Buttons-only variant -->
  {#if form.variant === 'buttons'}
    <div class="artifactuse-form-buttons">
      {#each buttonFields as btn, idx (btn.name || btn.label || idx)}
        <button
          type="button"
          class="artifactuse-form-btn artifactuse-form-btn-{btn.variant || 'secondary'}"
          disabled={btn.disabled || isSubmitting}
          on:click={() => handleButtonAction(btn)}
        >
          {#if btn.icon}
            <span class="artifactuse-form-btn-icon">{@html btn.icon}</span>
          {/if}
          {btn.label}
        </button>
      {/each}
    </div>
  {:else}
    <!-- Fields variant -->
    <form class="artifactuse-form" on:submit={handleSubmit}>
      <div class="artifactuse-form-fields">
        {#each formFields as field, idx (field.name || idx)}
          
          <!-- Buttons group -->
          {#if field.type === 'buttons'}
            <div class="artifactuse-form-buttons">
              {#each field.fields || [] as btn, btnIdx (btn.name || btn.label || btnIdx)}
                <button
                  type={btn.action === 'submit' ? 'submit' : 'button'}
                  class="artifactuse-form-btn artifactuse-form-btn-{btn.variant || 'secondary'}"
                  disabled={btn.disabled || (btn.action === 'submit' && isSubmitting)}
                  on:click={btn.action !== 'submit' ? () => handleButtonAction(btn) : undefined}
                >
                  {#if isSubmitting && btn.action === 'submit'}
                    <span class="artifactuse-form-btn-spinner"></span>
                  {:else if btn.icon}
                    <span class="artifactuse-form-btn-icon">{@html btn.icon}</span>
                  {/if}
                  {isSubmitting && btn.action === 'submit' ? 'Submitting...' : btn.label}
                </button>
              {/each}
            </div>
          
          <!-- Divider -->
          {:else if field.type === 'divider'}
            <div class="artifactuse-form-divider"></div>
          
          <!-- Heading -->
          {:else if field.type === 'heading'}
            <div class="artifactuse-form-heading">{field.label}</div>
          
          <!-- Checkbox -->
          {:else if field.type === 'checkbox'}
            <div class="artifactuse-form-field">
              <label class="artifactuse-checkbox-label">
                <input
                  type="checkbox"
                  checked={values[field.name]}
                  disabled={field.disabled}
                  class="artifactuse-checkbox"
                  on:change={(e) => updateField(field.name, e.target.checked)}
                />
                <span class="artifactuse-checkbox-text">
                  {field.label}
                  {#if field.required}<span class="artifactuse-required">*</span>{/if}
                </span>
              </label>
              {#if field.helpText}
                <span class="artifactuse-help-text">{field.helpText}</span>
              {/if}
              {#if errors[field.name]}
                <span class="artifactuse-error-text">{errors[field.name]}</span>
              {/if}
            </div>
          
          <!-- Radio group -->
          {:else if field.type === 'radio'}
            <div class="artifactuse-form-field">
              {#if field.label}
                <label class="artifactuse-label" for="{formId}-{field.name}">
                  {field.label}
                  {#if field.required}<span class="artifactuse-required">*</span>{/if}
                </label>
              {/if}
              <div class="artifactuse-radio-group">
                {#each normalizeOptions(field.options) as opt (opt.value)}
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
              {#if field.helpText}
                <span class="artifactuse-help-text">{field.helpText}</span>
              {/if}
              {#if errors[field.name]}
                <span class="artifactuse-error-text">{errors[field.name]}</span>
              {/if}
            </div>
          
          <!-- Regular fields -->
          {:else}
            <div class="artifactuse-form-field">
              <label for="{formId}-{field.name}" class="artifactuse-label">
                {field.label}
                {#if field.required}<span class="artifactuse-required">*</span>{/if}
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
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {#each normalizeOptions(field.options) as opt (opt.value)}
                    <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
                  {/each}
                </select>
              {/if}
              
              {#if field.helpText}
                <span class="artifactuse-help-text">{field.helpText}</span>
              {/if}
              {#if errors[field.name]}
                <span class="artifactuse-error-text">{errors[field.name]}</span>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
      
      <!-- Default buttons if no buttons field -->
      {#if !hasButtonsField}
        <div class="artifactuse-form-buttons artifactuse-form-buttons-default">
          <button
            type="button"
            class="artifactuse-form-btn artifactuse-form-btn-ghost"
            on:click={() => handleButtonAction({ action: 'cancel', label: 'Cancel' })}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="artifactuse-form-btn artifactuse-form-btn-primary"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <span class="artifactuse-form-btn-spinner"></span>
            {/if}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      {/if}
    </form>
  {/if}
</div>