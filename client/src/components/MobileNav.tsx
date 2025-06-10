import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Mail, Users } from "lucide-react";

export default function MobileNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: '홈',
      isActive: location === '/' 
    },
    { 
      path: '/calendar', 
      icon: Calendar, 
      label: '캘린더',
      isActive: location === '/calendar' 
    },
    { 
      path: '/mailbox', 
      icon: Mail, 
      label: '메일함',
      isActive: location === '/mailbox' 
    },
    { 
      path: '/community', 
      icon: Users, 
      label: '커뮤니티',
      isActive: location === '/community' 
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center h-16 ${
                item.isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
