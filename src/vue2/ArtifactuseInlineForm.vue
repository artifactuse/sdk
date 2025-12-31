<template>
  <div 
    ref="containerRef"
    :class="['artifactuse-inline-form', variantClass]"
    :data-artifactuse-theme="theme"
  >
    <!-- Header -->
    <div v-if="form.title || form.description" class="artifactuse-form-header">
      <div v-if="form.title" class="artifactuse-form-title">{{ form.title }}</div>
      <p v-if="form.description" class="artifactuse-form-description">{{ form.description }}</p>
    </div>
    
    <!-- Buttons-only variant -->
    <div v-if="form.variant === 'buttons'" class="artifactuse-form-buttons">
      <button
        v-for="(btn, idx) in buttonFields"
        :key="btn.name || btn.label || idx"
        type="button"
        :class="['artifactuse-form-btn', 'artifactuse-form-btn-' + (btn.variant || 'secondary')]"
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
        <template v-for="(field, idx) in formFields">
          
          <!-- Buttons group field -->
          <div v-if="field.type === 'buttons'" :key="'buttons-' + idx" class="artifactuse-form-buttons">
            <button
              v-for="(btn, btnIdx) in (field.fields || [])"
              :key="btn.name || btn.label || btnIdx"
              :type="btn.action === 'submit' ? 'submit' : 'button'"
              :class="['artifactuse-form-btn', 'artifactuse-form-btn-' + (btn.variant || 'secondary')]"
              :disabled="btn.disabled || (btn.action === 'submit' && isSubmitting)"
              @click="btn.action !== 'submit' ? handleButtonAction(btn) : null"
            >
              <span v-if="isSubmitting && btn.action === 'submit'" class="artifactuse-form-btn-spinner"></span>
              <span v-else-if="btn.icon" class="artifactuse-form-btn-icon" v-html="btn.icon"></span>
              {{ isSubmitting && btn.action === 'submit' ? 'Submitting...' : btn.label }}
            </button>
          </div>
          
          <!-- Divider -->
          <div v-else-if="field.type === 'divider'" :key="'divider-' + idx" class="artifactuse-form-divider"></div>
          
          <!-- Heading -->
          <div v-else-if="field.type === 'heading'" :key="'heading-' + idx" class="artifactuse-form-heading">
            {{ field.label }}
          </div>
          
          <!-- Checkbox -->
          <div v-else-if="field.type === 'checkbox'" :key="field.name" class="artifactuse-form-field">
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
          <div v-else :key="'regular'-field.name" class="artifactuse-form-field">
            <label :for="formId + '-' + field.name" class="artifactuse-label">
              {{ field.label }}
              <span v-if="field.required" class="artifactuse-required">*</span>
            </label>
            
            <!-- Text inputs -->
            <input
              v-if="isTextInput(field.type)"
              :id="formId + '-' + field.name"
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
              :id="formId + '-' + field.name"
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
              :id="formId + '-' + field.name"
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
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';

export default {
  name: 'ArtifactuseInlineForm',
  
  props: {
    artifact: { type: Object, required: true },
    theme: { type: String, default: 'dark' },
    accent: { type: String, default: null },
  },
  
  setup(props, { emit }) {
    const containerRef = ref(null);
    const values = ref({});
    const errors = ref({});
    const isSubmitting = ref(false);
    
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
    
    const formId = computed(() => props.artifact.id || form.value.id || `form-${Date.now()}`);
    const variantClass = computed(() => `artifactuse-form-${form.value.variant || 'fields'}`);
    const formFields = computed(() => form.value.data?.fields || []);
    
    const buttonFields = computed(() => {
      if (form.value.variant === 'buttons') {
        return formFields.value;
      }
      return [];
    });
    
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
    
    onMounted(applyAccent);
    watch(() => props.accent, applyAccent);
    
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
    
    /**
     * Initialize form values from defaults
     */
    function initValues() {
      const defaults = {};
      const fields = formFields.value;
      
      fields.forEach(f => {
        if (['buttons', 'divider', 'heading'].includes(f.type)) return;
        
        if (f.defaultValue !== undefined) {
          defaults[f.name] = f.defaultValue;
        } else if (f.type === 'checkbox') {
          defaults[f.name] = false;
        } else {
          defaults[f.name] = '';
        }
      });
      
      if (form.value.data?.defaults) {
        Object.assign(defaults, form.value.data.defaults);
      }
      
      values.value = defaults;
      errors.value = {};
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
     * Update field value and clear error
     */
    function updateField(name, value) {
      values.value = { ...values.value, [name]: value };
      if (errors.value[name]) {
        const newErrors = { ...errors.value };
        delete newErrors[name];
        errors.value = newErrors;
      }
    }
    
    /**
     * Validate form fields
     */
    function validate() {
      const newErrors = {};
      const fields = formFields.value;
      
      fields.forEach(field => {
        if (['buttons', 'divider', 'heading'].includes(field.type)) return;
        
        const value = values.value[field.name];
        
        if (field.required && !value && value !== 0 && value !== false) {
          newErrors[field.name] = `${field.label || 'This field'} is required`;
          return;
        }
        
        if (field.pattern && value) {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            newErrors[field.name] = field.patternMessage || `${field.label || 'This field'} is invalid`;
            return;
          }
        }
        
        if (field.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors[field.name] = 'Please enter a valid email address';
            return;
          }
        }
        
        if (field.minLength && value && value.length < field.minLength) {
          newErrors[field.name] = `Minimum ${field.minLength} characters required`;
          return;
        }
        if (field.maxLength && value && value.length > field.maxLength) {
          newErrors[field.name] = `Maximum ${field.maxLength} characters allowed`;
          return;
        }
      });
      
      const validation = form.value.data?.validation;
      if (validation) {
        Object.entries(validation).forEach(([fieldName, rules]) => {
          if (newErrors[fieldName]) return;
          
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
      
      setTimeout(() => {
        isSubmitting.value = false;
      }, 500);
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
          break;
          
        case 'reset':
          resetForm();
          emit('reset', {
            formId: formId.value,
            action: 'reset',
            buttonName: btn.name || 'reset',
            timestamp: Date.now(),
          });
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
          break;
      }
    }
    
    return {
      containerRef,
      form,
      formId,
      variantClass,
      formFields,
      buttonFields,
      hasButtonsField,
      values,
      errors,
      isSubmitting,
      normalizeOptions,
      isTextInput,
      updateField,
      handleSubmit,
      handleButtonAction,
    };
  },
};
</script>