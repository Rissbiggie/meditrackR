
import { useQuery } from '@tanstack/react-query';
import { NavigationBar } from '@/components/navigation-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmergencyContacts } from '@/components/emergency-contacts';
import { EmergencyButton } from '@/components/emergency-button';
import { useAuth } from '@/hooks/use-auth';
import { Heart, Activity, AlertCircle, User, Pill, Clock, FileText } from 'lucide-react';

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
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="font-medium w-24">Blood Type:</div>
                  <div>{user.bloodType || 'Not specified'}</div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="font-medium w-24">Allergies:</div>
                  <div>{user.allergies || 'None reported'}</div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="font-medium w-24">Conditions:</div>
                  <div>{user.medicalConditions || 'None reported'}</div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="font-medium w-24">Weight:</div>
                  <div>{user.weight ? `${user.weight} lbs` : 'Not specified'}</div>
                </div>
              </div>
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
