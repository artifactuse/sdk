<template>
  <div 
    ref="containerRef"
    :class="[
      'artifactuse-inline-form',
      variantClass,
      stateClass,
    ]"
    :data-artifactuse-theme="theme"
  >
    <!-- Collapsed State -->
    <div v-if="isCollapsed" class="artifactuse-form-collapsed">
      <div class="artifactuse-form-collapsed-icon">
        <!-- Submitted: Checkmark -->
        <svg v-if="formState === 'submitted'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <!-- Cancelled: X -->
        <svg v-else-if="formState === 'cancelled'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <!-- Inactive: Dash/minus -->
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <span class="artifactuse-form-collapsed-title">{{ collapsedTitle }}</span>
    </div>

    <!-- Active Form State -->
    <template v-else>
      <!-- Header -->
      <div v-if="form.title || form.description" class="artifactuse-form-header">
        <div v-if="form.title" class="artifactuse-form-title">{{ form.title }}</div>
        <p v-if="form.description" class="artifactuse-form-description">{{ form.description }}</p>
      </div>
      
      <!-- Buttons-only variant -->
      <div v-if="form.variant === 'buttons'" class="artifactuse-form-buttons">
        <button
          v-for="btn in buttonFields"
          :key="btn.name || btn.label"
          type="button"
          :class="['artifactuse-form-btn', `artifactuse-form-btn-${btn.variant || 'secondary'}`]"
          :disabled="btn.disabled || isSubmitting"
          @click="handleButtonAction(btn)"
        >
          <span v-if="btn.icon" class="artifactuse-form-btn-icon" v-html="btn.icon"></span>
          {{ btn.label }}
        </button>
      </div>
      
      <!-- Fields variant -->
      <form v-else class="artifactuse-form" @submit.prevent="handleSubmit">
        <div class="artifactuse-form-fields">
          <template v-for="(field, index) in formFields" :key="field.name || index">
            
            <!-- Buttons group field -->
            <div v-if="field.type === 'buttons'" class="artifactuse-form-buttons">
              <button
                v-for="btn in field.fields || []"
                :key="btn.name || btn.label"
                :type="btn.action === 'submit' ? 'submit' : 'button'"
                :class="['artifactuse-form-btn', `artifactuse-form-btn-${btn.variant || 'secondary'}`]"
                :disabled="btn.disabled || (btn.action === 'submit' && isSubmitting)"
                @click="btn.action !== 'submit' ? handleButtonAction(btn) : null"
              >
                <span v-if="isSubmitting && btn.action === 'submit'" class="artifactuse-form-btn-spinner"></span>
                <span v-else-if="btn.icon" class="artifactuse-form-btn-icon" v-html="btn.icon"></span>
                {{ isSubmitting && btn.action === 'submit' ? 'Submitting...' : btn.label }}
              </button>
            </div>
            
            <!-- Divider -->
            <div v-else-if="field.type === 'divider'" class="artifactuse-form-divider"></div>
            
            <!-- Heading -->
            <div v-else-if="field.type === 'heading'" class="artifactuse-form-heading">
              {{ field.label }}
            </div>
            
            <!-- Checkbox -->
            <div v-else-if="field.type === 'checkbox'" class="artifactuse-form-field">
              <label class="artifactuse-checkbox-label">
                <input
                  type="checkbox"
                  :checked="values[field.name]"
                  :disabled="field.disabled"
                  class="artifactuse-checkbox"
                  @change="updateField(field.name, $event.target.checked)"
                />
                <span class="artifactuse-checkbox-text">
                  {{ field.label }}
                  <span v-if="field.required" class="artifactuse-required">*</span>
                </span>
              </label>
              <span v-if="field.helpText" class="artifactuse-help-text">{{ field.helpText }}</span>
              <span v-if="errors[field.name]" class="artifactuse-error-text">{{ errors[field.name] }}</span>
            </div>
            
            <!-- Regular fields -->
            <div v-else class="artifactuse-form-field">
              <label :for="`${formId}-${field.name}`" class="artifactuse-label">
                {{ field.label }}
                <span v-if="field.required" class="artifactuse-required">*</span>
              </label>
              
              <!-- Text inputs -->
              <input
                v-if="isTextInput(field.type)"
                :id="`${formId}-${field.name}`"
                :type="field.type"
                :value="values[field.name]"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :required="field.required"
                class="artifactuse-input"
                @input="updateField(field.name, $event.target.value)"
              />
              
              <!-- Textarea -->
              <textarea
                v-else-if="field.type === 'textarea'"
                :id="`${formId}-${field.name}`"
                :value="values[field.name]"
                :placeholder="field.placeholder"
                :disabled="field.disabled"
                :required="field.required"
                :rows="field.rows || 3"
                class="artifactuse-textarea"
                @input="updateField(field.name, $event.target.value)"
              ></textarea>
              
              <!-- Select -->
              <select
                v-else-if="field.type === 'select'"
                :id="`${formId}-${field.name}`"
                :value="values[field.name]"
                :disabled="field.disabled"
                :required="field.required"
                class="artifactuse-select"
                @change="updateField(field.name, $event.target.value)"
              >
                <option value="">{{ field.placeholder || 'Select...' }}</option>
                <option
                  v-for="opt in normalizeOptions(field.options)"
                  :key="opt.value"
                  :value="opt.value"
                  :disabled="opt.disabled"
                >
                  {{ opt.label }}
                </option>
              </select>
              
              <!-- Radio group -->
              <div v-else-if="field.type === 'radio'" class="artifactuse-radio-group">
                <label
                  v-for="opt in normalizeOptions(field.options)"
                  :key="opt.value"
                  class="artifactuse-radio-label"
                >
                  <input
                    type="radio"
                    :name="field.name"
                    :value="opt.value"
                    :checked="values[field.name] === opt.value"
                    :disabled="opt.disabled || field.disabled"
                    class="artifactuse-radio"
                    @change="updateField(field.name, opt.value)"
                  />
                  <span>{{ opt.label }}</span>
                </label>
              </div>
              
              <!-- Help text -->
              <span v-if="field.helpText" class="artifactuse-help-text">{{ field.helpText }}</span>
              
              <!-- Error -->
              <span v-if="errors[field.name]" class="artifactuse-error-text">{{ errors[field.name] }}</span>
            </div>
          </template>
        </div>
        
        <!-- Default submit button if no buttons field exists -->
        <div v-if="!hasButtonsField" class="artifactuse-form-buttons artifactuse-form-buttons-default">
          <button
            type="button"
            class="artifactuse-form-btn artifactuse-form-btn-ghost"
            @click="handleButtonAction({ action: 'cancel', label: 'Cancel' })"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="artifactuse-form-btn artifactuse-form-btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="artifactuse-form-btn-spinner"></span>
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  artifact: { type: Object, required: true },
  theme: { type: String, default: 'dark' },
  accent: { type: String, default: null },
  initialState: {
    type: String,
    default: 'active',
    validator: (v) => ['active', 'submitted', 'cancelled', 'inactive'].includes(v),
  },
});

const emit = defineEmits(['submit', 'cancel', 'reset', 'button-click']);

/**
 * Form state management
 */
const formState = ref(props.initialState);

const isCollapsed = computed(() => formState.value !== 'active');

const stateClass = computed(() => {
  if (formState.value === 'active') return '';
  return `artifactuse-form--${formState.value}`;
});

/**
 * Collapse the form with animation
 */
function collapseForm(state) {
  formState.value = state;
}

/**
 * Parse form data from artifact.code JSON
 */
const form = computed(() => {
  try {
    return JSON.parse(props.artifact.code);
  } catch {
    return { title: 'Invalid Form', variant: 'fields', data: { fields: [] } };
  }
});

const containerRef = ref(null);
const formId = computed(() => props.artifact.id || form.value.id || `form-${Date.now()}`);
const variantClass = computed(() => `artifactuse-form-${form.value.variant || 'fields'}`);

/**
 * Collapsed state title
 */
const collapsedTitle = computed(() => form.value.title || 'Form');

const values = ref({});
const errors = ref({});
const isSubmitting = ref(false);

/**
 * Get all form fields (from data.fields)
 */
const formFields = computed(() => form.value.data?.fields || []);

/**
 * Get button fields for buttons-only variant
 */
const buttonFields = computed(() => {
  // For buttons variant, fields array contains buttons directly
  if (form.value.variant === 'buttons') {
    return form.value.data?.fields || [];
  }
  return [];
});

/**
 * Check if form has a buttons field
 */
const hasButtonsField = computed(() => {
  return formFields.value.some(f => f.type === 'buttons');
});

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
 * Apply accent color
 */
function applyAccent() {
  if (containerRef.value && props.accent) {
    const rgb = parseColor(props.accent);
    if (rgb) {
      containerRef.value.style.setProperty('--artifactuse-primary', rgb);
    }
  }
}

onMounted(() => {
  applyAccent();
  // Set initial state from prop
  formState.value = props.initialState;
});

watch(() => props.accent, applyAccent);
watch(() => props.initialState, (newState) => {
  formState.value = newState;
});

/**
 * Initialize form values from defaults
 */
function initValues() {
  const defaults = {};
  const fields = formFields.value;
  
  fields.forEach(f => {
    // Skip non-input fields
    if (['buttons', 'divider', 'heading'].includes(f.type)) return;
    
    if (f.defaultValue !== undefined) {
      defaults[f.name] = f.defaultValue;
    } else if (f.type === 'checkbox') {
      defaults[f.name] = false;
    } else {
      defaults[f.name] = '';
    }
  });
  
  // Apply form-level defaults
  if (form.value.data?.defaults) {
    Object.assign(defaults, form.value.data.defaults);
  }
  
  values.value = defaults;
}

initValues();
watch(() => props.artifact.code, initValues);

/**
 * Check if field type is a text input
 */
function isTextInput(type) {
  return ['text', 'email', 'password', 'tel', 'url', 'number', 'date', 'time', 'datetime-local'].includes(type);
}

/**
 * Normalize options array (handle both string[] and {label, value}[])
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

/**
 * Update field value and clear error
 */
function updateField(name, value) {
  values.value[name] = value;
  if (errors.value[name]) {
    delete errors.value[name];
  }
}

/**
 * Validate form fields
 */
function validate() {
  const newErrors = {};
  const fields = formFields.value;
  
  fields.forEach(field => {
    // Skip non-input fields
    if (['buttons', 'divider', 'heading'].includes(field.type)) return;
    
    const value = values.value[field.name];
    
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
  const validation = form.value.data?.validation;
  if (validation) {
    Object.entries(validation).forEach(([fieldName, rules]) => {
      if (newErrors[fieldName]) return; // Already has error
      
      const value = values.value[fieldName];
      
      if (rules.pattern && value) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          newErrors[fieldName] = rules.message || `${fieldName} is invalid`;
        }
      }
    });
  }
  
  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
}

/**
 * Reset form to initial values
 */
function resetForm() {
  initValues();
  errors.value = {};
}

/**
 * Handle form submission
 */
function handleSubmit() {
  if (!validate()) return;
  
  isSubmitting.value = true;
  
  emit('submit', {
    formId: formId.value,
    action: 'submit',
    values: { ...values.value },
    timestamp: Date.now(),
  });
  
  // Collapse after brief delay for visual feedback
  setTimeout(() => {
    isSubmitting.value = false;
    collapseForm('submitted');
  }, 300);
}

/**
 * Handle button action
 */
function handleButtonAction(btn) {
  const action = btn.action || 'custom';
  
  switch (action) {
    case 'submit':
      handleSubmit();
      break;
      
    case 'cancel':
      emit('cancel', {
        formId: formId.value,
        action: 'cancel',
        buttonName: btn.name || 'cancel',
        timestamp: Date.now(),
      });
      // Collapse as cancelled
      setTimeout(() => {
        collapseForm('cancelled');
      }, 150);
      break;
      
    case 'reset':
      resetForm();
      emit('reset', {
        formId: formId.value,
        action: 'reset',
        buttonName: btn.name || 'reset',
        timestamp: Date.now(),
      });
      // Reset doesn't collapse - form stays active
      break;
      
    case 'custom':
    default:
      emit('button-click', {
        formId: formId.value,
        action: action,
        buttonName: btn.name || btn.label,
        buttonLabel: btn.label,
        values: { ...values.value },
        timestamp: Date.now(),
      });
      // Custom actions collapse as submitted (action was taken)
      setTimeout(() => {
        collapseForm('submitted');
      }, 150);
      break;
  }
}
</script>