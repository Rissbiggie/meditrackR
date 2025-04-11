import { NavigationBar } from '@/components/navigation-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Calendar, Heart, Droplets, Cookie, Scale } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <main className="container max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Appointment</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="font-semibold">Dr. Smith</div>
              <div className="text-sm text-muted-foreground">April 25 · 9:00 AM</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Heart rate</div>
                <div className="font-semibold">72 bpm</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Droplets className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Blood pressure</div>
                <div className="font-semibold">118/76 mmHg</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Cookie className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Blood sugar</div>
                <div className="font-semibold">95 mg/dL</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Scale className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Weight</div>
                <div className="font-semibold">162 lbs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}