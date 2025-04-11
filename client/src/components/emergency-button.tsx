import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Phone, AlertTriangle, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmergencyContact } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/use-geolocation';
import { websocketService, LocationData } from '@/lib/websocket';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface EmergencyButtonProps {
  className?: string;
}

export function EmergencyButton({ className }: EmergencyButtonProps) {
  const [open, setOpen] = useState(false);
  const [isAlertSent, setIsAlertSent] = useState(false);
  const { toast } = useToast();
  const { latitude, longitude, accuracy } = useGeolocation({ 
    enableHighAccuracy: true,
    watchPosition: true 
  });
  const { user } = useAuth();
  
  // Get emergency contacts from API
  const { data: contacts, isLoading: isLoadingContacts } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });
  
  // Initialize WebSocket connection
  useEffect(() => {
    websocketService.connect().catch(error => {
      console.error("Failed to connect to WebSocket:", error);
    });
    
    // Clean up on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);
  
  // Create emergency request mutation
  const createEmergencyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/emergency-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Emergency alert sent",
        description: "Your emergency request has been submitted to response teams",
        variant: "default",
      });
      setIsAlertSent(true);
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send emergency alert",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleEmergencyClick = () => {
    setOpen(true);
    
    // Auto-send emergency alert via WebSocket if location is available
    if (latitude && longitude && user) {
      sendEmergencyAlert();
    }
  };
  
  const handleCall = (phoneNumber: string, contactName?: string) => {
    try {
      // Create call link with current location
      let callUri = `tel:${phoneNumber}`;
      
      // Log call attempt
      console.log(`Calling ${contactName || phoneNumber}`);
      
      // Use window.location to initiate call
      window.location.href = callUri;
      
      // Show toast
      toast({
        title: "Calling emergency contact",
        description: contactName ? `Calling ${contactName}` : `Calling ${phoneNumber}`,
        variant: "default",
      });
      
      // Close dialog after initiating call
      setOpen(false);
    } catch (error) {
      toast({
        title: "Call failed",
        description: "Unable to initiate call. Please try manually.",
        variant: "destructive",
      });
    }
  };
  
  const handleSendLocation = (phoneNumber: string) => {
    if (latitude === null || longitude === null) {
      toast({
        title: "Location unavailable",
        description: "Could not determine your location to share",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create SMS with location
      const smsUri = `sms:${phoneNumber}?body=Emergency! I need help. My location: https://maps.google.com/maps?q=${latitude},${longitude}`;
      
      // Use window.location to open SMS
      window.location.href = smsUri;
      
      // Show toast
      toast({
        title: "Sending location",
        description: "Opening SMS with your location",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to send location",
        description: "Unable to send location via SMS. Please try manually.",
        variant: "destructive",
      });
    }
  };
  
  // Send emergency alert using WebSocket and create emergency request in database
  const sendEmergencyAlert = async () => {
    // Check if we have valid location data and user
    if (!user) {
      toast({
        title: "Cannot send alert",
        description: "User information is unavailable. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    
    if (latitude === null || longitude === null) {
      toast({
        title: "Cannot send alert",
        description: "Location data is unavailable. Please enable location services.",
        variant: "destructive",
      });
      return;
    }

    if (isAlertSent) {
      toast({
        title: "Alert already sent",
        description: "An emergency alert has already been sent",
        variant: "default",
      });
      return;
    }
    
    try {
      // Create location data for WebSocket
      const locationData: LocationData = {
        userId: user.id,
        latitude: latitude,
        longitude: longitude,
        accuracy: accuracy !== null ? accuracy : undefined,
        timestamp: new Date().toISOString()
      };
      
      // Send location update via WebSocket
      await websocketService.sendLocationUpdate(locationData);
      
      // Send emergency alert via WebSocket
      await websocketService.sendEmergency({
        userId: user.id,
        location: locationData,
        description: "Emergency assistance needed",
        timestamp: new Date().toISOString()
      });
      
      // Create emergency request in database
      createEmergencyMutation.mutate({
        userId: user.id,
        location: { latitude, longitude },
        status: "pending",
        description: "Emergency assistance needed",
      });
      
      setIsAlertSent(true);
      
      toast({
        title: "Emergency alert sent",
        description: "Your emergency alert has been broadcasted",
        variant: "default",
      });
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      toast({
        title: "Error sending alert",
        description: "Failed to send emergency alert. Please try again or call emergency services directly.",
        variant: "destructive",
      });
    }
  };
  
  const emergencyServices = [
    { name: "Emergency Services", phone: "911" }
  ];
  
  return (
    <>
      <Button 
        variant="destructive" 
        size="lg" 
        className={`font-bold flex items-center gap-2 shadow-md w-full md:w-auto fixed bottom-4 left-4 right-4 md:static z-50 ${className}`}
        onClick={handleEmergencyClick}
      >
        <AlertTriangle className="h-5 w-5" />
        <span>EMERGENCY</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-red-500 flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Emergency Assistance
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Emergency Services</h3>
              {emergencyServices.map((service) => (
                <div key={service.phone} className="flex items-center justify-between border-b pb-2 mb-2">
                  <span>{service.name}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white" 
                      onClick={() => handleCall(service.phone, service.name)}
                    >
                      <Phone className="h-4 w-4 mr-1" /> Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {!isLoadingContacts && contacts && contacts.length > 0 ? (
              <div>
                <h3 className="font-semibold text-lg mb-3">Your Emergency Contacts</h3>
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between border-b pb-2 mb-2">
                    <div>
                      <div>{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.relationship}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSendLocation(contact.phone)}
                      >
                        Share Location
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleCall(contact.phone, contact.name)}
                      >
                        <Phone className="h-4 w-4 mr-1" /> Call
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-2">
                {isLoadingContacts ? (
                  "Loading your emergency contacts..."
                ) : (
                  "No emergency contacts found. Add contacts in settings."
                )}
              </div>
            )}
          </div>
          
          <div className="bg-slate-100 p-4 rounded-md mb-4">
            <h3 className="font-semibold text-lg mb-2">Send Emergency Alert</h3>
            <p className="text-sm text-slate-700 mb-3">
              Send an emergency alert to our response teams with your current location
            </p>
            <Button 
              className="w-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
              onClick={sendEmergencyAlert}
              disabled={isAlertSent || latitude === null || longitude === null || !user || createEmergencyMutation.isPending}
            >
              {createEmergencyMutation.isPending ? (
                <>
                  <ArrowUpFromLine className="mr-2 h-4 w-4 animate-pulse" />
                  Sending Alert...
                </>
              ) : isAlertSent ? (
                <>
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Alert Sent
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Send Alert to Response Teams
                </>
              )}
            </Button>
            {(latitude === null || longitude === null) && (
              <p className="text-xs text-red-500 mt-2">
                Unable to determine your location. GPS is required to send alerts.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
