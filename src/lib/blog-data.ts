export type StaticBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  category: string;
  authorName: string;
  createdAtDate: string;
  content: string;
  isProgrammatic?: boolean;
  directAnswer?: string;
  faq?: { question: string; answer: string }[];
  tableData?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
};

export const blogPosts: StaticBlogPost[] = [];

export const allBlogPosts = blogPosts;

export function getRelatedPosts(currentSlug: string, count: number = 3): StaticBlogPost[] {
  const currentPost = allBlogPosts.find(p => p.slug === currentSlug);
  if (!currentPost) return [];

  const sameCategory = allBlogPosts.filter(p => p.category === currentPost.category && p.slug !== currentSlug);
  const fallback = allBlogPosts.filter(p => p.slug !== currentSlug);

  const pool = sameCategory.length > 0 ? sameCategory : fallback;
  return pool.slice(0, count);
}
