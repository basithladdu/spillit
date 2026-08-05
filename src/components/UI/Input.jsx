import React, { useId } from "react";

/**
 * Playful Geometric Input Component
 * Hard shadow on focus, clean design
 */
export const Input = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      id: idProp,
      required = false,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = idProp ?? generatedId;

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="heading-font font-bold text-sm tracking-wide uppercase text-foreground">
            {label}
            {required && <span className="text-secondary ml-1" aria-hidden>*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground transition-all duration-300 focus:border-accent focus:shadow-focus outline-none ${
              Icon ? "pl-12" : ""
            } ${error ? "border-red-500" : ""} ${className}`}
            {...props}
          />
          {Icon && (
            <Icon
              strokeWidth={2.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-red-500 text-sm font-medium" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-muted-foreground text-sm">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * Textarea Component
 */
export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      id: idProp,
      className = "",
      containerClassName = "",
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = idProp ?? generatedId;

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label htmlFor={textareaId} className="heading-font font-bold text-sm tracking-wide uppercase text-foreground">
            {label}
            {required && <span className="text-secondary ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={`w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground transition-all duration-300 focus:border-accent focus:shadow-focus outline-none resize-none ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p id={`${textareaId}-error`} className="text-red-500 text-sm font-medium" role="alert">{error}</p>}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-muted-foreground text-sm">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/**
 * Select/Dropdown Component
 */
export const Select = React.forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      options = [],
      id: idProp,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = idProp ?? generatedId;

    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="heading-font font-bold text-sm tracking-wide uppercase text-foreground">
            {label}
            {required && <span className="text-secondary ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={`w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground transition-all duration-300 focus:border-accent focus:shadow-focus outline-none cursor-pointer ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p id={`${selectId}-error`} className="text-red-500 text-sm font-medium" role="alert">{error}</p>}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-muted-foreground text-sm">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

/**
 * Checkbox Component
 */
export const Checkbox = React.forwardRef(
  ({ label, className = "", ...props }, ref) => {
    return (
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className={`w-5 h-5 border-2 border-foreground rounded-md accent-accent cursor-pointer ${className}`}
          {...props}
        />
        {label && <span className="text-foreground text-sm">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
