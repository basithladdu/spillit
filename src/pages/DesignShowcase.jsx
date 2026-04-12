import React from "react";
import {
  Button,
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardGrid,
  Input,
  Container,
  Section,
  Grid,
  Stack,
} from "../components/UI";
import {
  Heart,
  MapPin,
  Zap,
  Check,
  Mail,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

/**
 * Design System Showcase
 * Demonstrates all available components and their variants
 */
export default function DesignSystemShowcase() {
  const [inputValue, setInputValue] = React.useState("");

  return (
    <div className="bg-background text-foreground min-h-screen py-12">
      <Container>
        {/* HEADER */}
        <div className="mb-24 text-center">
          <h1 className="heading-font text-6xl font-bold mb-4">
            Playful Geometric Design System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A vibrant, friendly, and accessible design system for modern web
            applications.
          </p>
        </div>

        {/* SECTION: BUTTONS */}
        <Section className="bg-muted rounded-2xl">
          <h2 className="heading-font text-4xl font-bold mb-8">Buttons</h2>

          <div className="space-y-8">
            {/* Variants */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">Variants</h3>
              <Stack direction="horizontal" gap={4} className="flex-wrap">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tertiary">Tertiary</Button>
                <Button variant="quaternary">Quaternary</Button>
                <Button variant="danger">Danger</Button>
              </Stack>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">Sizes</h3>
              <Stack direction="horizontal" gap={4} className="flex-wrap items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Stack>
            </div>

            {/* With Icons */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">
                With Icons
              </h3>
              <Stack direction="horizontal" gap={4} className="flex-wrap">
                <Button variant="primary" icon={ArrowRight}>
                  Next Step
                </Button>
                <Button variant="secondary" icon={Heart}>
                  Save
                </Button>
                <Button variant="tertiary" icon={Check}>
                  Confirm
                </Button>
              </Stack>
            </div>

            {/* States */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">States</h3>
              <Stack direction="horizontal" gap={4} className="flex-wrap">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="primary" isLoading>
                  Loading
                </Button>
              </Stack>
            </div>
          </div>
        </Section>

        {/* SECTION: CARDS */}
        <Section className="bg-muted rounded-2xl mt-24">
          <h2 className="heading-font text-4xl font-bold mb-8">Cards</h2>

          <div className="space-y-12">
            {/* Basic Cards */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">Basic Cards</h3>
              <CardGrid>
                <Card>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description text goes here</CardDescription>
                  <CardContent>
                    <p>Some content inside the card body.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardTitle>Another Card</CardTitle>
                  <CardDescription>More card variants</CardDescription>
                  <CardContent>
                    <p>Each card is interactive and responsive.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardTitle>Third Card</CardTitle>
                  <CardDescription>Hover to see the effect</CardDescription>
                  <CardContent>
                    <p>Cards have a playful rotation on hover.</p>
                  </CardContent>
                </Card>
              </CardGrid>
            </div>

            {/* Cards with Icons */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">
                Cards with Icons
              </h3>
              <CardGrid>
                <Card icon={MapPin} iconColor="bg-accent">
                  <CardTitle>Location</CardTitle>
                  <CardDescription>Pin your memories to places</CardDescription>
                </Card>

                <Card icon={Heart} iconColor="bg-secondary">
                  <CardTitle>Stories</CardTitle>
                  <CardDescription>Share what matters to you</CardDescription>
                </Card>

                <Card icon={Zap} iconColor="bg-quaternary">
                  <CardTitle>Discovery</CardTitle>
                  <CardDescription>Find memories near you</CardDescription>
                </Card>
              </CardGrid>
            </div>

            {/* Cards with Different Shadows */}
            <div>
              <h3 className="heading-font text-2xl font-bold mb-4">
                Card Shadows
              </h3>
              <Grid columns={2}>
                <Card shadow="shadow-sticker">
                  <CardTitle>Standard Shadow</CardTitle>
                  <CardDescription>8px offset, light gray</CardDescription>
                </Card>

                <Card shadow="shadow-sticker-pink">
                  <CardTitle>Featured Shadow</CardTitle>
                  <CardDescription>8px offset, pink accent</CardDescription>
                </Card>
              </Grid>
            </div>
          </div>
        </Section>

        {/* SECTION: FORM INPUTS */}
        <Section className="bg-muted rounded-2xl mt-24">
          <h2 className="heading-font text-4xl font-bold mb-8">Form Inputs</h2>

          <Grid columns={2}>
            <div>
              <Input
                label="Text Input"
                placeholder="Enter some text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Email Input"
                icon={Mail}
                type="email"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <Input
                label="Required Field"
                placeholder="This is required"
                required
                helperText="This field cannot be empty"
              />
            </div>

            <div>
              <Input
                label="Error State"
                placeholder="Invalid input"
                error="This field has an error"
              />
            </div>

            <div className="col-span-2">
              <Input
                label="With Icon"
                icon={MessageCircle}
                placeholder="What's on your mind?"
              />
            </div>
          </Grid>
        </Section>

        {/* SECTION: COLOR PALETTE */}
        <Section className="mt-24">
          <h2 className="heading-font text-4xl font-bold mb-8">Color Palette</h2>

          <Grid columns={3}>
            {[
              { name: "Background", hex: "#FFFDF5", class: "bg-background" },
              { name: "Foreground", hex: "#1E293B", class: "bg-foreground" },
              { name: "Muted", hex: "#F1F5F9", class: "bg-muted" },
              { name: "Accent", hex: "#8B5CF6", class: "bg-accent" },
              { name: "Secondary", hex: "#F472B6", class: "bg-secondary" },
              { name: "Tertiary", hex: "#FBBF24", class: "bg-tertiary" },
              { name: "Quaternary", hex: "#34D399", class: "bg-quaternary" },
              { name: "Border", hex: "#E2E8F0", class: "bg-border" },
              { name: "Input", hex: "#FFFFFF", class: "bg-input" },
            ].map(({ name, hex, class: bgClass }) => (
              <div key={name} className="space-y-2">
                <div
                  className={`h-24 rounded-lg border-2 border-foreground shadow-pop ${bgClass}`}
                />
                <div className="space-y-1">
                  <p className="heading-font font-bold text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{hex}</p>
                </div>
              </div>
            ))}
          </Grid>
        </Section>

        {/* SECTION: TYPOGRAPHY */}
        <Section className="mt-24">
          <h2 className="heading-font text-4xl font-bold mb-8">Typography</h2>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Heading Font (Outfit)
              </p>
              <div className="space-y-2">
                <h1 className="heading-font text-5xl font-bold">Heading 5xl</h1>
                <h2 className="heading-font text-4xl font-bold">Heading 4xl</h2>
                <h3 className="heading-font text-3xl font-bold">Heading 3xl</h3>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Body Font (Plus Jakarta Sans)
              </p>
              <div className="space-y-2">
                <p className="text-lg">Large text (1.25rem)</p>
                <p className="text-base">Base text (1rem)</p>
                <p className="text-sm">Small text (0.8rem)</p>
                <p className="text-xs">Extra small text (0.64rem)</p>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION: SHADOWS */}
        <Section className="mt-24">
          <h2 className="heading-font text-4xl font-bold mb-8">Shadows</h2>

          <Grid columns={2}>
            {[
              { name: "Shadow Pop", class: "shadow-pop" },
              { name: "Shadow Pop Hover", class: "shadow-pop-hover" },
              { name: "Shadow Pop Active", class: "shadow-pop-active" },
              { name: "Shadow Sticker", class: "shadow-sticker" },
              { name: "Shadow Sticker Pink", class: "shadow-sticker-pink" },
              { name: "Shadow Focus", class: "shadow-focus" },
            ].map(({ name, class: shadowClass }) => (
              <div
                key={name}
                className={`h-32 bg-card border-2 border-border rounded-lg flex items-center justify-center ${shadowClass}`}
              >
                <p className="text-sm font-bold text-center">{name}</p>
              </div>
            ))}
          </Grid>
        </Section>

        {/* FOOTER */}
        <div className="mt-24 pt-12 border-t-2 border-border text-center space-y-4">
          <p className="text-muted-foreground">
            Playful Geometric Design System © 2025
          </p>
          <p className="text-sm text-muted-foreground">
            Built for Spillit with care
          </p>
        </div>
      </Container>
    </div>
  );
}
