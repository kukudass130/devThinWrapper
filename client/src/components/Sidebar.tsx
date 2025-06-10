import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Home, Calendar, Mail, Users, LogOut } from "lucide-react";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: '대시보드',
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

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-gray-200">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div className="ml-3">
          <h1 className="text-xl font-bold text-gray-900">인플루언서</h1>
          <p className="text-sm text-gray-600">매니저</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.path}
              variant={item.isActive ? "default" : "ghost"}
              className={`w-full justify-start ${
                item.isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setLocation(item.path)}
            >
              <IconComponent className="w-5 h-5 mr-3" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : '사용자'}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-gray-600 hover:text-gray-900"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
