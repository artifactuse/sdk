// artifactuse/react/ArtifactuseInlineForm.jsx
// Inline form component for forms rendered in chat

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * Parse color string to RGB values
 * Supports: hex (#ff6432, #f64), rgb(255, 100, 50), "255 100 50"
 */
function parseColor(color) {
  if (!color) return null;
  const str = color.trim();
  
  // Hex color
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
  
  // RGB function
  const rgbMatch = str.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
  
  // Already in correct format or space/comma separated
  const parts = str.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
  if (parts.length >= 3) return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
  
  return null;
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
 * Check if field type is a text input
 */
function isTextInput(type) {
  return ['text', 'email', 'password', 'tel', 'url', 'number', 'date', 'time', 'datetime-local'].includes(type);
}

/**
 * Inline Form Component
 * Renders buttons or simple field forms inline in the chat
 */
export function ArtifactuseInlineForm({ 
  artifact, 
  onSubmit, 
  onCancel,
  onReset,
  onButtonClick,
  className = '',
  theme = 'dark',
  accent = null,
  initialState = 'active', // 'active' | 'submitted' | 'cancelled' | 'inactive'
}) {
  const containerRef = useRef(null);
  
  // Form state management
  const [formState, setFormState] = useState(initialState);
  
  const isCollapsed = formState !== 'active';
  const stateClass = formState === 'active' ? '' : `artifactuse-form--${formState}`;
  
  // Parse form data from artifact.code
  const form = useMemo(() => {
    try {
      return JSON.parse(artifact.code);
    } catch {
      return { title: 'Invalid Form', variant: 'fields', data: { fields: [] } };
    }
  }, [artifact.code]);
  
  const formId = artifact.id || form.id || `form-${Date.now()}`;
  const formFields = form.data?.fields || [];
  const collapsedTitle = form.title || 'Form';
  
  // Check if form has a buttons field
  const hasButtonsField = useMemo(() => {
    return formFields.some(f => f.type === 'buttons');
  }, [formFields]);
  
  // Get button fields for buttons-only variant
  const buttonFields = useMemo(() => {
    if (form.variant === 'buttons') {
      return formFields;
    }
    return [];
  }, [form.variant, formFields]);
  
  // Initialize form values
  const [values, setValues] = useState(() => {
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
    return defaults;
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync formState with initialState prop
  useEffect(() => {
    setFormState(initialState);
  }, [initialState]);

  // Re-initialize values when artifact changes
  useEffect(() => {
    const defaults = {};
    formFields.forEach(f => {
      if (['buttons', 'divider', 'heading'].includes(f.type)) return;
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === 'checkbox') defaults[f.name] = false;
      else defaults[f.name] = '';
    });
    if (form.data?.defaults) {
      Object.assign(defaults, form.data.defaults);
    }
    setValues(defaults);
    setErrors({});
  }, [artifact.code]);

  // Apply theme and accent color
  useEffect(() => {
    if (!containerRef.current) return;
    
    containerRef.current.setAttribute('data-artifactuse-theme', theme);
    
    if (accent) {
      const rgb = parseColor(accent);
      if (rgb) {
        containerRef.current.style.setProperty('--artifactuse-primary', rgb);
      }
    }
  }, [theme, accent]);

  /**
   * Collapse the form
   */
  const collapseForm = useCallback((state) => {
    setFormState(state);
  }, []);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const validate = useCallback(() => {
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formFields, values, form.data?.validation]);

  const resetForm = useCallback(() => {
    const defaults = {};
    formFields.forEach(f => {
      if (['buttons', 'divider', 'heading'].includes(f.type)) return;
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === 'checkbox') defaults[f.name] = false;
      else defaults[f.name] = '';
    });
    if (form.data?.defaults) {
      Object.assign(defaults, form.data.defaults);
    }
    setValues(defaults);
    setErrors({});
  }, [formFields, form.data?.defaults]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    onSubmit?.({
      formId,
      action: 'submit',
      values: { ...values },
      timestamp: Date.now()
    });
    
    // Collapse after brief delay for visual feedback
    setTimeout(() => {
      setIsSubmitting(false);
      collapseForm('submitted');
    }, 300);
  }, [formId, values, onSubmit, validate, collapseForm]);

  const handleButtonAction = useCallback((btn) => {
    const action = btn.action || 'custom';
    
    switch (action) {
      case 'submit':
        handleSubmit();
        break;
        
      case 'cancel':
        onCancel?.({
          formId,
          action: 'cancel',
          buttonName: btn.name || 'cancel',
          timestamp: Date.now()
        });
        // Collapse as cancelled
        setTimeout(() => {
          collapseForm('cancelled');
        }, 150);
        break;
        
      case 'reset':
        resetForm();
        onReset?.({
          formId,
          action: 'reset',
          buttonName: btn.name || 'reset',
          timestamp: Date.now()
        });
        // Reset doesn't collapse - form stays active
        break;
        
      case 'custom':
      default:
        onButtonClick?.({
          formId,
          action,
          buttonName: btn.name || btn.label,
          buttonLabel: btn.label,
          values: { ...values },
          timestamp: Date.now()
        });
        // Custom actions collapse as submitted (action was taken)
        setTimeout(() => {
          collapseForm('submitted');
        }, 150);
        break;
    }
  }, [formId, values, handleSubmit, onCancel, onReset, onButtonClick, resetForm, collapseForm]);

  // Render collapsed state
  if (isCollapsed) {
    return (
      <div
        ref={containerRef}
        className={`artifactuse-inline-form artifactuse-form-${form.variant || 'fields'} ${stateClass} ${className}`}
        data-artifactuse-theme={theme}
      >
        <div className="artifactuse-form-collapsed">
          <div className="artifactuse-form-collapsed-icon">
            {formState === 'submitted' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
            {formState === 'cancelled' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
            {formState === 'inactive' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            )}
          </div>
          <span className="artifactuse-form-collapsed-title">{collapsedTitle}</span>
        </div>
      </div>
    );
  }

  // Render buttons-only variant
  if (form.variant === 'buttons') {
    return (
      <div 
        ref={containerRef}
        className={`artifactuse-inline-form artifactuse-form-buttons ${className}`}
        data-artifactuse-theme={theme}
      >
        {(form.title || form.description) && (
          <div className="artifactuse-form-header">
            {form.title && <div className="artifactuse-form-title">{form.title}</div>}
            {form.description && <p className="artifactuse-form-description">{form.description}</p>}
          </div>
        )}
        <div className="artifactuse-form-buttons">
          {buttonFields.map((btn, idx) => (
            <button
              key={btn.name || btn.label || idx}
              type="button"
              className={`artifactuse-form-btn artifactuse-form-btn-${btn.variant || 'secondary'}`}
              onClick={() => handleButtonAction(btn)}
              disabled={btn.disabled || isSubmitting}
            >
              {btn.icon && <span className="artifactuse-form-btn-icon" dangerouslySetInnerHTML={{ __html: btn.icon }} />}
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render fields variant
  return (
    <div 
      ref={containerRef}
      className={`artifactuse-inline-form artifactuse-form-fields ${className}`}
      data-artifactuse-theme={theme}
    >
      {(form.title || form.description) && (
        <div className="artifactuse-form-header">
          {form.title && <div className="artifactuse-form-title">{form.title}</div>}
          {form.description && <p className="artifactuse-form-description">{form.description}</p>}
        </div>
      )}
      <form onSubmit={handleSubmit} className="artifactuse-form">
        <div className="artifactuse-form-fields">
          {formFields.map((field, idx) => (
            <FormField
              key={field.name || idx}
              field={field}
              formId={formId}
              value={values[field.name]}
              error={errors[field.name]}
              isSubmitting={isSubmitting}
              onChange={(val) => handleChange(field.name, val)}
              onButtonAction={handleButtonAction}
            />
          ))}
        </div>
        
        {/* Default buttons if no buttons field exists */}
        {!hasButtonsField && (
          <div className="artifactuse-form-buttons artifactuse-form-buttons-default">
            <button
              type="button"
              className="artifactuse-form-btn artifactuse-form-btn-ghost"
              onClick={() => handleButtonAction({ action: 'cancel', label: 'Cancel' })}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="artifactuse-form-btn artifactuse-form-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting && <span className="artifactuse-form-btn-spinner" />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

/**
 * Individual Form Field
 */
function FormField({ field, formId, value, error, isSubmitting, onChange, onButtonAction }) {
  const inputId = `${formId}-${field.name}`;
  
  // Buttons group
  if (field.type === 'buttons') {
    return (
      <div className="artifactuse-form-buttons">
        {(field.fields || []).map((btn, idx) => (
          <button
            key={btn.name || btn.label || idx}
            type={btn.action === 'submit' ? 'submit' : 'button'}
            className={`artifactuse-form-btn artifactuse-form-btn-${btn.variant || 'secondary'}`}
            onClick={btn.action !== 'submit' ? () => onButtonAction(btn) : undefined}
            disabled={btn.disabled || (btn.action === 'submit' && isSubmitting)}
          >
            {isSubmitting && btn.action === 'submit' ? (
              <span className="artifactuse-form-btn-spinner" />
            ) : btn.icon ? (
              <span className="artifactuse-form-btn-icon" dangerouslySetInnerHTML={{ __html: btn.icon }} />
            ) : null}
            {isSubmitting && btn.action === 'submit' ? 'Submitting...' : btn.label}
          </button>
        ))}
      </div>
    );
  }
  
  // Divider
  if (field.type === 'divider') {
    return <div className="artifactuse-form-divider" />;
  }
  
  // Heading
  if (field.type === 'heading') {
    return <div className="artifactuse-form-heading">{field.label}</div>;
  }
  
  // Checkbox
  if (field.type === 'checkbox') {
    return (
      <div className="artifactuse-form-field">
        <label className="artifactuse-checkbox-label">
          <input
            type="checkbox"
            id={inputId}
            name={field.name}
            checked={value || false}
            disabled={field.disabled}
            className="artifactuse-checkbox"
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="artifactuse-checkbox-text">
            {field.label}
            {field.required && <span className="artifactuse-required">*</span>}
          </span>
        </label>
        {field.helpText && <span className="artifactuse-help-text">{field.helpText}</span>}
        {error && <span className="artifactuse-error-text">{error}</span>}
      </div>
    );
  }
  
  // Radio group
  if (field.type === 'radio') {
    return (
      <div className="artifactuse-form-field">
        {field.label && (
          <label className="artifactuse-label">
            {field.label}
            {field.required && <span className="artifactuse-required">*</span>}
          </label>
        )}
        <div className="artifactuse-radio-group">
          {normalizeOptions(field.options).map(opt => (
            <label key={opt.value} className="artifactuse-radio-label">
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                disabled={opt.disabled || field.disabled}
                className="artifactuse-radio"
                onChange={() => onChange(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
        {field.helpText && <span className="artifactuse-help-text">{field.helpText}</span>}
        {error && <span className="artifactuse-error-text">{error}</span>}
      </div>
    );
  }

  // Render input based on type
  const renderInput = () => {
    if (isTextInput(field.type)) {
      return (
        <input
          type={field.type}
          id={inputId}
          name={field.name}
          value={value || ''}
          placeholder={field.placeholder}
          disabled={field.disabled}
          required={field.required}
          className="artifactuse-input"
          onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      );
    }
    
    if (field.type === 'textarea') {
      return (
        <textarea
          id={inputId}
          name={field.name}
          value={value || ''}
          placeholder={field.placeholder}
          disabled={field.disabled}
          required={field.required}
          rows={field.rows || 3}
          className="artifactuse-textarea"
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    
    if (field.type === 'select') {
      return (
        <select
          id={inputId}
          name={field.name}
          value={value || ''}
          disabled={field.disabled}
          required={field.required}
          className="artifactuse-select"
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {normalizeOptions(field.options).map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
    
    // Default text input
    return (
      <input
        type="text"
        id={inputId}
        name={field.name}
        value={value || ''}
        disabled={field.disabled}
        className="artifactuse-input"
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  return (
    <div className="artifactuse-form-field">
      <label htmlFor={inputId} className="artifactuse-label">
        {field.label}
        {field.required && <span className="artifactuse-required">*</span>}
      </label>
      {renderInput()}
      {field.helpText && <span className="artifactuse-help-text">{field.helpText}</span>}
      {error && <span className="artifactuse-error-text">{error}</span>}
    </div>
  );
}

export default ArtifactuseInlineForm;