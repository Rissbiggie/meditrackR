import { Phone, Navigation, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicalFacility } from '@shared/schema';

interface MedicalFacilityCardProps {
  facility: MedicalFacility;
  userLocation?: { latitude: number | null; longitude: number | null };
  onNavigateClick?: (facility: MedicalFacility) => void;
}

export function MedicalFacilityCard({ 
  facility, 
  userLocation,
  onNavigateClick
}: MedicalFacilityCardProps) {
  
  const handleCall = () => {
    if (facility.phone) {
      window.location.href = `tel:${facility.phone}`;
    }
  };
  
  const handleNavigate = () => {
    if (onNavigateClick) {
      onNavigateClick(facility);
      return;
    }
    
    if (userLocation?.latitude && userLocation?.longitude) {
      // Open in Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${facility.latitude},${facility.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      // Just navigate to the location without directions
      const url = `https://www.google.com/maps/search/?api=1&query=${facility.latitude},${facility.longitude}`;
      window.open(url, '_blank');
    }
  };
  
  // Get facility type icon
  const getFacilityTypeIcon = () => {
    switch (facility.type.toLowerCase()) {
      case 'hospital':
        return <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>;
      case 'clinic':
        return <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>;
      case 'pharmacy':
        return <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>;
      default:
        return <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>;
    }
  };
  
  return (
    <Card className="w-full mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {getFacilityTypeIcon()}
              <h3 className="font-semibold text-lg">{facility.name}</h3>
            </div>
            {facility.isOpen && (
              <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded-full">
                Open Now
              </span>
            )}
          </div>
          {distance !== undefined && (
            <div className="text-sm text-muted-foreground mb-2">
              {distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}km away`}
            </div>
          )}
          
          <div className="mb-2 text-sm text-gray-500 flex items-center">
            <span className="capitalize">{facility.type}</span>
          </div>
          
          {facility.address && (
            <div className="flex items-start mb-2 text-sm">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
              <span>{facility.address}</span>
            </div>
          )}
          
          {facility.openingHours && (
            <div className="flex items-start mb-2 text-sm">
              <Clock className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
              <span>{facility.openingHours}</span>
            </div>
          )}
          
          <div className="flex justify-between mt-3">
            {facility.phone && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleCall}
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </Button>
            )}
            
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 ml-auto"
              onClick={handleNavigate}
            >
              <Navigation className="h-4 w-4" />
              <span>Directions</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
