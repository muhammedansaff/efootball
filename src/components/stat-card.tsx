import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    description?: string;
    className?: string;
}

export function StatCard({ icon, title, value, description, className }: StatCardProps) {
    return (
        <Card className={cn("hover:border-primary transition-colors", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="text-primary">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold font-headline tracking-wider">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );
}
