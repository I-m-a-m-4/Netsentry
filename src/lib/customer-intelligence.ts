
import type { Student, Admission, Subject, StudentInsightsOutput } from '@/types';

/**
 * Generates local customer intelligence without the need for an AI model.
 * Uses purchase history and statistical patterns to provide academy value.
 */
export function generateLocalCustomerIntelligence(
    customer: Student,
    admissions: Admission[],
    allProducts: Subject[]
): StudentInsightsOutput {
    const totalSpent = admissions.reduce((sum, r) => sum + r.total, 0);
    const orderCount = admissions.length;
    
    // Aggregation of purchased items
    const itemMap: Record<string, { quantity: number, name: string }> = {};
    admissions.forEach(r => {
        if (!r || !Array.isArray(r.items)) return;
        r.items.forEach(item => {
            if (!item || !item.subjectId) return;
            if (!itemMap[item.subjectId]) {
                itemMap[item.subjectId] = { quantity: 0, name: item.name || 'Unknown Subject' };
            }
            itemMap[item.subjectId].quantity += (item.quantity || 0);
        });
    });

    const sortedItems = Object.entries(itemMap)
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([id, data]) => ({ id, ...data }));

    const topItems = sortedItems.slice(0, 3).map(i => i.name);
    
    // 1. Generate Summary
    let segment = 'New Student';
    if (orderCount > 10) segment = 'VIP Patron';
    else if (orderCount > 3) segment = 'Loyal Student';
    else if (orderCount > 0) segment = 'Recent Student';

    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;
    
    // Calculate category preferences
    const categoryMap: Record<string, number> = {};
    admissions.forEach(r => {
        if (!r || !Array.isArray(r.items)) return;
        r.items.forEach(item => {
            if (!item || !item.subjectId) return;
            const p = allProducts.find(prod => prod.id === item.subjectId);
            if (p?.category) {
                categoryMap[p.category] = (categoryMap[p.category] || 0) + (item.quantity || 0);
            }
        });
    });
    const topCategory = Object.entries(categoryMap).sort((a,b) => b[1]-a[1])[0]?.[0];

    // 1. Generate Summary
    let summary = `**Student Segment: ${segment}**\n\n`;
    summary += `${customer.name} is a **${segment.toLowerCase()}** who has shopped with you **${orderCount} times**, contributing a lifetime value of **₦${totalSpent.toLocaleString()}**. `;
    
    if (topItems.length > 0) {
        summary += `Their most frequently purchased subjects are **${topItems.join(', ')}**. `;
    }
    
    if (topCategory) {
        summary += `They show a strong preference for items in the **${topCategory}** category. `;
    }

    if (avgOrderValue > 25000) {
        summary += `With an average order value of **₦${avgOrderValue.toLocaleString()}**, they are among your higher-spending clientele. `;
    }

    // 2. Subject Suggestions
    const productSuggestions: string[] = [];
    if (topItems.length > 0) {
        productSuggestions.push(`Bundled offer: Create a discount for ${topItems[0]} when paired with a new arrival.`);
    }
    if (topCategory) {
        const otherInCategory = allProducts
            .filter(p => p.category === topCategory && !topItems.includes(p.name))
            .slice(0, 2)
            .map(p => p.name);
        if (otherInCategory.length > 0) {
            productSuggestions.push(`Upsell ${otherInCategory.join(' or ')} based on their interest in ${topCategory}.`);
        }
    }
    
    // 3. Engagement Tactics
    const engagementTactics: string[] = [];
    if (segment === 'VIP Patron') {
        engagementTactics.push('Exclusive Reward: Send a "Thank You" note with a personalized 15% discount code.');
        engagementTactics.push('Priority Service: Flag this customer for express handling on all future orders.');
    } else if (segment === 'Loyal Student') {
        engagementTactics.push('Referral Incentive: Offer 500 bonus points for every friend they refer to the shop.');
        engagementTactics.push('Feedback Request: Ask for a testimonial or review to help grow your brand.');
    } else {
        engagementTactics.push('Retention Offer: Send a 10% discount on their favorite category to encourage a repeat visit.');
    }

    return {
        summary,
        productSuggestions: productSuggestions.length > 0 ? productSuggestions : ['Analyze more transactions to unlock tailored suggestions.'],
        engagementTactics: engagementTactics.length > 0 ? engagementTactics : ['Focus on building a relationship with this new customer.'],
        createdAt: new Date()
    };
}
