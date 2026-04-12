import React from "react";
import { MapPin, Heart, Zap, Users, ArrowRight, Check } from "lucide-react";
import {
  Button,
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardGrid,
  Container,
  Section,
  HeroSection,
  CTASection,
  Grid,
  Stack,
} from "../components/UI";
import { Link } from "react-router-dom";

function LandingPage() {
  const features = [
    {
      icon: MapPin,
      title: "Map Your Memories",
      description: "Pin your stories to the exact locations where they happened.",
      color: "bg-accent",
    },
    {
      icon: Heart,
      title: "Share Anonymously",
      description: "Express yourself freely without revealing your identity.",
      color: "bg-secondary",
    },
    {
      icon: Zap,
      title: "Discover Stories",
      description: "Explore real memories from around the world in real-time.",
      color: "bg-quaternary",
    },
  ];

  const pricingPlans = [
    {
      name: "Casual",
      price: "$0",
      description: "For memory keepers",
      features: ["Upload memories", "View map", "Like stories"],
      cta: "Get Started",
      featured: false,
    },
    {
      name: "Explorer",
      price: "$4.99",
      description: "For storytellers",
      features: ["Everything in Casual", "Custom themes", "Advanced filters", "Bulk upload"],
      cta: "Start Exploring",
      featured: true,
    },
    {
      name: "Legendary",
      price: "$9.99",
      description: "For memory enthusiasts",
      features: [
        "Everything in Explorer",
        "Private galleries",
        "Export to PDF",
        "Priority support",
      ],
      cta: "Become Legendary",
      featured: false,
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* HERO */}
      <HeroSection
        title="Where were you when it all changed?"
        subtitle="Spill It"
        description="Drop your anonymous stories, memories, and secrets on the map. Let the world know what happened here."
        cta={
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/login">
              <Button variant="primary" size="lg">
                Start Spilling <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/gallery">
              <Button variant="secondary" size="lg">
                Explore Stories
              </Button>
            </Link>
          </div>
        }
        imageElement={
          <div className="flex items-center justify-center h-96 bg-gradient-to-br from-tertiary to-quaternary rounded-2xl border-2 border-foreground shadow-pop">
            <MapPin className="w-32 h-32 text-foreground opacity-30" />
          </div>
        }
      />

      {/* FEATURES */}
      <Section decorative className="bg-muted">
        <div className="mb-12 text-center">
          <h2 className="heading-font text-4xl font-bold text-foreground">
            Why Spill It?
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Three reasons to share your story with the world.
          </p>
        </div>

        <Grid columns={3}>
          {features.map((feature, idx) => (
            <Card
              key={idx}
              icon={feature.icon}
              iconColor={feature.color}
              shadow="shadow-sticker"
            >
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </Card>
          ))}
        </Grid>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="py-32">
        <div className="mb-12 text-center">
          <h2 className="heading-font text-4xl font-bold text-foreground">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center font-bold heading-font text-2xl mb-4 shadow-pop">
              1
            </div>
            <h3 className="heading-font text-xl font-bold text-foreground mb-2">
              Capture
            </h3>
            <p className="text-muted-foreground">
              Take a photo of where your memory happened.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center font-bold heading-font text-2xl mb-4 shadow-pop">
              2
            </div>
            <h3 className="heading-font text-xl font-bold text-foreground mb-2">
              Share
            </h3>
            <p className="text-muted-foreground">
              Write your story and spill your feelings anonymously.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-quaternary text-white flex items-center justify-center font-bold heading-font text-2xl mb-4 shadow-pop">
              3
            </div>
            <h3 className="heading-font text-xl font-bold text-foreground mb-2">
              Connect
            </h3>
            <p className="text-muted-foreground">
              See your memory pinned on the map for others to discover.
            </p>
          </div>
        </div>
      </Section>

      {/* SOCIAL PROOF */}
      <Section className="bg-muted">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="heading-font text-4xl font-bold text-accent mb-2">
                25K+
              </h3>
              <p className="text-muted-foreground">Memories Shared</p>
            </div>
            <div>
              <h3 className="heading-font text-4xl font-bold text-secondary mb-2">
                100+
              </h3>
              <p className="text-muted-foreground">Countries</p>
            </div>
            <div>
              <h3 className="heading-font text-4xl font-bold text-quaternary mb-2">
                50K+
              </h3>
              <p className="text-muted-foreground">Active Users</p>
            </div>
          </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section className="py-32">
        <div className="mb-12 text-center">
          <h2 className="heading-font text-4xl font-bold text-foreground">
            Simple Pricing
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Choose the plan that fits your memory journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {pricingPlans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative ${plan.featured ? "transform md:scale-110 -mt-4" : ""}`}
            >
              {plan.featured && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-tertiary text-foreground px-4 py-2 rounded-full font-bold text-sm shadow-pop transform -rotate-12">
                    MOST POPULAR
                  </div>
                </div>
              )}
              <Card
                shadow={
                  plan.featured ? "shadow-sticker-pink" : "shadow-sticker"
                }
              >
                <div>
                  <h3 className="heading-font text-2xl font-bold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-6 mb-6">
                  <span className="heading-font text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>

                <Button
                  variant={plan.featured ? "primary" : "secondary"}
                  size="md"
                  className="w-full"
                >
                  {plan.cta}
                </Button>

                <div className="mt-6 border-t border-border pt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <Check className="w-5 h-5 text-quaternary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA SECTION */}
      <CTASection
        title="Ready to spill your story?"
        description="Join thousands of people sharing their anonymous memories on the map. Your story matters."
        cta={
          <Link to="/login">
            <Button variant="primary" size="lg" className="text-white">
              Start Spilling Now <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        }
      />

      {/* FOOTER */}
      <footer className="bg-muted border-t border-border py-12 text-center">
        <Container>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-secondary" />
              <span className="heading-font font-bold text-foreground">
                Spill It
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Where memories live on the map. © 2025 Spill It. All rights
              reserved.
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <a href="/about" className="text-accent hover:text-secondary transition">
                About
              </a>
              <a href="/help" className="text-accent hover:text-secondary transition">
                Help
              </a>
              <a href="/privacy" className="text-accent hover:text-secondary transition">
                Privacy
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}

export default LandingPage;
