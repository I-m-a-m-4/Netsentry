import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FormFlow - Visual Form Builder | Engineered for Aesthetics',
  description: 'Build forms like you design art. Visual-first form builder with high visual fidelity, extended borders, and Shadcn UI native export.',
};

export default function LandingPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-neutral-950">
      <iframe
        src="/homepage.html"
        title="FormFlow - Visual Form Builder"
        className="w-full h-full border-0"
      />
    </div>
  );
}
