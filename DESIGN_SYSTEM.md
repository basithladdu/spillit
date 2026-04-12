# Playful Geometric Design System - Implementation Guide

Welcome to the **Spillit** app with the **Playful Geometric** design system integrated! This document explains the structure, usage, and best practices for working with the new design system.

---

## 📋 Overview

The **Playful Geometric** design system brings a vibrant, friendly, and tactile experience to Spillit. It features:

- **Warm, Light Palette**: Cream background (#FFFDF5) with punchy accent colors
- **Hard Shadows**: Bold, offset shadows (no blur) for a "sticker" cut-out paper effect
- **Geometric Shapes**: Circles, pills, and blobs for decorative elements
- **Bounce Animations**: Playful interactions with cubic-bezier easing
- **Typography**: **Outfit** for headings (geometric, friendly) + **Plus Jakarta Sans** for body text (highly legible)

---

## 🎨 Design Tokens

All design tokens are defined in `tailwind.config.js` and available as Tailwind classes:

### Colors

```javascript
// Available as bg-{color}, text-{color}, border-{color}
background        #FFFDF5   // Warm cream background
foreground        #1E293B   // Dark slate text
muted             #F1F5F9   // Light muted background
muted-foreground  #64748B   // Muted text
accent            #8B5CF6   // Vivid violet (primary)
accent-foreground #FFFFFF   // White text
secondary         #F472B6   // Hot pink
tertiary          #FBBF24   // Amber/yellow
quaternary        #34D399   // Mint green
border            #E2E8F0   // Light border
input             #FFFFFF   // White for form inputs
card              #FFFFFF   // White for cards
ring              #8B5CF6   // Focus ring (accent)
```

### Typography

```javascript
// Font Families
--font-heading: "Outfit", system-ui, sans-serif
--font-body: "Plus Jakarta Sans", system-ui, sans-serif

// Font Sizes (1.25 Major Third Scale)
xs   : 0.64rem
sm   : 0.8rem
base : 1rem
lg   : 1.25rem
xl   : 1.5625rem
2xl  : 1.953rem
3xl  : 2.441rem
4xl  : 3.052rem
5xl  : 3.815rem
```

### Radius

```javascript
rounded-sm : 8px
rounded-md : 16px
rounded-lg : 24px
rounded-full : 9999px (pill shape)
```

### Shadows

```javascript
shadow-pop           // 4px 4px 0px #1E293B (default)
shadow-pop-hover     // 6px 6px 0px #1E293B (on hover)
shadow-pop-active    // 2px 2px 0px #1E293B (on click)
shadow-sticker       // 8px 8px 0px #E2E8F0 (cards)
shadow-sticker-pink  // 8px 8px 0px #F472B6 (featured cards)
shadow-focus         // 4px 4px 0px #8B5CF6 (focus states)
```

---

## 🧩 Component Library

All reusable components are located in `src/components/UI/` and exported from `src/components/UI/index.js`.

### Button

```jsx
import { Button, ButtonGroup, CTAButton } from '../components/UI';

// Primary button (violet with hard shadow)
<Button variant="primary" size="md">
  Click Me
</Button>

// Variants: primary, secondary, tertiary, quaternary, danger
// Sizes: sm, md, lg

// With Icon
import { ArrowRight } from 'lucide-react';
<Button variant="primary" icon={ArrowRight}>
  Next
</Button>

// Loading state
<Button isLoading>Saving...</Button>

// Button Group
<ButtonGroup>
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</ButtonGroup>

// CTA Button (with arrow icon by default)
<CTAButton>Get Started</CTAButton>
```

### Card

```jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardGrid,
} from '../components/UI';

// Basic card
<Card>
  <CardTitle>Title</CardTitle>
  <CardDescription>Subtitle</CardDescription>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
</Card>

// Card with icon
import { MapPin } from 'lucide-react';
<Card icon={MapPin} iconColor="bg-accent">
  <CardTitle>Map Your Memories</CardTitle>
  <CardDescription>Pin stories to locations</CardDescription>
</Card>

// Card with custom shadow
<Card shadow="shadow-sticker-pink">
  Featured card with pink shadow
</Card>

// Grid of cards
<CardGrid>
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</CardGrid>
```

### Input / Form Components

```jsx
import { Input, Textarea, Select, Checkbox } from '../components/UI';

// Text input
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>

// Input with icon
import { Mail } from 'lucide-react';
<Input
  label="Email"
  icon={Mail}
  placeholder="you@example.com"
/>

// Input with error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// Textarea
<Textarea
  label="Your Story"
  placeholder="What happened here?"
  rows={4}
/>

// Select
<Select
  label="Category"
  options={[
    { value: 'happy', label: '😊 Happy Memory' },
    { value: 'sad', label: '😢 Sad Memory' },
  ]}
/>

// Checkbox
<Checkbox label="I agree to the terms" />
```

### Layout Components

```jsx
import {
  Container,
  Section,
  HeroSection,
  FeaturesSection,
  PricingSection,
  CTASection,
  Grid,
  Stack,
} from '../components/UI';

// Container (max-width container)
<Container>
  <h1>Content here</h1>
</Container>

// Section with decorative elements
<Section decorative>
  <h2>Why Choose Us?</h2>
  <p>Because we're awesome!</p>
</Section>

// Hero section (left text, right image)
<HeroSection
  title="Where were you when it all changed?"
  subtitle="Spill It"
  description="Drop your stories on the map."
  cta={<Button>Start Now</Button>}
  imageElement={<img src="hero.jpg" />}
/>

// Features section with connected cards
<FeaturesSection
  features={[
    <Card icon={MapPin} key="1">Features 1</Card>,
    <Card icon={Heart} key="2">Features 2</Card>,
    <Card icon={Zap} key="3">Features 3</Card>,
  ]}
/>

// Call-to-action section
<CTASection
  title="Ready to get started?"
  description="Join thousands sharing their memories."
  cta={<Button>Start Now</Button>}
/>

// Grid layout
<Grid columns={3}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>

// Stack (vertical or horizontal)
<Stack direction="vertical" gap={4}>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Stack>
```

---

## 🎯 Usage Examples

### Example: Landing Page Hero

```jsx
import { HeroSection, Button, Container, Section, Card, CardGrid, CardTitle, CardDescription } from '../components/UI';
import { MapPin, Heart, Zap, ArrowRight } from 'lucide-react';

export default function LandingHero() {
  return (
    <>
      <HeroSection
        title="Map Your Memories"
        subtitle="Spill It"
        description="Drop your anonymous stories on the map and discover what happened near you."
        cta={
          <Button variant="primary" size="lg" icon={ArrowRight}>
            Start Spilling
          </Button>
        }
        imageElement={
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-tertiary to-quaternary rounded-2xl border-2 border-foreground shadow-pop">
            <MapPin className="w-32 h-32 text-foreground opacity-30" />
          </div>
        }
      />

      <Section decorative className="bg-muted">
        <CardGrid>
          <Card icon={MapPin} iconColor="bg-accent">
            <CardTitle>Pin Your Story</CardTitle>
            <CardDescription>Share at the exact location it happened.</CardDescription>
          </Card>
          <Card icon={Heart} iconColor="bg-secondary">
            <CardTitle>Stay Anonymous</CardTitle>
            <CardDescription>Share freely without revealing your identity.</CardDescription>
          </Card>
          <Card icon={Zap} iconColor="bg-quaternary">
            <CardTitle>Discover Stories</CardTitle>
            <CardDescription>Explore memories from around the world.</CardDescription>
          </Card>
        </CardGrid>
      </Section>
    </>
  );
}
```

### Example: Form Page

```jsx
import { Container, Section, Button, Input, Textarea, Select, Card, CardTitle, CardContent } from '../components/UI';
import { Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
    category: 'feedback',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <Section>
      <Container>
        <Card className="max-w-lg mx-auto">
          <CardTitle>Get in Touch</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                icon={Mail}
                type="email"
                placeholder="your@email.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Select
                label="Category"
                options={[
                  { value: 'feedback', label: '💬 Feedback' },
                  { value: 'bug', label: '🐛 Bug Report' },
                  { value: 'feature', label: '✨ Feature Request' },
                ]}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />

              <Textarea
                label="Your Message"
                icon={MessageCircle}
                placeholder="Tell us what you think..."
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />

              <Button variant="primary" size="lg" className="w-full">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
```

---

## 🎨 Utility Classes

### Shadow Classes

```jsx
// Hard shadows (sticker effect)
<div className="shadow-pop">Default shadow</div>
<div className="shadow-pop-hover">Lifted state</div>
<div className="shadow-pop-active">Pressed state</div>

// Card shadows
<div className="shadow-sticker">Standard card</div>
<div className="shadow-sticker-pink">Featured card</div>

// Focus state
<div className="shadow-focus">Focused state</div>
```

### Pattern Utilities

```jsx
// Dot pattern background
<div className="bg-dots">Content with dot pattern</div>

// Blob shapes
<div className="shape-blob w-64 h-64 bg-tertiary"></div>

// Arch shapes
<div className="shape-arch w-full h-32 bg-accent"></div>
```

### Animation Classes

```jsx
// Pop-in animation
<div className="animate-pop-in">Pops in on mount</div>

// Wiggle animation (on hover)
<div className="hover:animate-wiggle">Wiggles on hover</div>
```

---

## 🌐 Global CSS Classes

All global styles are in `src/index.css`:

- `.heading-font` - Apply Outfit heading font
- `.shadow-pop` - Apply hard shadow effect
- `.bg-dots` - Apply dot pattern background
- `.shape-blob` - Apply blob shape radius
- `.shape-arch` - Apply arch shape radius

---

## 🚀 Best Practices

### 1. **Use Semantic Color Meanings**

```jsx
// ✅ Good - Use colors semantically
<Button variant="primary">Save</Button>        // Violet (primary action)
<Button variant="secondary">Cancel</Button>   // Pink (secondary)
<Button variant="tertiary">Learn More</Button> // Yellow (info)
<Button variant="danger">Delete</Button>      // Red (destructive)

// ❌ Avoid - Random color choices
<Button variant="tertiary">Save</Button> // Confusing
```

### 2. **Combine Icons with Color Context**

```jsx
// ✅ Good - Icon + colored circle + meaning
<Card icon={MapPin} iconColor="bg-accent">
  Map Your Story

// ❌ Avoid - Icon alone
<Card icon={MapPin}>
  Location
```

### 3. **Use the Typography Scale**

```jsx
// ✅ Good - Use consistent scale
<h1 className="heading-font text-5xl font-bold">Main Title</h1>
<h2 className="heading-font text-3xl font-bold">Section</h2>
<p className="text-base">Body text</p>

// ❌ Avoid - Random sizes
<h1 className="text-6xl">Title</h1>
<p className="text-sm">Random size</p>
```

### 4. **Respect Reduced Motion Preference**

All animations automatically respect `prefers-reduced-motion` via CSS media query.

```jsx
// No extra work needed - animations disable automatically for users who prefer reduced motion
<div className="animate-pop-in">This respects user preferences</div>
```

### 5. **Mobile-First Responsive Design**

```jsx
// ✅ Good - Mobile-first, then enhance
<div className="px-4 md:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
  </div>
</div>
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── UI/
│   │   ├── Button.jsx        // Button component
│   │   ├── Card.jsx          // Card component family
│   │   ├── Input.jsx         // Form input components
│   │   ├── Layout.jsx        // Layout primitives
│   │   └── index.js          // Barrel export
│   ├── Navbar.jsx            // Navigation
│   ├── Footer.jsx            // Footer
│   └── ...other components
├── pages/
│   ├── Home.jsx              // Map/main experience
│   ├── LandingPage.jsx       // Marketing landing page
│   ├── Login.jsx
│   ├── Register.jsx
│   └── ...other pages
├── App.jsx                   // Main app
├── index.css                 // Global styles + design tokens
└── main.jsx                  // Entry point

tailwind.config.js            // Tailwind configuration with design tokens
postcss.config.js             // PostCSS configuration
```

---

## 🎓 Color Usage Guide

Use colors **rotationally** for decorative elements to create a "confetti" effect:

- **Accent (Violet)**: Primary actions, important elements
- **Secondary (Pink)**: Featured items, highlights
- **Tertiary (Yellow)**: Warnings, info, alternate actions
- **Quaternary (Mint)**: Success, positive feedback, additional accents

---

## 🔧 Customization

To customize the design system, edit `tailwind.config.js`:

```javascript
// Change a color
colors: {
  accent: "#YOUR_NEW_COLOR",
  ...
}

// Add a new font size
fontSize: {
  "custom": "2.5rem",
  ...
}

// Add new shadow
boxShadow: {
  "custom": "10px 10px 0px #000",
  ...
}
```

Then rebuild: `npm run build`

---

## 📚 Resources

- **Tailwind Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/
- **Design System Figma**: (Link to design file if available)

---

## 🎉 That's it!

You're now ready to build beautiful, playful interfaces with the **Playful Geometric** design system. Happy coding!
