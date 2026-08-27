
'use server';

/**
 * @fileOverview An AI agent for generating customer relationship insights.
 *
 * - getStudentInsights - A function that analyzes customer data and provides suggestions.
 */

import { ai } from '@/ai/genkit';
import { 
    StudentInsightsInputSchema, 
    StudentInsightsOutputSchema, 
    type StudentInsightsInput, 
    type StudentInsightsOutput 
} from './student-insights-types';


export async function getStudentInsights(input: StudentInsightsInput): Promise<StudentInsightsOutput> {
  return studentInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'studentInsightsPrompt',
  input: { schema: StudentInsightsInputSchema },
  output: { schema: StudentInsightsOutputSchema },
  prompt: `You are Zen AI, a CRM expert for a retail academy. Your goal is to provide concise, actionable, and well-formatted insights based on customer data. Use Markdown for formatting.

**Student Data:**
- Name: {{customerName}}
- Total Orders: {{orderCount}}
- Total Spent: ₦{{totalSpent}}
- Purchase History:
{{#each purchaseHistory}}
  - {{quantity}}x {{name}} (₦{{price}})
{{/each}}

**Your Task:**
Your response MUST be structured according to the output schema. Keep all text concise to be budget-friendly.

1.  **Summary:** Write a 2-sentence summary characterizing this customer. Use bold text for key characterizations (e.g., "**High-value**, frequent buyer").
2.  **Subject Suggestions:** Suggest 2-3 product *categories* or *types* they might like. Each suggestion should be a short, direct phrase suitable for a bullet point. Do not suggest subjects they have already bought.
3.  **Engagement Tactics:** Provide 2-3 concrete, actionable ideas for engagement. Each tactic should be a clear, single-sentence recommendation suitable for a bullet point.
`,
});

const studentInsightsFlow = ai.defineFlow(
  {
    name: 'studentInsightsFlow',
    inputSchema: StudentInsightsInputSchema,
    outputSchema: StudentInsightsOutputSchema,
  },
  async (input: StudentInsightsInput) => {
    const { output } = await prompt(input);
    return output!;
  }
);
