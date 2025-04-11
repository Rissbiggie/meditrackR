import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavigationBar } from '@/components/navigation-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map } from '@/components/ui/map';
import { MedicalFacilityCard } from '@/components/medical-facility-card';
import { EmergencyContacts } from '@/components/emergency-contacts';
import { EmergencyButton } from '@/components/emergency-button';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAuth } from '@/hooks/use-auth';
import { MedicalFacility } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('facilities');
  const { latitude, longitude, isLoading: locationLoading, error: locationError, refreshLocation } = useGeolocation({
    enableHighAccuracy: true,
    watchPosition: true
  });
  
  // Fetch nearby medical facilities
  const { data: facilities, isLoading: facilitiesLoading, refetch: refetchFacilities } = useQuery<MedicalFacility[]>({
    queryKey: ['/api/medical-facilities/nearby', latitude, longitude],
    queryFn: async () => {
      if (!latitude || !longitude) return [];
      const res = await fetch(`/api/medical-facilities/nearby?latitude=${latitude}&longitude=${longitude}&radius=5`);
      if (!res.ok) throw new Error('Failed to fetch nearby facilities');
      return res.json();
    },
    enabled: !!latitude && !!longitude,
  });
  
  const handleRefresh = () => {
    refreshLocation();
    refetchFacilities();
  };
  
  // Check if user exists, should never happen due to ProtectedRoute
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCcw className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="container max-w-4xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Medical Dashboard</h1>
            <p className="text-muted-foreground">Find help nearby and manage your emergency contacts</p>
          </div>
          
          <EmergencyButton className="mt-4 md:mt-0" />
        </div>
        
        {locationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>
              {locationError}. Please enable location services to use all features.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Your Location</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={locationLoading}
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <Map 
                  userPosition={{ latitude, longitude }}
                  facilities={facilities}
                  height="300px"
                  isLoading={locationLoading}
                />
              </CardContent>
            </Card>
            
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="facilities">Medical Facilities</TabsTrigger>
                <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="facilities" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium">Nearby Facilities</h2>
                  
                  <div className="flex items-center gap-x-2 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                      <span>Hospital</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                      <span>Clinic</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                      <span>Pharmacy</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {facilitiesLoading ? (
                  <div className="text-center py-8">
                    Loading nearby medical facilities...
                  </div>
                ) : facilities && facilities.length > 0 ? (
                  <div>
                    {facilities.map((facility) => (
                      <MedicalFacilityCard 
                        key={facility.id} 
                        facility={facility} 
                        userLocation={{ latitude, longitude }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No medical facilities found nearby.
                    {!latitude && !longitude && " Please enable location services."}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="contacts">
                {user && <EmergencyContacts userId={user.id} />}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="hidden md:block">
            {user && <EmergencyContacts userId={user.id} />}
          </div>
        </div>
      </main>
    </div>
  );
}
