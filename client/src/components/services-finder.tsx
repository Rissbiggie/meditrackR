
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MedicalFacilityCard } from '@/components/medical-facility-card';
import { Search, Filter, MapPin } from 'lucide-react';

interface ServiceFinderProps {
  facilities: any[];
  userLocation: { lat: number; lng: number } | null;
}

export function ServicesFinder({ facilities, userLocation }: ServiceFinderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  const calculateDistance = (facilityLat: number, facilityLng: number) => {
    if (!userLocation) return Infinity;
    // Basic distance calculation using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (facilityLat - userLocation.lat) * Math.PI / 180;
    const dLon = (facilityLng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(facilityLat * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredFacilities = facilities
    .filter(facility => {
      const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || facility.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return calculateDistance(a.lat, a.lng) - calculateDistance(b.lat, b.lng);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medical facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hospital">Hospitals</SelectItem>
            <SelectItem value="clinic">Clinics</SelectItem>
            <SelectItem value="pharmacy">Pharmacies</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <MapPin className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFacilities.map((facility) => (
          <MedicalFacilityCard
            key={facility.id}
            facility={facility}
            distance={calculateDistance(facility.lat, facility.lng)}
          />
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No facilities found matching your criteria
          </CardContent>
        </Card>
      )}
    </div>
  );
}
