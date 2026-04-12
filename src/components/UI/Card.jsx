import React from "react";

/**
 * Playful Geometric Card Component
 * "Sticker" style with hard shadow and rotation on hover
 */
export const Card = React.forwardRef(
  (
    {
      children,
      className = "",
      interactive = true,
      icon: Icon,
      iconColor = "bg-accent",
      shadow = "shadow-sticker",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`bg-card border-2 border-foreground rounded-lg p-6 ${shadow} ${
          interactive ? "hover:rotate-[-1deg] hover:scale-102 cursor-pointer" : ""
        } transition-all duration-300 relative ${className}`}
        {...props}
      >
        {Icon && (
          <div
            className={`absolute -top-6 left-6 w-12 h-12 rounded-full ${iconColor} flex items-center justify-center shadow-pop`}
          >
            <Icon strokeWidth={2.5} className="w-6 h-6 text-white" />
          </div>
        )}
        <div className={Icon ? "pt-2" : ""}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

/**
 * Card Header
 */
export const CardHeader = ({ children, className = "" }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

/**
 * Card Title (uses heading font)
 */
export const CardTitle = ({ children, className = "" }) => (
  <h3 className={`heading-font text-2xl font-bold text-foreground ${className}`}>
    {children}
  </h3>
);

/**
 * Card Description
 */
export const CardDescription = ({ children, className = "" }) => (
  <p className={`text-muted-foreground text-sm mt-1 ${className}`}>{children}</p>
);

/**
 * Card Content
 */
export const CardContent = ({ children, className = "" }) => (
  <div className={`space-y-3 ${className}`}>{children}</div>
);

/**
 * Card Footer (for actions)
 */
export const CardFooter = ({ children, className = "" }) => (
  <div className={`mt-6 pt-4 border-t border-border flex gap-2 ${className}`}>
    {children}
  </div>
);

/**
 * Grid of cards
 */
export const CardGrid = ({ children, className = "" }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
    {children}
  </div>
);
