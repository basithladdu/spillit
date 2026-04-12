import React from "react";

/**
 * Container with max-width and centered content
 */
export const Container = ({ children, className = "" }) => (
  <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

/**
 * Section with generous vertical spacing
 */
export const Section = ({ children, className = "", decorative = false }) => (
  <section className={`py-24 px-4 relative ${className}`}>
    {decorative && <SectionDecorations />}
    <Container>{children}</Container>
  </section>
);

/**
 * Hero Section with left-right split
 */
export const HeroSection = ({
  title,
  subtitle,
  description,
  cta,
  imageElement,
  className = "",
}) => (
  <Section className={`pt-32 pb-16 ${className}`}>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      {/* Left: Content */}
      <div className="space-y-6 relative z-10">
        {/* Decorative circle behind */}
        <div className="absolute -left-32 -top-16 w-96 h-96 bg-tertiary rounded-full opacity-20 -z-10 blur-3xl" />

        <div>
          {subtitle && (
            <span className="text-accent font-bold text-sm tracking-wide uppercase">
              {subtitle}
            </span>
          )}
          {title && (
            <h1 className="heading-font text-5xl md:text-6xl font-bold text-foreground mt-2">
              {title}
            </h1>
          )}
        </div>

        {description && (
          <p className="text-lg text-muted-foreground max-w-md">{description}</p>
        )}

        {cta && <div className="pt-4">{cta}</div>}
      </div>

      {/* Right: Image/Element */}
      {imageElement && (
        <div className="relative">
          {/* Decorative dots pattern */}
          <div className="absolute -inset-8 bg-dots opacity-50 rounded-xl" />
          <div className="relative z-10 bg-dots">{imageElement}</div>
        </div>
      )}
    </div>
  </Section>
);

/**
 * Feature Grid Section
 */
export const FeaturesSection = ({ features, className = "" }) => (
  <Section decorative className={className}>
    <div className="mb-12 text-center">
      <h2 className="heading-font text-4xl font-bold text-foreground">Features</h2>
      <p className="text-muted-foreground mt-2 text-lg">
        Everything you need, beautifully simple
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
      {/* SVG connecting lines (decorative) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        <defs>
          <style>{`
            .connecting-line {
              stroke: #E2E8F0;
              stroke-width: 2;
              stroke-dasharray: 5, 5;
              fill: none;
            }
          `}</style>
        </defs>
        <line x1="200" y1="100" x2="400" y2="100" className="connecting-line" />
        <line x1="600" y1="100" x2="800" y2="100" className="connecting-line" />
      </svg>

      {/* Features */}
      <div className="relative z-10">
        {features[0]}
      </div>
      <div className="relative z-10">
        {features[1]}
      </div>
      <div className="relative z-10">
        {features[2]}
      </div>
    </div>
  </Section>
);

/**
 * Pricing Section with featured middle card
 */
export const PricingSection = ({ plans, className = "" }) => (
  <Section className={className}>
    <div className="mb-12 text-center">
      <h2 className="heading-font text-4xl font-bold text-foreground">
        Simple Pricing
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {plans.map((plan, idx) => (
        <div
          key={idx}
          className={`transform transition-transform duration-300 ${
            plan.featured ? "scale-110 -mt-4" : ""
          }`}
        >
          {plan.featured && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-tertiary text-foreground px-4 py-2 rounded-full font-bold text-sm transform -rotate-12 shadow-pop">
                MOST POPULAR
              </div>
            </div>
          )}
          {plan.component}
        </div>
      ))}
    </div>
  </Section>
);

/**
 * CTA Section with emphasis
 */
export const CTASection = ({ title, description, cta, className = "" }) => (
  <Section className={className}>
    <div className="bg-gradient-to-br from-accent via-accent to-purple-600 rounded-2xl p-12 text-center text-white relative overflow-hidden shadow-pop">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />

      <div className="relative z-10">
        <h2 className="heading-font text-4xl font-bold mb-4">{title}</h2>
        <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">{description}</p>
        {cta}
      </div>
    </div>
  </Section>
);

/**
 * Decorative Elements
 */
const SectionDecorations = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Floating circles */}
    <div className="absolute top-20 right-10 w-32 h-32 bg-secondary rounded-full opacity-10 animate-float" />
    <div className="absolute bottom-20 left-10 w-24 h-24 bg-quaternary rounded-full opacity-10 animate-float-slow" />
    <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-tertiary rounded-full opacity-5" />
  </div>
);

/**
 * Grid layout for 2D content
 */
export const Grid = ({ columns = 3, children, className = "" }) => (
  <div
    className={`grid grid-cols-1 ${
      columns === 2
        ? "md:grid-cols-2"
        : columns === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-4"
    } gap-6 ${className}`}
  >
    {children}
  </div>
);

/**
 * Stack layout (vertical or horizontal)
 */
export const Stack = ({
  direction = "vertical",
  gap = 4,
  children,
  className = "",
}) => (
  <div
    className={`flex ${direction === "horizontal" ? "flex-row" : "flex-col"} gap-${gap} ${className}`}
  >
    {children}
  </div>
);
