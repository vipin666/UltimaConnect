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
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex safe-area-pb">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center justify-center py-4 px-2 text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'text-primary bg-blue-50 border-t-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t-2 border-transparent'
            }`}
            data-testid={`tab-${id}`}
          >
            <Icon className={`w-5 h-5 mb-1 transition-transform ${
              activeTab === id ? 'scale-110' : 'scale-100'
            }`} />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
