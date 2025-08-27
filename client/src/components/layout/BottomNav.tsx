import { Button } from "@/components/ui/button";
import { Home, Calendar, Settings, Shield, Users, MessageSquare, UserCheck, Building } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
}

export function BottomNav({ activeTab, onTabChange, userRole }: BottomNavProps) {
  // Define navigation tabs based on user role
  const getTabs = () => {
    if (userRole === 'watchman') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'watchman', label: 'Dashboard', icon: Shield },
        { id: 'visitors', label: 'Visitors', icon: UserCheck },
        { id: 'community', label: 'Community', icon: Building },
        { id: 'services', label: 'Services', icon: Settings },
      ];
    }

    if (userRole === 'admin' || userRole === 'super_admin') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'bookings', label: 'Bookings', icon: Calendar },
        { id: 'admin', label: 'Admin', icon: Users },
        { id: 'community', label: 'Community', icon: Building },
        { id: 'services', label: 'Services', icon: Settings },
      ];
    }

    // Regular resident navigation
    return [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'bookings', label: 'Bookings', icon: Calendar },
      { id: 'community', label: 'Community', icon: Building },
      { id: 'visitors', label: 'Visitors', icon: UserCheck },
      { id: 'services', label: 'Services', icon: Settings },
    ];
  };

  const tabs = getTabs();

  return (
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex safe-area-pb">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            onClick={() => onTabChange(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-1 min-h-[60px] text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'text-primary bg-blue-50 border-t-2 border-primary'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-t-2 border-transparent'
            }`}
            data-testid={`tab-${id}`}
          >
            <Icon className={`w-5 h-5 mb-1 transition-transform ${
              activeTab === id ? 'scale-110' : 'scale-100'
            }`} />
            <span className={`text-xs font-medium leading-tight ${
              activeTab === id ? 'text-primary' : 'text-gray-600'
            }`}>
              {label}
            </span>
          </Button>
        ))}
      </div>
    </nav>
  );
}
