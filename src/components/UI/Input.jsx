import React from "react";

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
      required = false,
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label className="heading-font font-bold text-sm tracking-wide uppercase text-foreground">
            {label}
            {required && <span className="text-secondary ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground transition-all duration-300 focus:border-accent focus:shadow-focus outline-none ${
              Icon ? "pl-12" : ""
            } ${error ? "border-red-500" : ""} ${className}`}
            {...props}
          />
          {Icon && (
            <Icon
              strokeWidth={2.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
            />
          )}
        </div>
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-muted-foreground text-sm">{helperText}</p>
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
      className = "",
      containerClassName = "",
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label className="heading-font font-bold text-sm tracking-wide uppercase text-foreground">
            {label}
            {required && <span className="text-secondary ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`w-full bg-input border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground transition-all duration-300 focus:border-accent focus:shadow-focus outline-none resize-none ${
            error ? "border-red-500" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-muted-foreground text-sm">{helperText}</p>
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
      className = "",
      containerClassName = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className={`flex flex-col gap-2 ${containerClassName}`}>
        {label && (
          <label className="heading-font font-bold text-sm tracking-wide uppercase text-foreground">
            {label}
            {required && <span className="text-secondary ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
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
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-muted-foreground text-sm">{helperText}</p>
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
