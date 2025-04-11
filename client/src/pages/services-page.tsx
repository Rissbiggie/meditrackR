
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavigationBar } from '@/components/navigation-bar';
import { Input } from '@/components/ui/input';
import { ServicesFinder } from '@/components/services-finder';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: facilities, isLoading } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await fetch('/api/facilities');
      return response.json();
    },
  });

  const categories = [
    { id: 'primary', name: 'Primary Care' },
    { id: 'cardio', name: 'Cardiology' },
    { id: 'derm', name: 'Dermatology' },
    { id: 'lab', name: 'Laboratory' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Find Services</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search services"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Categories</h2>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant="outline"
                className="justify-start h-auto py-3"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <ServicesFinder facilities={facilities || []} />
        )}
      </main>
    </div>
  );
}
