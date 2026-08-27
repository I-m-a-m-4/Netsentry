
import { Metadata } from 'next';
import PricingContent from './pricing-content';

export const metadata: Metadata = {
  title: 'Pricing Plans | Pinnacle Academia',
  description: 'Choose the perfect plan for your studies. Access our comprehensive CBT engine, past question databases, and study resources.',
  openGraph: {
    title: 'Pinnacle Academia Pricing - Scale Your Learning',
    description: 'Affordable, high-fidelity exam preparation tools and tutorials tailored for local and international examinations.',
    url: 'https://pinnacle-academia.com/pricing',
    siteName: 'Pinnacle Academia',
    images: [
      {
        url: 'https://pinnacle-academia.com/pinlogo.png',
        width: 1200,
        height: 630,
        alt: 'Pinnacle Academia Pricing Plans',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pinnacle Academia Pricing - Scale Your Learning',
    description: 'Start today and automate your learning operations.',
    images: ['https://pinnacle-academia.com/pinlogo.png'],
  },
};

export default function Page() {
  return <PricingContent />;
}
