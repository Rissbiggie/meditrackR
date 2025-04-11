
import { useState } from 'react';
import { MedicalFacilityCard } from './medical-facility-card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Hospital, Pill, FirstAid, Search, SortAsc } from 'lucide-react';
import { calculateDistance } from '@/lib/utils';

type Facility = {
  id: number;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  services: string[];
  is_24_hours: boolean;
};

type ServiceFinderProps = {
  facilities: Facility[];
  userLocation: { latitude: number; longitude: number } | null;
};

export function ServicesFinder({ facilities, userLocation }: ServiceFinderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'status'>('distance');

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !selectedType || facility.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const sortedFacilities = [...filteredFacilities].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        if (!userLocation) return 0;
        const distanceA = calculateDistance(userLocation, { latitude: a.latitude, longitude: a.longitude });
        const distanceB = calculateDistance(userLocation, { latitude: b.latitude, longitude: b.longitude });
        return distanceA - distanceB;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'status':
        return (b.is_24_hours ? 1 : 0) - (a.is_24_hours ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: 'distance' | 'name' | 'status') => setSortBy(value)}>
          <SelectTrigger className="w-[140px]">
            <SortAsc className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Open/Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          variant={selectedType === 'Hospital' ? 'default' : 'outline'}
          onClick={() => setSelectedType(selectedType === 'Hospital' ? null : 'Hospital')}
          className="flex-1 md:flex-none"
        >
          <Hospital className="mr-2 h-4 w-4" />
          Hospitals
        </Button>
        <Button
          variant={selectedType === 'Clinic' ? 'default' : 'outline'}
          onClick={() => setSelectedType(selectedType === 'Clinic' ? null : 'Clinic')}
          className="flex-1 md:flex-none"
        >
          <FirstAid className="mr-2 h-4 w-4" />
          Clinics
        </Button>
        <Button
          variant={selectedType === 'Pharmacy' ? 'default' : 'outline'}
          onClick={() => setSelectedType(selectedType === 'Pharmacy' ? null : 'Pharmacy')}
          className="flex-1 md:flex-none"
        >
          <Pill className="mr-2 h-4 w-4" />
          Pharmacies
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFacilities.map((facility) => (
          <MedicalFacilityCard
            key={facility.id}
            facility={facility}
            userLocation={userLocation}
          />
        ))}
      </div>

      {sortedFacilities.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No medical facilities found matching your criteria
        </div>
      )}
    </div>
  );
}
