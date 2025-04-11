
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Phone, Navigation, Clock, MapPin } from 'lucide-react';
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

type MedicalFacilityCardProps = {
  facility: Facility;
  userLocation: { latitude: number; longitude: number } | null;
};

export function MedicalFacilityCard({ facility, userLocation }: MedicalFacilityCardProps) {
  const distance = userLocation
    ? calculateDistance(userLocation, { latitude: facility.latitude, longitude: facility.longitude })
    : null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Hospital':
        return 'bg-red-100 text-red-800';
      case 'Clinic':
        return 'bg-blue-100 text-blue-800';
      case 'Pharmacy':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{facility.name}</h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className={getTypeColor(facility.type)}>
                {facility.type}
              </Badge>
              <Badge variant="outline" className={facility.is_24_hours ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {facility.is_24_hours ? '24/7 Open' : 'Limited Hours'}
              </Badge>
            </div>
          </div>
          {distance && (
            <Badge variant="outline" className="ml-2">
              {distance.toFixed(1)} km away
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <span className="text-sm">{facility.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${facility.phone}`} className="text-sm text-primary hover:underline">
              {facility.phone}
            </a>
          </div>

          <div className="flex gap-2 flex-wrap">
            {facility.services.map((service, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" variant="default">
              <Phone className="mr-2 h-4 w-4" />
              Call Now
            </Button>
            <Button className="flex-1" variant="outline">
              <Navigation className="mr-2 h-4 w-4" />
              Directions
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
