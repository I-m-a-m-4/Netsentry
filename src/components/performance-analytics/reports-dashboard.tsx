
'use client';

import * as React from 'react';
import { useAcademy } from '@/context/academy-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Admission } from '@/types';
import PageTitle from '@/components/shared/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FileText, Package, PieChart, ShoppingCart, Users, Download, Loader2, Bot } from 'lucide-react';
import SessionsOverTimeChart from './sessions-over-time-chart';
import TopProductsChart from './top-subjects-chart';
import { DateRangePicker } from './date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import RecentSalesTable from './recent-admissions-table';
import TopCustomersList from './top-students-list';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import RefreshButton from '../shared/refresh-button';

function ReportStatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    )
}

function PlaceholderChart({ title, description }: { title: string, description: string }) {
    return (
         <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center bg-muted/50 rounded-b-lg">
                <div className="text-center text-muted-foreground p-4">
                    <div className="font-semibold flex items-center justify-center gap-2 mb-2"><Bot className="h-4 w-4 text-primary"/> Zen AI</div>
                    <p className="text-sm">Once your first sale is made, this report will automatically activate. Upgrade your plan for more detailed analytics.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ReportsDashboard() {
    const { currencySymbol, academy, subjects, students, isLoading: isPosLoading } = useAcademy();
    const firestore = useFirestore();
    const dashboardRef = React.useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const [date, setDate] = React.useState<DateRange | undefined>({
      from: subDays(new Date(), 29),
      to: new Date(),
    });

    const admissionsQuery = useMemoFirebase(() => {
        if (!academy?.id || !firestore) return null;
        let q = query(collection(firestore, "admissions"), where("academyId", "==", academy.id));
        if (date?.from) {
            q = query(q, where('createdAt', '>=', date.from));
        }
        if (date?.to) {
            // Adjust to include the whole end day
            const toDate = new Date(date.to);
            toDate.setHours(23, 59, 59, 999);
            q = query(q, where('createdAt', '<=', toDate));
        }
        return q;
    }, [academy?.id, firestore, date]);

    const { data: admissions, isLoading: isLoadingAdmissions } = useCollection<Admission>(admissionsQuery);
    
    const isLoading = isPosLoading || isLoadingAdmissions;

    const reportData = React.useMemo(() => {
        if (isLoading || !admissions || !subjects || !students) return null;

        const totalBookingValue = admissions.reduce((sum, r) => sum + r.total, 0);
        const totalSessions = admissions.length;
        const averageSessionValue = totalSessions > 0 ? totalBookingValue / totalSessions : 0;
        const inventoryValue = subjects.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
        const totalProductsSold = admissions.reduce((sum, r) => sum + r.items.length, 0);

        return {
            totalBookingValue,
            totalSessions,
            averageSessionValue,
            inventoryValue,
            totalCustomers: students.length,
            totalProductsSold,
        }

    }, [admissions, subjects, students, isLoading]);
    
    const handleDownloadImage = async () => {
        const element = dashboardRef.current;
        if (!element) return;
        toast({ title: 'Generating Report...', description: 'Please wait while we capture your dashboard.' });
        try {
            const canvas = await html2canvas(element, { 
              scale: 2,
              ignoreElements: (el) => el.classList.contains('no-capture')
            });
            const data = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = data;
            link.download = `pinnacle-report-${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ variant: 'success', title: 'Report Downloaded', description: 'Your dashboard image has been saved.' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Download Failed', description: 'Could not capture the dashboard image.' });
        }
      };

    return (
        <div ref={dashboardRef} className="flex flex-col gap-6 bg-background p-1">
            <PageTitle title="Reports" subtitle="Deep dive into your academy performance.">
                <div className="flex items-center gap-2 no-capture">
                    <RefreshButton />
                    <DateRangePicker date={date} onDateChange={setDate} />
                    <Button onClick={handleDownloadImage}><Download className="mr-2 h-4 w-4"/>Download</Button>
                </div>
            </PageTitle>
            
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
             <>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                    <ReportStatCard 
                        title="Total Revenue"
                        value={`${currencySymbol}${reportData?.totalBookingValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`}
                        icon={DollarSign}
                    />
                    <ReportStatCard 
                        title="Total Sales"
                        value={reportData?.totalSessions.toLocaleString() || '0'}
                        icon={ShoppingCart}
                    />
                     <ReportStatCard 
                        title="Avg. Order Value"
                        value={`${currencySymbol}${reportData?.averageSessionValue.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}`}
                        icon={FileText}
                    />
                    <ReportStatCard 
                        title="Products Sold"
                        value={reportData?.totalProductsSold.toLocaleString() || '0'}
                        icon={Package}
                    />
                    <ReportStatCard 
                        title="Total Customers"
                        value={reportData?.totalCustomers.toLocaleString() || '0'}
                        icon={Users}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <SessionsOverTimeChart admissions={admissions || []} currencySymbol={currencySymbol} />
                    </div>
                    <div className="lg:col-span-2">
                        <TopProductsChart admissions={admissions || []} />
                    </div>
                </div>

                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <RecentSalesTable admissions={admissions || []} currencySymbol={currencySymbol}/>
                    </div>
                    <div className="lg:col-span-2">
                        <TopCustomersList admissions={admissions || []} currencySymbol={currencySymbol} />
                    </div>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Profit & Loss Report</CardTitle>
                        <CardDescription>Analyze your profitability over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-12 text-muted-foreground">
                        <div className="font-semibold flex items-center justify-center gap-2 mb-2"><Bot className="h-4 w-4 text-primary"/> Zen AI</div>
                        <p className="text-sm">This feature requires a 'cost price' field for each product to calculate profit margins. We're working on adding this capability.</p>
                    </CardContent>
                </Card>
             </>
            )}
        </div>
    );
}

