

export interface Subject {
    id: string;
    academyId: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    costPrice?: number;
    stock: number;
    imageUrl?: string;
    imageHint?: string;
    description?: string;
    lowStockThreshold?: number;
    createdAt?: any;
    updatedAt?: any;
    expiryDate?: any;
    type?: 'single' | 'variant' | 'composite';
    questions?: {
        id: string;
        questionText: string;
        options: string[];
        correctAnswer: 'A' | 'B' | 'C' | 'D';
        explanation?: string;
    }[];
    tutorName?: string;
    tutorEmail?: string;
    tutorBio?: string;
    modules?: {
        title: string;
        topics: {
            id: string;
            title: string;
        }[];
    }[];
}
export type InventoryItem = Subject;
export interface SyllabusItem {
    product: Subject;
    quantity: number;
}

export type TopSellingItem = Subject & {
    quantitySold: number;
};

export type UserRole = 'admin' | 'manager' | 'vendor_operator' | 'owner' | 'super-admin';

export interface StudentProfile {
    id: string;
    academyId: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    createdAt?: any;
    surveyCompleted?: boolean;
    status?: 'active' | 'inactive' | 'deleted';
    lastSeen?: any;
    targetUTMEScore?: number;
    targetInstitution?: string;
    targetCourse?: string;
    department?: string;
    utmeSubjects?: string[];
}


export interface Student {
    id: string;
    academyId: string;
    name: string;
    email: string;
    phone?: string;
    loyaltyPoints?: number;
    createdAt?: any;
    updatedAt?: any;
}

export interface Admission {
    id: string;
    academyId: string;
    receiptNumber?: string;
    items: {
        subjectId: string;
        name: string;
        quantity: number;
        price: number;
        costPrice?: number;
    }[];
    customer?: { id: string, name: string, email: string } | null;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    totalCost?: number;
    profit?: number;
    paymentMethod: 'Cash' | 'Card' | 'Bank Transfer';
    createdAt: any; // Can be a Date or a Firestore Timestamp
    createdBy?: string;
}

export interface MentorshipBooking {
    id: string;
    academyId: string;
    studentId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    items: {
        subjectId: string;
        name: string;
        quantity: number;
        price: number;
    }[];
    total: number;
    shippingDetails?: {
      name: string;
      price: number;
      type: 'delivery' | 'pickup';
      location?: string;
    };
    status: 'pending' | 'paid' | 'shipped' | 'cancelled';
    paymentMethod?: 'Paystack' | 'Bank Transfer';
    paymentReference?: string;
    createdAt: any;
}

export interface QueuedAction {
  id: string;
  type: 'complete-registration' | 'update-product' | 'add-customer' | 'update-customer' | 'delete-customer' | 'bulk-update-subjects' | 'add-product' | 'delete-product' | 'update-settings' | 'add-audit-log' | 'delete-receipt' | 'add-post-utme-mapping' | 'delete-post-utme-mapping';
  description: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface AISuggestion {
    title: string;
    description: string;
    severity: 'High' | 'Medium' | 'Low';
}

export interface AISuggestions {
    suggestions: AISuggestion[];
    createdAt: any; // Firestore Timestamp
}

// --- New AI Analysis Types ---

export interface SmartStockRecommendation {
    subjectId: string;
    name: string;
    recommendedStock: number;
    confidence: number;
    reason: string;
}

export interface DemandHeatmap {
    title: string;
    insight: string;
}

export interface RevenueOpportunity {
    subjectId: string;
    name: string;
    lostRevenue: number;
    reason: string;
    suggestion: string;
}

export interface SmartMerchandising {
    primaryProductName: string;
    pairedProductName: string;
    insight: string;
    recommendation: string;
}

export interface SlowMovingInventory {
    subjectId: string;
    name: string;
    daysUnsold: number;
    capitalLocked: number;
    suggestion: 'Bundle' | 'Discount' | 'Promote with fast-seller';
}

export interface BusinessHealth {
  score: number; // 0-100
  status: 'Healthy' | 'Needs Attention' | 'At Risk';
  summary: string; // A brief sentence about the score.
}

export interface CustomerSegment {
  segmentName: string; // e.g., "High-Value Snack Lovers"
  description: string;
  customerCount: number;
  customerEmails: string[];
  suggestedCampaign: {
    title: string;
    body: string;
  };
}

export interface AcademyAnalysisOutput {
  smartStockRecommendations?: SmartStockRecommendation[];
  demandHeatmap?: DemandHeatmap;
  revenueOpportunities?: RevenueOpportunity[];
  smartMerchandising?: SmartMerchandising[];
  slowMovingInventory?: SlowMovingInventory[];
  businessHealth?: BusinessHealth;
  customerSegments?: CustomerSegment[];
  createdAt?: any;
}


export interface Academy {
    id: string;
    name: string;
    address?: string;
    ownerId: string;
    createdAt: any; // Firestore Timestamp
    trialExpiresAt?: any; // Firestore Timestamp
    plan?: 'starter' | 'pro' | 'academy';
    accessLevel?: 'lifetime';
    status?: 'active' | 'deleted';
    deletedAt?: any;
    settings?: {
        phone?: string;
        email?: string;
        currency?: string;
        timezone?: string;
        defaultTaxRate?: number;
        primaryColor?: string;
        logoUrl?: string;
        aiTokensUsed?: number;
        paymentBankAccountId?: string;
        paymentBankName?: string;
        paymentBankCode?: string;
        paymentInstructions?: string;
        paystackSubaccount?: string;
        vendorPolicyEnabled?: boolean;
        vendorPolicyText?: string;
        loyaltyProgramEnabled?: boolean;
        pointsPerUnit?: number;
        loyaltyPointsForReward?: number;
        loyaltyRewardDiscountPercentage?: number;
        productCategories?: string[];
        aiTroubleshootSuggestions?: AISuggestions;
        academyAnalysis?: AcademyAnalysisOutput;
        publicStore?: {
            enabled?: boolean;
            headline?: string;
            slug?: string;
            bannerImageUrl?: string;
            desktopColumns?: 3 | 4 | 5;
            footerText?: string;
            description?: string;
            socialTwitter?: string;
            socialInstagram?: string;
            socialFacebook?: string;
            socialWhatsapp?: string;
            hideOutOfStock?: boolean;
            officeLocations?: string;
            contactPhone?: string;
            contactEmail?: string;
            businessHours?: string;
            googleMapsLink?: string;
            shippingOptions?: { name: string; price: number; type: 'delivery' | 'pickup'; location?: string; }[];
        },
        industry?: string;
        language?: string;
        inventoryStartDate?: any;
        fiscalYearStart?: string;
        state?: string;
        country?: string;
    };
}

export interface Invitation {
    id: string;
    academyId: string;
    email: string;
    name: string;
    role: 'manager' | 'vendor_operator';
    createdAt: any; // Firestore timestamp
}

export interface Purchase {
    id: string;
    userId: string;
    academyId: string;
    plan: 'Pro' | 'Business';
    amount: number;
    currency: 'NGN';
    timestamp: any; // Firestore Timestamp
    userProfile?: StudentProfile; // For admin dashboard display
}

export interface SubscriptionHistory {
    id: string;
    action: string;
    amount: number;
    currency: 'NGN';
    timestamp: any; // Firestore Timestamp
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    imageUrl?: string;
    authorId: string;
    authorName: string;
    published: boolean;
    createdAt: any;
    updatedAt: any;
    category?: string;
}

// Platform-wide notifications sent by admin
export interface AdminNotification {
    id: string;
    title: string;
    body: string;
    sentBy: string;
    createdAt: any;
    clickable?: boolean;
}

export interface UserNotification {
    id: string;
    title: string;
    body: string;
    read: boolean;
    createdAt: any;
    isGlobal?: boolean;
    queuedActionId?: string;
    clickable?: boolean;
}

export interface SupportThread {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    subject: string;
    status: 'open' | 'closed';
    lastMessageAt: any; // Timestamp
    lastMessageSnippet: string;
    isReadByAdmin: boolean;
    createdAt: any;
}

export interface SupportMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: any; // Timestamp
}


export interface PressArticle {
    title: string;
    publication: string;
    logoUrl?: string;
    url: string;
}

export interface ActivityLog {
    id: string;
    academyId: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string; // e.g., 'product.create', 'sale.void'
    entityType: string; // e.g., 'Subject', 'Admission'
    entityId: string;
    details: Record<string, any>; // e.g., { name: 'New Subject' } or { changes: [...] }
    createdAt: any; // Firestore Timestamp
}
