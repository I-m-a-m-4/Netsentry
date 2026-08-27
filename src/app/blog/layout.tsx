import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Exam Prep & Academic Insights | Pinnacle Academia',
  description: 'Stay updated with the latest academic trends, exam preparation tips, and success stories from the Pinnacle Academia community. Expert advice for students.',
  openGraph: {
    title: 'Pinnacle Academia Blog - Master Your Exams',
    description: 'Expert insights on admission guidelines, exam strategies, and educational updates.',
  }
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
