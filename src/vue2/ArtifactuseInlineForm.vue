<template>
  <div 
    ref="containerRef"
    :class="['artifactuse-inline-form', variantClass]"
    :data-artifactuse-theme="theme"
  >
    <div v-if="form.title" class="artifactuse-form-title">{{ form.title }}</div>
    <p v-if="form.description" class="artifactuse-form-description">{{ form.description }}</p>
    
    <!-- Buttons variant -->
    <div v-if="form.variant === 'buttons'" class="artifactuse-form-button-group">
      <button
        v-for="btn in formButtons"
        :key="btn.id"
        type="button"
        :class="['artifactuse-form-btn', 'artifactuse-form-btn-' + (btn.style || 'primary')]"
        :disabled="btn.disabled"
        @click="handleButtonClick(btn.id)"
      >
        {{ btn.label }}
      </button>
    </div>
    
    <!-- Fields variant -->
    <form v-else class="artifactuse-form" @submit.prevent="handleSubmit">
      <div class="artifactuse-form-grid">
        <div
          v-for="field in formFields"
          :key="field.name"
          class="artifactuse-form-field"
        >
          <!-- Checkbox has its own label -->
          <template v-if="field.type === 'checkbox'">
            <label class="artifactuse-checkbox-label">
              <input
                type="checkbox"
                :checked="values[field.name]"
                :disabled="field.disabled"
                class="artifactuse-checkbox"
                @change="updateField(field.name, $event.target.checked)"
              />
              <span>{{ field.label }}<span v-if="field.required" class="artifactuse-required">*</span></span>
            </label>
          </template>
          
          <template v-else>
            <label :for="formId + '-' + field.name" class="artifactuse-label">
              {{ field.label }}<span v-if="field.required" class="artifactuse-required">*</span>
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
              <option value="">Select...</option>
              <option
                v-for="opt in field.options"
                :key="opt.value"
                :value="opt.value"
                :disabled="opt.disabled"
              >
                {{ opt.label }}
              </option>
            </select>
            
            <!-- Radio -->
            <div v-else-if="field.type === 'radio'" class="artifactuse-radio-group">
              <label
                v-for="opt in field.options"
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
          </template>
          
          <!-- Error -->
          <span v-if="errors[field.name]" class="artifactuse-error-text">{{ errors[field.name] }}</span>
        </div>
      </div>
      
      <div class="artifactuse-form-actions">
        <button
          v-if="form.cancelLabel"
          type="button"
          class="artifactuse-form-btn artifactuse-form-btn-secondary"
          @click="handleCancel"
        >
          {{ form.cancelLabel }}
        </button>
        <button
          type="submit"
          class="artifactuse-form-btn artifactuse-form-btn-primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : (form.submitLabel || 'Submit') }}
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
    form: { type: Object, required: true },
    theme: { type: String, default: 'dark' },
    accent: { type: String, default: null },
  },
  
  setup(props, { emit }) {
    const containerRef = ref(null);
    const values = ref({});
    const errors = ref({});
    const isSubmitting = ref(false);
    
    const formId = computed(() => props.form.id || `form-${Date.now()}`);
    const variantClass = computed(() => `artifactuse-form-${props.form.variant || 'fields'}`);
    const formFields = computed(() => props.form.data?.fields || []);
    const formButtons = computed(() => props.form.data?.buttons || []);
    
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
      if (containerRef.value && props.accent) {
        const rgb = parseColor(props.accent);
        if (rgb) {
          containerRef.value.style.setProperty('--artifactuse-primary', rgb);
        }
      }
    }
    
    onMounted(applyAccent);
    watch(() => props.accent, applyAccent);
    
    // Initialize values
    function initValues() {
      const defaults = {};
      const fields = props.form.data?.fields || [];
      fields.forEach(f => {
        if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
        else if (f.type === 'checkbox') defaults[f.name] = false;
        else defaults[f.name] = '';
      });
      values.value = defaults;
    }
    
    initValues();
    watch(() => props.form, initValues, { deep: true });
    
    function isTextInput(type) {
      return ['text', 'email', 'password', 'tel', 'url', 'number'].includes(type);
    }
    
    function updateField(name, value) {
      values.value = { ...values.value, [name]: value };
      if (errors.value[name]) {
        const newErrors = { ...errors.value };
        delete newErrors[name];
        errors.value = newErrors;
      }
    }
    
    function validate() {
      const newErrors = {};
      const fields = props.form.data?.fields || [];
      
      fields.forEach(field => {
        const value = values.value[field.name];
        if (field.required && !value && value !== 0 && value !== false) {
          newErrors[field.name] = `${field.label || 'This field'} is required`;
        }
      });
      
      errors.value = newErrors;
      return Object.keys(newErrors).length === 0;
    }
    
    function handleSubmit() {
      if (!validate()) return;
      
      isSubmitting.value = true;
      
      emit('submit', {
        formId: formId.value,
        action: 'submit',
        values: values.value,
        timestamp: Date.now(),
      });
      
      setTimeout(() => {
        isSubmitting.value = false;
      }, 500);
    }
    
    function handleButtonClick(action) {
      emit('submit', {
        formId: formId.value,
        action,
        values: {},
        timestamp: Date.now(),
      });
    }
    
    function handleCancel() {
      emit('cancel', {
        formId: formId.value,
        action: 'cancel',
        timestamp: Date.now(),
      });
    }
    
    return {
      containerRef,
      formId,
      variantClass,
      formFields,
      formButtons,
      values,
      errors,
      isSubmitting,
      isTextInput,
      updateField,
      handleSubmit,
      handleButtonClick,
      handleCancel,
    };
  },
};
</script>

<style>
.artifactuse-error-text {
  color: rgb(var(--artifactuse-error, 239, 68, 68));
  font-size: 12px;
  margin-top: 4px;
}
</style>
