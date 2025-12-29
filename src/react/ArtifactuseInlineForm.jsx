// artifactuse/react/ArtifactuseInlineForm.jsx
// Inline form component for simple forms rendered in SDK

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
 * Inline Form Component
 * Renders buttons or simple field forms inline in the chat
 */
export function ArtifactuseInlineForm({ 
  form, 
  onSubmit, 
  onCancel, 
  className = '',
  theme = 'dark',
  accent = null,
}) {
  const containerRef = useRef(null);
  
  const [values, setValues] = useState(() => {
    const defaults = {};
    const fields = form.data?.fields || [];
    fields.forEach(f => {
      if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      else if (f.type === 'checkbox') defaults[f.name] = false;
    });
    return defaults;
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply theme and accent color
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set theme attribute
    containerRef.current.setAttribute('data-artifactuse-theme', theme);
    
    // Set accent color if provided
    if (accent) {
      const rgb = parseColor(accent);
      if (rgb) {
        containerRef.current.style.setProperty('--artifactuse-primary', rgb);
      }
    }
  }, [theme, accent]);

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    const fields = form.data?.fields || [];
    
    fields.forEach(field => {
      const value = values[field.name];
      if (field.required && !value && value !== 0 && value !== false) {
        newErrors[field.name] = `${field.label || 'This field'} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.data?.fields, values]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    onSubmit?.({
      formId: form.id,
      action: 'submit',
      values,
      timestamp: Date.now()
    });
    
    setTimeout(() => setIsSubmitting(false), 500);
  }, [form.id, values, onSubmit, validate]);

  const handleButtonClick = useCallback((action) => {
    if (action === 'cancel') {
      onCancel?.({ formId: form.id, action: 'cancel', timestamp: Date.now() });
    } else {
      onSubmit?.({
        formId: form.id,
        action,
        values: {},
        timestamp: Date.now()
      });
    }
  }, [form.id, onSubmit, onCancel]);

  // Render buttons variant
  if (form.variant === 'buttons') {
    return (
      <div 
        ref={containerRef}
        className={`artifactuse-inline-form artifactuse-form-buttons ${className}`}
        data-artifactuse-theme={theme}
      >
        {form.title && <div className="artifactuse-form-title">{form.title}</div>}
        {form.description && <p className="artifactuse-form-description">{form.description}</p>}
        <div className="artifactuse-form-button-group">
          {(form.data?.buttons || []).map(btn => (
            <button
              key={btn.id}
              type="button"
              className={`artifactuse-form-btn artifactuse-form-btn-${btn.style || 'primary'}`}
              onClick={() => handleButtonClick(btn.id)}
              disabled={btn.disabled}
            >
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
      {form.title && <div className="artifactuse-form-title">{form.title}</div>}
      {form.description && <p className="artifactuse-form-description">{form.description}</p>}
      <form onSubmit={handleSubmit} className="artifactuse-form">
        <div className="artifactuse-form-grid">
          {(form.data?.fields || []).map(field => (
            <FormField
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={(val) => handleChange(field.name, val)}
            />
          ))}
        </div>
        <div className="artifactuse-form-actions">
          {form.cancelLabel && (
            <button
              type="button"
              className="artifactuse-form-btn artifactuse-form-btn-secondary"
              onClick={() => handleButtonClick('cancel')}
            >
              {form.cancelLabel}
            </button>
          )}
          <button 
            type="submit" 
            className="artifactuse-form-btn artifactuse-form-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (form.submitLabel || 'Submit')}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Individual Form Field
 */
function FormField({ field, value, error, onChange }) {
  const inputId = `form-${field.name}`;
  
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'tel':
      case 'url':
      case 'number':
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
        
      case 'textarea':
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
        
      case 'select':
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
            <option value="">Select...</option>
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
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
            <span>{field.label}{field.required && <span className="artifactuse-required">*</span>}</span>
          </label>
        );
        
      case 'radio':
        return (
          <div className="artifactuse-radio-group">
            {(field.options || []).map(opt => (
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
        );
        
      default:
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
    }
  };

  // Checkbox has its own label
  if (field.type === 'checkbox') {
    return (
      <div className="artifactuse-form-field">
        {renderInput()}
        {error && <span className="artifactuse-error-text">{error}</span>}
      </div>
    );
  }

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
