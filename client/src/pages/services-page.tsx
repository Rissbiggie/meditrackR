
import { useQuery } from '@tanstack/react-query';
import { NavigationBar } from '@/components/navigation-bar';
import { ServicesFinder } from '@/components/services-finder';
import { useGeolocation } from '@/hooks/use-geolocation';
import { Loader2 } from 'lucide-react';

export default function ServicesPage() {
  const { location } = useGeolocation();
  const { data: facilities, isLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await fetch('/api/facilities');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="container max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Find Medical Services</h1>
          <p className="text-muted-foreground">
            Locate nearby hospitals, clinics, and pharmacies
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ServicesFinder facilities={facilities || []} userLocation={location} />
        )}
      </main>
    </div>
  );
}
