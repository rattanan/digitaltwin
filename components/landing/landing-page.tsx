import type { DashboardSnapshot } from "@/lib/demo-data";
import { AppFooter } from "@/components/layout/app-footer";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { AIAssistantSection } from "@/components/landing/ai-assistant-section";
import { ArchitectureSection } from "@/components/landing/architecture-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { CallToAction } from "@/components/landing/call-to-action";
import { CoreModules } from "@/components/landing/core-modules";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { HeroSection } from "@/components/landing/hero-section";
import { ProjectOverview } from "@/components/landing/project-overview";

export function LandingPage({ summary, isAuthenticated }: { summary: DashboardSnapshot; isAuthenticated: boolean }) {
  return <div className="min-h-screen overflow-hidden bg-[var(--background-primary)] text-[var(--text-primary)]"><LandingNavbar isAuthenticated={isAuthenticated} /><main><HeroSection isAuthenticated={isAuthenticated} /><ProjectOverview /><CoreModules /><DashboardPreview summary={summary} /><BenefitsSection /><AIAssistantSection summary={summary} /><ArchitectureSection /><CallToAction isAuthenticated={isAuthenticated} /></main><AppFooter /></div>;
}
