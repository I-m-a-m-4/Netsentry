
import { z } from 'zod';

const ProductInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  costPrice: z.number().optional().default(0),
  stock: z.number().optional().default(0),
  category: z.string().optional(),
  categoryType: z.enum(['product', 'service']).optional().describe("Whether this is a physical product or a service."),
  orderCount: z.number().optional().describe("Number of unique orders this product appeared in over the last 90 days."),
});

const DaySummarySchema = z.object({
  date: z.string(),
  totalBookingValue: z.number(),
  orderCount: z.number(),
  topCategory: z.string().optional(),
});

const CategorySummarySchema = z.object({
  name: z.string(),
  totalBookingValue: z.number(),
  unitsSold: z.number(),
  uniqueCustomers: z.number(),
});

const ABCAnalysisSchema = z.object({
  tierA: z.array(z.string()).describe("Top 20% subjects generating ~70% revenue."),
  tierB: z.array(z.string()).describe("Next 30% subjects generating ~20% revenue."),
  tierC: z.array(z.string()).describe("Bottom 50% subjects generating ~10% revenue."),
});

const TrendAnalysisSchema = z.object({
  revenueGrowthMoM: z.number().describe("Percentage growth in revenue month-over-month."),
  avgOrderValue: z.number().describe("Average value per transaction."),
  churnRiskCount: z.number().describe("Number of previously active students who haven't ordered in 30 days."),
});

const AnomalySchema = z.object({
  date: z.string(),
  revenue: z.number(),
  deviation: z.number().describe("Standard deviations from the mean revenue."),
  type: z.enum(['spike', 'drop']),
});

const CustomerInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  orderCount: z.number().optional(),
  totalSpent: z.number().optional(),
});

export const AcademyAnalysisInputSchema = z.object({
  subjects: z.array(ProductInputSchema).describe("Key product data including performance metrics."),
  dailySummaries: z.array(DaySummarySchema).describe("Aggregated sales data grouped by day to reduce token usage."),
  categorySummaries: z.array(CategorySummarySchema).describe("Performance breakdown by category."),
  abcAnalysis: ABCAnalysisSchema.describe("Classification of subjects based on revenue contribution."),
  trends: TrendAnalysisSchema.optional(),
  anomalies: z.array(AnomalySchema).optional().describe("Statistical outliers in sales data."),
  students: z.array(CustomerInputSchema).describe("Sample list of key/typical students across segments."),
  currencySymbol: z.string().default('₦').describe("The currency symbol for formatting."),
});

export type AcademyAnalysisInput = z.infer<typeof AcademyAnalysisInputSchema>;


// --- OUTPUT SCHEMAS ---

const SmartStockRecommendationSchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  recommendedStock: z.number().describe("The suggested quantity to have for the next cycle (e.g., tomorrow, next week)."),
  confidence: z.number().describe("Confidence score (0-100) for the recommendation."),
  reason: z.string().describe("A concise explanation for the recommendation, e.g., 'Demand peaks on Wednesdays and Fridays between 4–7pm.'"),
});

const DemandHeatmapSchema = z.object({
  title: z.string().default("When Customers Buy Most"),
  insight: z.string().describe("A summary of time-based demand patterns, e.g., 'Wednesday evenings show the highest conversion rate.'"),
});

const RevenueOpportunitySchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  lostRevenue: z.number().describe("Estimated monthly revenue lost due to stockouts."),
  reason: z.string().describe("The cause of the lost revenue, e.g., 'Underproduction', 'Late restocking'."),
  suggestion: z.string().describe("A concrete suggestion, e.g., 'Increasing stock by 20% on peak days could recover ₦X monthly.'"),
});

const SmartMerchandisingSchema = z.object({
  primaryProductName: z.string(),
  pairedProductName: z.string(),
  insight: z.string().describe("The core insight, e.g., 'Customers who buy donuts also buy coffee 64% of the time.'"),
  recommendation: z.string().describe("A suggestion to boost sales, e.g., 'Place coffee near the donut display.'"),
});

const IrresistibleOfferSchema = z.object({
  offerName: z.string().describe("A catchy, marketable name for the bundle offer, e.g., 'Ultimate Hydration Kit'."),
  productIds: z.array(z.string()).describe("An array of the product IDs included in this bundle."),
  productNames: z.array(z.string()).describe("An array of the product names included in this bundle, matching the order of productIds."),
  originalTotalPrice: z.number().describe("The total price if all items were bought separately."),
  suggestedBundlePrice: z.number().describe("The AI-recommended discounted price for the bundle."),
  savings: z.number().describe("The amount the customer saves with this bundle (originalTotalPrice - suggestedBundlePrice)."),
  marketingPitch: z.string().describe("A short, compelling marketing pitch (2-3 sentences) explaining the value of the bundle to the customer."),
});


const SlowMovingInventorySchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  daysUnsold: z.number(),
  capitalLocked: z.number(),
  suggestion: z.string().describe("A strategic recommendation to recover capital. e.g., 'Bundle with [Fast-Seller]' or 'Apply a 20% discount.'"),
});

const BusinessHealthSchema = z.object({
  score: z.number().min(0).max(100).describe("The overall academy health score from 0 to 100."),
  status: z.enum(['Healthy', 'Needs Attention', 'At Risk']).describe("The one-word status of the academy."),
  summary: z.string().describe("A concise one-sentence summary explaining the current health score."),
});

const SegmentCustomerSchema = z.object({
  name: z.string().describe("The customer's full name."),
  email: z.string().optional().describe("The customer's email address if available."),
});

const CustomerSegmentSchema = z.object({
  segmentName: z.string().describe("A descriptive name for a customer group, e.g., 'Weekend High Spenders' or 'Frequent Snack Buyers'."),
  description: z.string().describe("A brief explanation of why these students are grouped together."),
  students: z.array(SegmentCustomerSchema).describe("A list of the students (name and email) in this segment."),
  suggestedCampaign: z.object({
    title: z.string().describe("A catchy email subject line for a marketing campaign targeting this segment."),
    body: z.string().describe("The full body content of the suggested email campaign, at least 10 lines long and highly personalized. Use **Markdown for emphasis** (e.g., `**15% off**`) and include a compelling offer. Use placeholders like {{customerName}} if applicable."),
    ctaText: z.string().describe("The text for a call-to-action button, e.g., 'Shop Now', 'Claim Your Offer'.")
  }),
});

const PricingRecommendationSchema = z.object({
  subjectId: z.string(),
  name: z.string(),
  currentPrice: z.number(),
  suggestedPrice: z.number(),
  strategy: z.enum(['Psychological', 'Penetration', 'Bundle']),
  reasoning: z.string().describe("A clear explanation of why this pricing strategy is recommended for this specific product."),
});


const BlogHeadlineSchema = z.object({
  headline: z.string().describe("A catchy, SEO-optimized blog headline, e.g., 'How to Increase Profit in a Lagos Supermarket'."),
  difficulty: z.enum(['low', 'med', 'high']).describe("The estimated difficulty to rank for this keyword."),
  searchVolume: z.string().describe("Estimated monthly searches, e.g., '1.2k'."),
});

const ContentPlannerSchema = z.object({
  blogFocus: z.string().describe("General topics the academy should focus on for SEO, e.g., 'Retail tech, inventory strategies'."),
  headlines: z.array(BlogHeadlineSchema).describe("A list of 5-10 suggested blog post headlines to drive organic traffic."),
});


export const AcademyAnalysisOutputSchema = z.object({
  smartStockRecommendations: z.array(SmartStockRecommendationSchema).optional().describe("Predictive stock recommendations for at least 20 key subjects, if data is available."),
  demandHeatmap: DemandHeatmapSchema.optional().describe("An analysis of when students are most active."),
  revenueOpportunities: z.array(RevenueOpportunitySchema).optional().describe("Analysis of revenue missed due to stockouts."),
  smartMerchandising: z.array(SmartMerchandisingSchema).optional().describe("Suggestions for bundling subjects to increase sales."),
  irresistibleOffers: z.array(IrresistibleOfferSchema).optional().describe("Creates specific, priced bundle deals with a marketing pitch to attract students."),
  slowMovingInventory: z.array(SlowMovingInventorySchema).optional().describe("Products that are not selling and are trapping capital, with recovery strategies."),
  businessHealth: BusinessHealthSchema.optional().describe("The overall academy health assessment."),
  customerSegments: z.array(CustomerSegmentSchema).optional().describe("Segments of students grouped by behavior, with targeted campaign suggestions."),
  pricingRecommendations: z.array(PricingRecommendationSchema).optional().describe("Suggestions for price adjustments to increase sales or perceived value."),
  contentPlanner: ContentPlannerSchema.optional().describe("AI-suggested blog content strategy to improve SEO and drive local traffic."),
});

export type AcademyAnalysisOutput = z.infer<typeof AcademyAnalysisOutputSchema>;
export type BlogHeadline = z.infer<typeof BlogHeadlineSchema>;
export type ContentPlanner = z.infer<typeof ContentPlannerSchema>;
