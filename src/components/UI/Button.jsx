import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * Playful Geometric Button Component
 * Supports primary, secondary, and tertiary variants with hard shadows and playful interactions
 */
export const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon: Icon,
      isLoading = false,
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "font-heading font-bold rounded-full border-2 border-foreground transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-pop-active hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap";

    const variants = {
      primary: `bg-accent text-accent-foreground shadow-pop hover:shadow-pop-hover`,
      secondary: `bg-transparent text-foreground shadow-none hover:bg-tertiary hover:border-accent hover:shadow-pop`,
      tertiary: `bg-tertiary text-foreground shadow-pop hover:shadow-pop-hover`,
      quaternary: `bg-quaternary text-foreground shadow-pop hover:shadow-pop-hover`,
      danger: `bg-red-500 text-white shadow-pop hover:shadow-pop-hover`,
    };

    const sizes = {
      sm: "px-3 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading...
          </>
        ) : (
          <>
            {Icon && <Icon strokeWidth={2.5} className="h-5 w-5" />}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * Button Group - for related actions
 */
export const ButtonGroup = ({ children, className = "" }) => (
  <div className={`flex gap-3 flex-wrap ${className}`}>{children}</div>
);

/**
 * Hero CTA Button with arrow icon
 */
export const CTAButton = React.forwardRef((props, ref) => (
  <Button
    ref={ref}
    variant="primary"
    size="lg"
    icon={ChevronRight}
    {...props}
  />
));

CTAButton.displayName = "CTAButton";
