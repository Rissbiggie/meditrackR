import { useAuth } from '@/hooks/use-auth';
import { NavigationBar } from '@/components/navigation-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyButton } from '@/components/emergency-button';
import { AlertTriangle, UserCircle, Phone, Pill, Heart, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';

export default function HomePage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  
  if (!user) {
    // This shouldn't happen due to ProtectedRoute, but providing a fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center">
        <UserCircle className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  const medicalInfo = [
    { 
      label: 'Blood Type', 
      value: user.bloodType || 'Not set', 
      icon: <Heart className="h-5 w-5 text-red-500" />,
      action: () => navigate('/settings')
    },
    { 
      label: 'Allergies', 
      value: user.allergies || 'None specified', 
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      action: () => navigate('/settings')
    },
    { 
      label: 'Medical Conditions', 
      value: user.medicalConditions || 'None specified', 
      icon: <Pill className="h-5 w-5 text-blue-500" />,
      action: () => navigate('/settings')
    }
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="container max-w-md mx-auto p-4">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 mb-3">
            <UserCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">Your medical emergency assistant</p>
        </div>
        
        <EmergencyButton className="w-full mb-6 h-14 text-lg" />
        
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => navigate('/services')}
            >
              <MapPin className="h-6 w-6 mb-2" />
              <span>Find Medical Services</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center"
              onClick={() => navigate('/dashboard')}
            >
              <Phone className="h-6 w-6 mb-2" />
              <span>Emergency Contacts</span>
            </Button>
          </div>
        </section>
        
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medical Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {medicalInfo.map((info, index) => (
                  <div key={index} className="flex items-start py-2 border-b last:border-0">
                    <div className="mr-3">{info.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">{info.label}</div>
                      <div className="font-medium">{info.value}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={info.action}
                      className="text-xs"
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
