import { useState } from 'react';
import { useLocation } from 'wouter';
import { Home, Map, Settings, Stethoscope, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { MediTrackLogo } from './logo';

export function NavigationBar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);

  const routes = [
    { path: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <Stethoscope className="h-5 w-5" /> },
    { path: '/map', label: 'Find Services', icon: <Map className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const handleNavigate = (path: string) => {
    window.location.href = path;
    setOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  return (
    <>
      {/* Mobile Nav - Improved Responsiveness */}
      <div className="fixed bottom-0 left-0 right-0 border-t md:hidden z-50" style={{ backgroundColor: '#50C878' }}>
        <div className="flex justify-around items-center h-12"> {/* Reduced height for better mobile fit */}
          {routes.map((route) => (
            <Button
              key={route.path}
              variant="ghost"
              size="icon" {/* Smaller button size */}
              className={`flex flex-col items-center px-2 py-1 h-full rounded-none ${
                location === route.path
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-muted-foreground'
              }`}
              onClick={() => handleNavigate(route.path)}
            >
              {route.icon}
              <span className="text-xs mt-1">{route.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Desktop Header - Remains largely unchanged */}
      <header className="hidden md:flex justify-between items-center py-6 px-6 border-b" style={{ backgroundColor: '#50C878', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex items-center space-x-8">
          <div className="flex items-center">
            <MediTrackLogo width={70} height={50} />
            <h1 className="text-2xl font-bold text-primary ml-2">MediTrack</h1>
          </div>

          <nav className="flex gap-6">
            {routes.map((route) => (
              <Button
                key={route.path}
                variant="ghost"
                size="sm"
                className={`flex items-center ${
                  location === route.path ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
                onClick={() => handleNavigate(route.path)}
              >
                {route.icon}
                <span className="ml-2">{route.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="text-sm font-medium">Hello, {user.name}</div>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Header - Improved layout and responsiveness */}
      <header className="md:hidden flex justify-between items-center py-2 px-4 border-b fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#50C878', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <div className="flex items-center">
          <MediTrackLogo width={50} height={35} />
          <h1 className="text-xl font-bold text-primary ml-1">MediTrack</h1>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent className="p-4"> {/* Added padding for better spacing */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center py-2"> {/* Reduced padding */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <MediTrackLogo width={60} height={40} />
                    <h2 className="text-lg font-bold ml-2">MediTrack</h2>
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-1">"Track Emergencies, Save Lives"</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {user && (
                <div className="py-2 border-b"> {/* Reduced padding */}
                  <div className="font-medium">Hello, {user.name}</div>
                </div>
              )}

              <div className="flex-1 py-2"> {/* Reduced padding */}
                {routes.map((route) => (
                  <Button
                    key={route.path}
                    variant="ghost"
                    className={`w-full justify-start mb-2 ${
                      location === route.path ? 'text-primary font-medium' : 'text-muted-foreground'
                    }`}
                    onClick={() => handleNavigate(route.path)}
                  >
                    {route.icon}
                    <span className="ml-3">{route.label}</span>
                  </Button>
                ))}
              </div>

              <div className="py-2 border-t"> {/* Reduced padding */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Spacer for mobile - Reduced height */}
      <div className="h-8 md:hidden"></div>

      {/* Bottom spacer for mobile - Reduced height */}
      <div className="h-8 md:hidden"></div>
    </>
  );
}