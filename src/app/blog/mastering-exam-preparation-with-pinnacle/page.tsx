import { Metadata } from 'next';
import MasteringPinnacleClient from './mastering-pinnacle-client';

export const metadata: Metadata = {
  title: 'Mastering Exam Preparation: The Pinnacle Framework for Success | Pinnacle Blog',
  description: 'Succeeding in your examinations in Nigeria requires command over your study schedules, syllabus coverage, and performance tracking. Learn the five pillars of academic excellence.',
  openGraph: {
    title: 'Mastering Exam Preparation: The Pinnacle Framework for Success',
    description: 'The ultimate guide to scoring high in JAMB, WAEC, post-UTME, and university exams with Pinnacle Academia.',
    images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070'],
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mastering Exam Preparation: The Pinnacle Framework for Success',
    description: 'Transform your study habits and excel with the Pinnacle framework.',
    images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070'],
  },
};

export default function Page() {
  return <MasteringPinnacleClient />;
}
