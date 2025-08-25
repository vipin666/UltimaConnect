import { Button } from "@/components/ui/button";
import { Home, Calendar, Settings } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'community', label: 'Community', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'services', label: 'Services', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-40">
      <div className="flex">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-4 text-sm font-medium border-t-2 transition-colors ${
              activeTab === id
                ? 'border-primary text-primary bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            data-testid={`tab-${id}`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
