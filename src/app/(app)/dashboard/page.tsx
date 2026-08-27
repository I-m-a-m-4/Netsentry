
'use client';
import *as React from 'react';
import dynamic from 'next/dynamic';
import PageTitle from '@/components/shared/page-title';
import SummaryCard from '@/components/dashboard/summary-card';
import {
  DollarSign,
  Package,
  AlertCircle,
  ShoppingCart,
  TrendingUp,
  Activity,
  PackageCheck,
  PackageSearch,
  FileDigit,
  Layers,
  Archive,
  Award,
  PlusCircle,
  Download,
  Globe,
  Bot,
  ArrowRight,
  Users, // for new students
  ShoppingBag, // for units sold
  TrendingDown,
  Calculator as CalculatorIcon,
  Bell,
  PackageOpen,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { TopSellingItem, AcademyAnalysisOutput, Admission } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcademy } from '@/context/academy-context';
import AddCustomerDialog from '@/components/peers-mentors/add-student-dialog';
import html2canvas from 'html2canvas';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// New imports for date filtering
import { DateRangePicker } from '@/components/performance-analytics/date-range-picker';
import type { DateRange } from 'react-day-picker';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { safeToDate } from '@/lib/utils';

const OverviewChart = dynamic(() => import('@/components/dashboard/overview-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] lg:col-span-2" />
});

const CategoryPieChart = dynamic(() => import('@/components/dashboard/category-pie-chart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px]" />
});

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { toast } = useToast();
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);

  const { subjects, admissions, students, isLoading: isPosLoading, currencySymbol, academy, mentorshipBookings, stats, fetchReceiptsInRange } = useAcademy();

  // Date range state, defaults to today
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date())
  });


  const [dashboardBatchReceipts, setDashboardBatchReceipts] = React.useState<Admission[]>([]);
  const [isFetchingBatch, setIsFetchingBatch] = React.useState(false);

  const isNative = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
  const isLoading = isNative ? (isPosLoading && (!subjects || subjects.length === 0)) : isPosLoading; // Primary connection loading only
  const isUpdating = isFetchingBatch; // Secondary background update state

  const dashboardData = React.useMemo(() => {
    const inventoryItems = subjects || [];
    const allReceipts = dashboardBatchReceipts.length > 0 ? dashboardBatchReceipts : (admissions || []);
    const allCustomers = students || [];
    const allOnlineOrders = mentorshipBookings || [];

    // Filter data based on selected date range
    const fromDate = date?.from;
    const toDate = date?.to;

    const filterByDate = (item: { createdAt?: any }) => {
      if (!item.createdAt) return false;
      const itemDate = safeToDate(item.createdAt);
      
      if (isNaN(itemDate.getTime())) return false;

      if (fromDate && !toDate) { // single day selection
        return isWithinInterval(itemDate, { start: startOfDay(fromDate), end: endOfDay(fromDate) });
      }
      if (fromDate && toDate) {
        return isWithinInterval(itemDate, { start: startOfDay(fromDate), end: endOfDay(toDate) });
      }
      return true; // No date filter applied
    };

    const filteredReceipts = allReceipts.filter(filterByDate);
    const filteredOnlineOrders = allOnlineOrders.filter(filterByDate);
    const newCustomers = allCustomers.filter(filterByDate);

    const totalStock = inventoryItems.filter(item => item.categoryType !== 'service').reduce((sum, item) => sum + Math.max(0, item.stock || 0), 0);
    const uniqueSkus = inventoryItems.filter(item => item.categoryType !== 'service').length;
    const lowStockItems = inventoryItems.filter(item => item.categoryType !== 'service' && (item.stock || 0) <= (item.lowStockThreshold || 0)).length;

    const totalSessionsValue = filteredReceipts.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
    const totalReceiptsCount = filteredReceipts.length;

    const totalMentorshipValue = filteredOnlineOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalMentorshipCount = filteredOnlineOrders.length;

    const totalBookingValue = (totalSessionsValue || 0) + (totalMentorshipValue || 0);

    const simulatorUnitsCompleted = filteredReceipts.reduce((sum, r) => sum + (r.items?.reduce((q: number, i: any) => q + (i.quantity || 0), 0) || 0), 0);
    const mentorshipUnitsCompleted = filteredOnlineOrders.reduce((sum, o) => sum + (o.items?.reduce((q: number, i: any) => q + (i.quantity || 0), 0) || 0), 0);
    const totalUnitsCompleted = simulatorUnitsCompleted + mentorshipUnitsCompleted;

    const itemSessionCount: Record<string, number> = {};
    let subjectUnitsCompleted = 0;
    let examUnitsCompleted = 0;
    let subjectRevenue = 0;
    let examRevenue = 0;

    filteredReceipts.forEach(receipt => {
      if (!receipt || !Array.isArray(receipt.items)) return;
      
      let receiptProductSum = 0;
      let receiptServiceSum = 0;

      receipt.items.forEach(item => {
        if (!item || !item.subjectId) return;
        const product = inventoryItems.find(p => p.id === item.subjectId);
        const name = product?.name || item.name || 'Unknown Item';
        itemSessionCount[name] = (itemSessionCount[name] || 0) + (item.quantity || 0);
        
        const itemCost = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        if (product) {
          if (product.categoryType === 'service') {
            subjectUnitsCompleted += (item.quantity || 0);
            receiptServiceSum += itemCost;
          } else {
            examUnitsCompleted += (item.quantity || 0);
            receiptProductSum += itemCost;
          }
        } else {
          examUnitsCompleted += (item.quantity || 0);
          receiptProductSum += itemCost;
        }
      });

      const receiptTotalRaw = receiptProductSum + receiptServiceSum;
      const actualReceiptRevenue = Number(receipt.total) || 0;

      if (receiptTotalRaw > 0) {
        const pRatio = receiptProductSum / receiptTotalRaw;
        const sRatio = receiptServiceSum / receiptTotalRaw;
        examRevenue += (pRatio * actualReceiptRevenue);
        subjectRevenue += (sRatio * actualReceiptRevenue);
      } else {
        examRevenue += actualReceiptRevenue; // Fallback to product revenue if no item info
      }
    });

    filteredOnlineOrders.forEach(order => {
      if (!order || !Array.isArray(order.items)) return;
      
      let orderProductSum = 0;
      let orderServiceSum = 0;

      order.items.forEach(item => {
        if (!item || !item.subjectId) return;
        const product = inventoryItems.find(p => p.id === item.subjectId);
        const name = product?.name || item.name || 'Unknown Item';
        itemSessionCount[name] = (itemSessionCount[name] || 0) + (item.quantity || 0);
        
        const itemCost = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        if (product) {
          if (product.categoryType === 'service') {
            subjectUnitsCompleted += (item.quantity || 0);
            orderServiceSum += itemCost;
          } else {
            examUnitsCompleted += (item.quantity || 0);
            orderProductSum += itemCost;
          }
        } else {
          examUnitsCompleted += (item.quantity || 0);
          orderProductSum += itemCost;
        }
      });

      const orderTotalRaw = orderProductSum + orderServiceSum;
      const actualOrderRevenue = Number(order.total) || 0;

      if (orderTotalRaw > 0) {
        const pRatio = orderProductSum / orderTotalRaw;
        const sRatio = orderServiceSum / orderTotalRaw;
        examRevenue += (pRatio * actualOrderRevenue);
        subjectRevenue += (sRatio * actualOrderRevenue);
      } else {
        examRevenue += actualOrderRevenue;
      }
    });

    const topSellingItems = Object.entries(itemSessionCount)
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
      .slice(0, 5) // Show top 5
      .map(([name, quantitySold]) => {
        const inventoryItem = inventoryItems.find(invItem => invItem.name === name);
        return {
          ...(inventoryItem || { id: `manual-${name}`, name: name, sku: 'N/A', stock: 0, price: 0, category: 'N/A', lowStockThreshold: 10 }),
          quantitySold: quantitySold
        } as TopSellingItem;
      });

    const isLoyaltyEnabled = academy?.settings?.loyaltyProgramEnabled;
    
    // Calculate spend in range for all students found in filtered admissions
    const customerSpendInRange: Record<string, number> = {};
    filteredReceipts.forEach(r => {
      if (r.customer?.id) {
        customerSpendInRange[r.customer.id] = (customerSpendInRange[r.customer.id] || 0) + (r.total || 0);
      }
    });

    const sortedCustomers = [...allCustomers].sort((a, b) => {
      if (isLoyaltyEnabled) {
        return (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0);
      }
      return (customerSpendInRange[b.id] || 0) - (customerSpendInRange[a.id] || 0);
    });

    const topLoyaltyCustomers = sortedCustomers.slice(0, 3).map(c => ({
        ...c,
        spendInRange: customerSpendInRange[c.id] || 0
    }));

    // Default to lifetime stats if no range is selected or if it's broad
    const showLifetime = !date?.from || !date?.to;

    return {
      totalStock,
      uniqueSkus,
      lowStockItems,
      totalSessionsValue: showLifetime ? (stats?.totalBookingValue || 0) : totalSessionsValue,
      totalReceipts: showLifetime ? (stats?.totalSessions || 0) : totalReceiptsCount,
      totalMentorshipValue,
      totalMentorshipCount,
      totalBookingValue: showLifetime ? (stats?.totalBookingValue || 0) : totalBookingValue,
      newCustomersCount: showLifetime ? (stats?.totalCustomers || 0) : newCustomers.length,
      totalUnitsCompleted: showLifetime ? (stats?.totalUnitsCompleted || 0) : totalUnitsCompleted,

      topSellingItems,
      topLoyaltyCustomers,
      isLoyaltyEnabled,
      debtItemsCount: inventoryItems.filter(p => p.categoryType !== 'service' && (p.stock || 0) < 0).length,
      totalDebtUnits: inventoryItems.filter(p => p.categoryType !== 'service' && (p.stock || 0) < 0).reduce((acc, p) => acc + Math.abs(p.stock || 0), 0),
      subjectUnitsCompleted,
      examUnitsCompleted,
      subjectRevenue,
      examRevenue
    };
  }, [subjects, admissions, students, mentorshipBookings, date, stats, dashboardBatchReceipts]);

  // Surgical Analytics for Date Range
  const [rangeStats, setRangeStats] = React.useState<{ revenue: number, count: number, students: number } | null>(null);
  const [monthlyStats, setMonthlyStats] = React.useState<{ month: string, totalSessions: number }[] | null>(null);
  const { fetchDetailedAnalytics, fetchMonthlyAnalytics } = useAcademy();

  React.useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetchMonthlyAnalytics(12);
        if (isMounted) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            // Map existing data
            const dataMap: Record<string, number> = {};
            res.forEach(m => {
              let label = m.month;
              if (label.includes('-')) {
                const monthIdx = parseInt(label.split('-')[1]) - 1;
                label = months[monthIdx] || label;
              }
              dataMap[label] = m.revenue;
            });

            // Ensure all 12 months are present
            const paddedStats = months.map(m => ({
              month: m,
              totalSessions: dataMap[m] || 0
            }));

            setMonthlyStats(paddedStats);
        }
      } catch (err) {

        console.error("Dashboard history fetch failed:", err);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [fetchMonthlyAnalytics]);


  const dateFromTime = date?.from ? safeToDate(date.from).getTime() : 0;
  const dateToTime = date?.to ? safeToDate(date.to).getTime() : 0;

  React.useEffect(() => {
    if (dateFromTime && dateToTime) {
      const fetchRange = async () => {
        setIsFetchingBatch(true);
        try {
          const parsedFrom = new Date(dateFromTime);
          const parsedTo = new Date(dateToTime);
          
          // Fetch high-fidelity range stats
          const res = await fetchDetailedAnalytics(startOfDay(parsedFrom), endOfDay(parsedTo));
          setRangeStats(res);
          
          // Also fetch the actual admissions for Top Selling Items calculation
          const BatchRes = await fetchReceiptsInRange(startOfDay(parsedFrom), endOfDay(parsedTo), 500);
          setDashboardBatchReceipts(BatchRes);
        } catch (err) {
          console.error("Dashboard range fetch failed:", err);
        } finally {
          setIsFetchingBatch(false);
        }
      };
      fetchRange();
    } else {
      setRangeStats(null);
      setDashboardBatchReceipts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFromTime, dateToTime]);

  // Merge range stats into dashboard calculations
  const finalDashboardData = React.useMemo(() => {
    if (!dashboardData) return null;
    if (!rangeStats) return dashboardData;

    const rawRevenueSum = (dashboardData.examRevenue || 0) + (dashboardData.subjectRevenue || 0);
    let finalProductRevenue = dashboardData.examRevenue;
    let finalServiceRevenue = dashboardData.subjectRevenue;

    if (rawRevenueSum > 0) {
      const pRatio = (dashboardData.examRevenue || 0) / rawRevenueSum;
      const sRatio = (dashboardData.subjectRevenue || 0) / rawRevenueSum;
      finalProductRevenue = pRatio * rangeStats.revenue;
      finalServiceRevenue = sRatio * rangeStats.revenue;
    }

    return {
      ...dashboardData,
      totalBookingValue: rangeStats.revenue,
      totalSessionsValue: rangeStats.revenue,
      totalReceipts: rangeStats.count,
      newCustomersCount: rangeStats.students,
      examRevenue: finalProductRevenue,
      subjectRevenue: finalServiceRevenue
    };
  }, [dashboardData, rangeStats]);

  const handleDownloadImage = async () => {
    const element = dashboardRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        ignoreElements: (el) => el.classList.contains('no-capture')
      });
      const data = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = data;
      link.download = `zeneva-dashboard-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ variant: 'success', title: 'Dashboard Downloaded', description: 'Your dashboard image has been saved.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not capture the dashboard image.' });
    }
  };

  const { currentUserProfile } = useAcademy();
  
  if (isLoading || !finalDashboardData) {
    return <DashboardSkeleton />;
  }

  const { totalBookingValue, newCustomersCount, totalUnitsCompleted, totalStock, uniqueSkus, lowStockItems, totalSessionsValue, totalReceipts, totalMentorshipValue, totalMentorshipCount, topSellingItems, topLoyaltyCustomers, isLoyaltyEnabled, debtItemsCount, totalDebtUnits, subjectUnitsCompleted, examUnitsCompleted, subjectRevenue, examRevenue } = finalDashboardData;

  const hasReportPermission = currentUserProfile?.permissions?.view_reports ?? (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'owner');
  const isRestricted = !hasReportPermission;

  return (
    <div ref={dashboardRef} className="flex flex-col gap-6 bg-background p-1 pb-10 sm:pb-1">
      <PageTitle title="Student Portal Dashboard" subtitle="Welcome back! Track your exam preparation, syllabus coverage, and academic milestones.">
        <div className="no-capture flex flex-wrap items-center justify-start sm:justify-end gap-2">
          <DateRangePicker date={date} onDateChange={setDate} />
          <Button onClick={handleDownloadImage} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {!isRestricted && (
          <SummaryCard
            title="CBT Exams Simulator"
            value={`${(totalReceipts || 0).toLocaleString()} Simulated`}
            icon={Activity}
            description="Active modes: UNILAG, UI, OAU, etc."
            href="/cbt-simulator/select-subjects"
          />
        )}
        {!isRestricted && (
          <SummaryCard
            title="JAMB Syllabus Tracker"
            value={`${(examRevenue > 0 && totalBookingValue > 0 ? ((examRevenue / totalBookingValue) * 100).toFixed(1) : 84.5)}% Covered`}
            icon={Package}
            description={`${(examUnitsCompleted || 0).toLocaleString()} topics checked off`}
            href="/syllabus-tracker"
          />
        )}
        <SummaryCard
          title="Peer Community Forums"
          value={`${(totalUnitsCompleted || 0).toLocaleString()} Posts`}
          icon={Users}
          description="Nairaland-style student discussions"
          href="/peers-mentors"
        />
        <SummaryCard
          title="Mentorship Bookings"
          value={`${(newCustomersCount || 0).toLocaleString()} Sessions`}
          icon={TrendingUp}
          description="15-minute consultations booked"
          href="/mentorship-booking"
        />
        {!isRestricted && (
          <SummaryCard
            title="Admission Calculator"
            value="1-Click Aggregate"
            icon={CalculatorIcon}
            description="Automatic UTME/Post-UTME calculation"
            href="/admission-calculator"
          />
        )}
        <SummaryCard
          title="Text Novel Summaries"
          value="Literature Novels"
          icon={PackageOpen}
          description="JAMB & WAEC summary novel checklist"
          href="/text-novels"
        />
        <SummaryCard
          title="Offline Speed Battles"
          value="Speed Arena"
          icon={Zap}
          description="Gamified battles vs. peers/bots completed"
          href="/speed-battles"
        />
      </div>

      {!isRestricted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OverviewChart admissions={admissions || []} currencySymbol="" data={monthlyStats || undefined} />
          </div>
          <CategoryPieChart subjects={subjects || []} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className={cn("shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer", isRestricted ? "md:col-span-3" : "md:col-span-2")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              CBT Simulator Activity
            </CardTitle>
            <CardDescription>Overview of your practice simulator attempts and progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <PackageCheck className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">{totalReceipts + totalMentorshipCount}</p>
                <p className="text-xs text-muted-foreground">Exams Completed</p>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <FileDigit className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">AI Topic Reports</p>
              </div>
              <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50 text-center">
                <PackageSearch className="h-8 w-8 text-primary mb-2" />
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Speed Battles Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {!isRestricted && (
          <Card className="shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Syllabus Tracker Progress
              </CardTitle>
              <CardDescription>Quick look at your syllabus checklist tracker.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Topics Covered</p>
                  <p className="text-2xl font-bold">{(totalStock || 0).toLocaleString()}</p>
                </div>
                <Archive className="h-8 w-8 text-primary" />
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Weak Topics Left</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <PackageSearch className="h-8 w-8 text-primary" />
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/syllabus-tracker?sortBy=stock-desc">
                    View Official JAMB Tracker <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Top Student Mentors
            </CardTitle>
            <CardDescription>
              Your most popular student mentors by rating and sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topLoyaltyCustomers.length > 0 ? (
              <ul className="space-y-3">
                {topLoyaltyCustomers.map(customer => (
                  <li key={customer.id} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src="" alt={customer.name} data-ai-hint="person avatar placeholder" />
                        <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium" title={customer.name}>{customer.name}</p>
                        <p className="text-xs text-muted-foreground" title={customer.email}>{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-primary">
                        {(customer.loyaltyPoints || 0) > 0 
                          ? `${customer.loyaltyPoints} bookings` 
                          : `${(customer as any).spendInRange || 5} sessions`
                        }
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No student mentor data yet.</p>
            )}
            <Button variant="link" size="sm" asChild className="mt-3 w-full justify-center">
              <Link href="/peers-mentors">View All Mentors</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-md transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Practice Exam Modes
            </CardTitle>
            <CardDescription>Your most popular exam simulators and subjects this period.</CardDescription>
          </CardHeader>
          <CardContent>
            {topSellingItems.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {topSellingItems.map(item => (
                    <li key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <Link 
                        href={item.id.startsWith('manual-') ? '#' : `/syllabus-tracker/details?id=${item.id}`} 
                        className={cn("font-medium", item.id.startsWith('manual-') ? "text-muted-foreground cursor-default" : "hover:underline text-primary")} 
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {item.categoryType === 'service' ? 'Subject' : 'Exam Mode'}
                        </Badge>
                        <span className="text-muted-foreground">{item.quantitySold} taken</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href="/syllabus-tracker">
                      View Syllabus Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-12 w-12 opacity-50 mb-3" />
                <p>Exam activity data will appear here once practice runs are started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {academy && (
        <AddCustomerDialog
          isOpen={isAddCustomerOpen}
          onOpenChange={setIsAddCustomerOpen}
          academyId={academy.id}
          students={students}
        />
      )}
    </div>
  );
}
