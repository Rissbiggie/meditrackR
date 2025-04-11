import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavigationBar } from '@/components/navigation-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyContacts } from '@/components/emergency-contacts';
import { EmergencyButton } from '@/components/emergency-button';
import { useAuth } from '@/hooks/use-auth';
import { Heart, Activity, AlertCircle, User } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

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
            <h1 className="text-2xl font-bold">Medical Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}</p>
          </div>

          <EmergencyButton className="mt-4 md:mt-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="font-medium w-24">Blood Type:</div>
                  <div>{user.bloodType || 'Not specified'}</div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="font-medium w-24">Allergies:</div>
                  <div>{user.allergies || 'None reported'}</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="font-medium w-24">Conditions:</div>
                  <div>{user.medicalConditions || 'None reported'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Emergency Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>Location services are active</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your emergency contacts will be able to receive your location in case of emergency.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <EmergencyContacts userId={user.id} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}