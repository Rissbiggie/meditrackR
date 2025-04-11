
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { NavigationBar } from '@/components/navigation-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyContacts } from '@/components/emergency-contacts';
import { EmergencyButton } from '@/components/emergency-button';
import { useAuth } from '@/hooks/use-auth';
import { Heart, Activity, AlertCircle, User, Pill, Clock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    bloodType: user?.bloodType || '',
    allergies: user?.allergies || '',
    medicalConditions: user?.medicalConditions || '',
    weight: user?.weight || '',
    bloodPressure: user?.bloodPressure || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      const res = await apiRequest('PATCH', '/api/user/profile', userData);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/user'], updatedUser);
      toast({
        title: 'Profile updated',
        description: 'Your medical profile has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <User className="h-10 w-10 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />

      <main className="container max-w-4xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Health Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}</p>
          </div>
          <EmergencyButton className="mt-4 md:mt-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Medical Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate(formData);
              }}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="font-medium w-24">Blood Type:</div>
                    <Input
                      name="bloodType"
                      value={formData.bloodType || ''}
                      onChange={handleInputChange}
                      placeholder="Enter blood type"
                      className="max-w-[200px]"
                    />
                  </div>
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="font-medium w-24">Allergies:</div>
                    <Textarea
                      name="allergies"
                      value={formData.allergies || ''}
                      onChange={handleInputChange}
                      placeholder="List any allergies"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="font-medium w-24">Conditions:</div>
                    <Textarea
                      name="medicalConditions"
                      value={formData.medicalConditions || ''}
                      onChange={handleInputChange}
                      placeholder="List any medical conditions"
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="font-medium w-24">Weight:</div>
                    <Input
                      name="weight"
                      type="number"
                      value={formData.weight || ''}
                      onChange={handleInputChange}
                      placeholder="Weight in lbs"
                      className="max-w-[200px]"
                    />
                  </div>
                  <div className="flex items-start gap-3 pb-3 border-b">
                    <div className="font-medium w-24">Blood Pressure:</div>
                    <Input
                      name="bloodPressure"
                      value={formData.bloodPressure || ''}
                      onChange={handleInputChange}
                      placeholder="e.g. 120/80"
                      className="max-w-[200px]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-500" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.medications ? (
                  user.medications.map((med, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>{med}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No medications listed</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              Recent Health Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user.healthUpdates ? (
                user.healthUpdates.map((update, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="font-medium">{update.date}</div>
                    <div>{update.note}</div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No recent health updates</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <EmergencyContacts userId={user.id} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
