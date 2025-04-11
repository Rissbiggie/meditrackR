import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

// Define type for map position
interface MapPosition {
  latitude: number | null;
  longitude: number | null;
}

// Define type for medical facility
interface Facility {
  id: number;
  name: string;
  type: string;
  latitude: string;
  longitude: string;
}

interface MapProps {
  userPosition: MapPosition;
  facilities?: Facility[];
  onFacilityClick?: (facility: Facility) => void;
  height?: string;
  isLoading?: boolean;
}

export function Map({ 
  userPosition, 
  facilities = [], 
  onFacilityClick,
  height = "50vh",
  isLoading = false
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Create map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    // Create map
    mapRef.current = L.map(mapContainerRef.current).setView([0, 0], 13);
    
    // Add tile layer (map style)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);
    
    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  
  // Update map when user position changes
  useEffect(() => {
    if (!mapRef.current || !userPosition.latitude || !userPosition.longitude) return;
    
    const map = mapRef.current;
    const { latitude, longitude } = userPosition;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Create user marker with prominent styling
    const userIcon = L.divIcon({
      html: `<div class="w-8 h-8 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center shadow-lg animate-pulse">
               <div class="w-3 h-3 rounded-full bg-white"></div>
             </div>
             <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full shadow whitespace-nowrap">
               Your Location
             </div>`,
      className: "custom-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    const userMarker = L.marker([latitude, longitude], { icon: userIcon })
      .addTo(map)
      .bindPopup('Your Location');
    
    // Create circle showing accuracy
    if (userPosition.accuracy) {
      L.circle([latitude, longitude], {
        radius: userPosition.accuracy,
        color: 'blue',
        fillColor: 'rgba(0, 0, 255, 0.1)',
        fillOpacity: 0.2
      }).addTo(map);
    }
    
    // Add facility markers
    facilities.forEach(facility => {
      const lat = parseFloat(facility.latitude);
      const lng = parseFloat(facility.longitude);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // Different icons based on facility type
      let iconHtml = '';
      let iconColor = '';
      
      switch (facility.type.toLowerCase()) {
        case 'hospital':
          iconHtml = '<div class="text-white text-xs">H</div>';
          iconColor = 'bg-red-500';
          break;
        case 'clinic':
          iconHtml = '<div class="text-white text-xs">C</div>';
          iconColor = 'bg-green-500';
          break;
        case 'pharmacy':
          iconHtml = '<div class="text-white text-xs">P</div>';
          iconColor = 'bg-blue-500';
          break;
        default:
          iconHtml = '<div class="text-white text-xs">M</div>';
          iconColor = 'bg-purple-500';
      }
      
      const facilityIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full ${iconColor} border-2 border-white flex items-center justify-center">
                 ${iconHtml}
               </div>`,
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = L.marker([lat, lng], { icon: facilityIcon })
        .addTo(map)
        .bindPopup(`<b>${facility.name}</b><br>${facility.type}`);
      
      if (onFacilityClick) {
        marker.on('click', () => {
          onFacilityClick(facility);
        });
      }
    });
    
    // Center the map view to include user and nearby facilities
    if (facilities.length > 0) {
      const points = [
        [latitude, longitude],
        ...facilities.map(f => [parseFloat(f.latitude), parseFloat(f.longitude)] as [number, number])
      ];
      
      // Filter out any invalid points (with NaN values)
      const validPoints = points.filter(
        p => !isNaN(p[0]) && !isNaN(p[1])
      ) as [number, number][];
      
      if (validPoints.length > 1) {
        map.fitBounds(L.latLngBounds(validPoints));
      } else {
        map.setView([latitude, longitude], 13);
      }
    } else {
      map.setView([latitude, longitude], 13);
    }
  }, [userPosition, facilities, onFacilityClick]);
  
  if (isLoading || !userPosition.latitude || !userPosition.longitude) {
    return (
      <div 
        style={{ height }}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-md bg-gray-50"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading location..." : "Waiting for location access..."}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Refresh Page
        </Button>
      </div>
    );
  }
  
  return (
    <div 
      ref={mapContainerRef} 
      style={{ height }}
      className="w-full rounded-md overflow-hidden"
    />
  );
}

export default Map;
