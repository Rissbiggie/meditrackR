import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
  hasTriedPermission: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
  showPermissionRequest?: boolean;
}

// Define as a named function first, then export it
function useGeolocationHook(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    isLoading: true,
    error: null,
    permissionState: null,
    hasTriedPermission: false,
  });
  
  const { toast } = useToast();
  const [watchId, setWatchId] = useState<number | null>(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 5000, // Reduced timeout for faster response
    maximumAge: 0,
    watchPosition: false,
    showPermissionRequest: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return null;
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setState(prev => ({ ...prev, permissionState: permission.state }));
      
      // Listen for permission changes
      permission.addEventListener('change', () => {
        setState(prev => ({ ...prev, permissionState: permission.state }));
        
        // If permission was just granted, get location
        if (permission.state === 'granted') {
          getLocation();
        }
      });
      
      return permission.state;
    } catch (error) {
      console.error('Permission API error:', error);
      return null;
    }
  }, []);
  
  // Get location with proper caching
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by your browser',
      }));
      
      toast({
        title: 'Geolocation Error',
        description: 'Please enable location services in your browser settings',
        variant: 'destructive',
      });
      
      return;
    }

    // Request location permission explicitly
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(permission => {
        if (permission.state === 'denied') {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Location access was denied',
          }));
          
          toast({
            title: 'Location Access Denied',
            description: 'Please allow location access in your browser settings',
            variant: 'destructive',
          });
        }
      });
    }

    // Request location with high accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Try to use cached position first for better performance
    const cachedPosition = localStorage.getItem('meditrack_position');
    if (cachedPosition) {
      try {
        const { latitude, longitude, accuracy, timestamp } = JSON.parse(cachedPosition);
        const age = Date.now() - timestamp;
        
        // Use cached position if it's fresh enough (less than maximumAge)
        if (age < mergedOptions.maximumAge || age < 60000) { // Use at least within a minute
          setState(prev => ({
            ...prev,
            latitude,
            longitude,
            accuracy,
            isLoading: false,
            error: null,
          }));
        }
      } catch (e) {
        // Invalid cache, continue with live position
        localStorage.removeItem('meditrack_position');
      }
    }

    const geoSuccess = (position: GeolocationPosition) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
      
      // Cache the position for future use
      localStorage.setItem('meditrack_position', JSON.stringify(locationData));
      
      setState(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        isLoading: false,
        error: null,
        // Keep the existing permissionState
        permissionState: prev.permissionState,
      }));
    };

    const geoError = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      
      switch (error.code) {
        case 1: // Permission denied
          toast({
            title: 'Location Access Required',
            description: 'Please allow location access in your browser settings and refresh the page.',
            variant: 'destructive',
          });
          break;
        case 2: // Position unavailable
          toast({
            title: 'Location Unavailable',
            description: 'Unable to determine your location. Please check your GPS or internet connection.',
            variant: 'destructive',
          });
          break;
        case 3: // Timeout
          toast({
            title: 'Location Timeout',
            description: 'Taking too long to get your location. Please try again.',
            variant: 'destructive',
          });
          // Retry with less accuracy
          navigator.geolocation.getCurrentPosition(
            geoSuccess,
            (retryError) => {
              toast({
                title: 'Location Error',
                description: 'Still unable to get your location. Please check your settings.',
                variant: 'destructive',
              });
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
          break;
        default:
          toast({
            title: 'Location Error',
            description: `Failed to get your location: ${error.message}`,
            variant: 'destructive',
          });
      }
    };

    if (mergedOptions.watchPosition) {
      // Clear any existing watch
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      const id = navigator.geolocation.watchPosition(
        geoSuccess,
        geoError,
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        }
      );
      
      setWatchId(id);
    } else {
      setState(prev => ({ ...prev, isLoading: true }));
      
      navigator.geolocation.getCurrentPosition(
        geoSuccess,
        geoError,
        {
          enableHighAccuracy: mergedOptions.enableHighAccuracy,
          timeout: mergedOptions.timeout,
          maximumAge: mergedOptions.maximumAge,
        }
      );
    }
  }, [
    mergedOptions.enableHighAccuracy,
    mergedOptions.timeout,
    mergedOptions.maximumAge,
    mergedOptions.watchPosition,
    toast,
    watchId,
  ]);

  useEffect(() => {
    // Request permission and get location on mount
    const initGeolocation = async () => {
      if (mergedOptions.showPermissionRequest) {
        const permissionState = await checkPermission();
        if (permissionState === 'granted' || permissionState === null) {
          getLocation();
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
          
          if (permissionState === 'prompt') {
            toast({
              title: 'Location Access',
              description: 'Please allow location access for better experience',
              variant: 'default',
            });
            getLocation(); // This will trigger the browser permission prompt
          } else if (permissionState === 'denied') {
            toast({
              title: 'Location Access Denied',
              description: 'Please enable location services in your browser settings',
              variant: 'destructive',
            });
          }
        }
      } else {
        getLocation();
      }
    };

    initGeolocation();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [
    checkPermission, 
    getLocation, 
    mergedOptions.showPermissionRequest
  ]);

  // Function to manually refresh location
  const refreshLocation = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        
        localStorage.setItem('meditrack_position', JSON.stringify(locationData));
        
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          isLoading: false,
          error: null,
          permissionState: state.permissionState,
        });
      },
      (error) => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        
        toast({
          title: 'Location Error',
          description: `Failed to refresh your location: ${error.message}`,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: 0, // Always get fresh location on refresh
      }
    );
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, state.permissionState, toast]);

  // Expose permissionStatus and ability to request permission
  const requestPermission = useCallback(() => {
    // This will trigger the browser permission prompt
    getLocation();
  }, [getLocation]);

  return { 
    ...state, 
    refreshLocation, 
    requestPermission 
  };
}

// Export the hook with a consistent name to avoid Fast Refresh issues
export const useGeolocation = useGeolocationHook;
