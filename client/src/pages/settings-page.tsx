import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { NavigationBar } from '@/components/navigation-bar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formState, setFormState] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bloodType: user?.bloodType || '',
    allergies: user?.allergies || '',
    medicalConditions: user?.medicalConditions || '',
  });
  
  const [offlineMode, setOfflineMode] = useState(
    localStorage.getItem('offlineMode') === 'true'
  );
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const res = await apiRequest('PUT', '/api/user/profile', userData);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/user'], updatedUser);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update profile',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formState);
  };
  
  const handleOfflineModeChange = (checked: boolean) => {
    setOfflineMode(checked);
    localStorage.setItem('offlineMode', String(checked));
    toast({
      title: `Offline mode ${checked ? 'enabled' : 'disabled'}`,
      description: checked 
        ? 'Key data will be stored for offline use'
        : 'Offline data storage disabled',
    });
  };
  
  if (!user) {
    // This shouldn't happen due to ProtectedRoute, but providing a fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center">
        <UserIcon className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      
      <main className="container max-w-2xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and app settings</p>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal and medical information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formState.phone}
                      onChange={handleInputChange}
                      placeholder="Your phone number"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Input
                      id="bloodType"
                      name="bloodType"
                      value={formState.bloodType}
                      onChange={handleInputChange}
                      placeholder="e.g., A+, B-, O+"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      name="allergies"
                      value={formState.allergies}
                      onChange={handleInputChange}
                      placeholder="List any allergies you have"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                    <Textarea
                      id="medicalConditions"
                      name="medicalConditions"
                      value={formState.medicalConditions}
                      onChange={handleInputChange}
                      placeholder="List any medical conditions you have"
                      rows={3}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="offline-mode">Offline Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Store critical information for offline access
                    </p>
                  </div>
                  <Switch
                    id="offline-mode"
                    checked={offlineMode}
                    onCheckedChange={handleOfflineModeChange}
                  />
                </div>
                
                <Separator />
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>About MediTrack</AlertTitle>
                  <AlertDescription>
                    Version 1.0.0 - Medical Emergency Geo Tracker
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
