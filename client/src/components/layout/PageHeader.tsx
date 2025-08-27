import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  showHomeButton?: boolean;
  homeUrl?: string;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  showHomeButton = true, 
  homeUrl = "/",
  children 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {showHomeButton && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = homeUrl}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  );
}
