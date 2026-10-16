import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Us a Coffee | Support NetHelm & NetSentry',
  description: 'Contribute directly to support the independent engineering and high-speed infrastructure of NetHelm and NetSentry. Fast checkout via Flutterwave or Paystack.',
  openGraph: {
    title: 'Support NetHelm & NetSentry Development',
    description: 'Buy us a coffee! Fast, 256-bit encrypted checkout via Flutterwave or Paystack.',
    images: ['/app-icon.svg'],
  },
};

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
