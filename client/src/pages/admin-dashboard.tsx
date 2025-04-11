import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { EmergencyRequest, MedicalFacility, User } from "@shared/schema";
import { NavigationBar } from "@/components/navigation-bar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, RefreshCw, AlertCircle, Trash2, Edit, User as UserIcon, MapPin, Phone, BellRing } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { websocketService, EmergencyData, LocationData } from "@/lib/websocket";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateStatus, setUpdateStatus] = useState<string>("pending");
  const [assignedResponder, setAssignedResponder] = useState<number | undefined>(undefined);
  const [selectedFacility, setSelectedFacility] = useState<number | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasNewEmergencies, setHasNewEmergencies] = useState(false);

  // Connect to WebSocket and listen for emergency alerts
  useEffect(() => {
    // Only connect if user is admin
    if (!user?.isAdmin) return;

    // Initialize WebSocket connection
    websocketService.connect().catch(error => {
      console.error("Failed to connect to WebSocket:", error);
    });

    // Listen for emergency alerts
    const handleEmergencyAlert = (data: any) => {
      console.log("Emergency alert received:", data);

      // Show notification toast
      toast({
        title: "Emergency Alert!",
        description: `User #${data.data.userId} needs urgent assistance.`,
        variant: "destructive",
      });

      // Set flag to indicate new emergencies
      setHasNewEmergencies(true);

      // Auto-refresh emergency requests list
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-requests"] });
    };

    // Listen for location updates
    const handleLocationUpdate = (data: any) => {
      console.log("Location update received:", data);
    };

    // Register event listeners
    websocketService.addEventListener("emergency_alert", handleEmergencyAlert);
    websocketService.addEventListener("location_updated", handleLocationUpdate);

    // Clean up on unmount
    return () => {
      websocketService.removeEventListener("emergency_alert", handleEmergencyAlert);
      websocketService.removeEventListener("location_updated", handleLocationUpdate);
      websocketService.disconnect();
    };
  }, [user, toast]);

  // Redirect if not admin
  if (user && !user.isAdmin) {
    return <Redirect to="/" />;
  }

  // Load all emergency requests
  const {
    data: emergencyRequests,
    isLoading: isLoadingRequests,
    error: requestsError
  } = useQuery({
    queryKey: ["/api/emergency-requests"],
    queryFn: async () => {
      const response = await fetch("/api/emergency-requests");
      if (!response.ok) {
        throw new Error("Failed to load emergency requests");
      }
      const data = await response.json();
      return data.data as EmergencyRequest[];
    }
  });

  // Load all facilities for assignment
  const {
    data: facilities,
    isLoading: isLoadingFacilities
  } = useQuery({
    queryKey: ["/api/medical-facilities"],
    queryFn: async () => {
      const response = await fetch("/api/medical-facilities");
      if (!response.ok) {
        throw new Error("Failed to load medical facilities");
      }
      const data = await response.json();
      return data.data as MedicalFacility[];
    }
  });

  // Load admin users for responder assignment
  const {
    data: adminUsers,
    isLoading: isLoadingAdmins
  } = useQuery({
    queryKey: ["/api/user/admins"],
    queryFn: async () => {
      const response = await fetch("/api/user/admins");
      if (!response.ok) {
        throw new Error("Failed to load admin users");
      }
      const data = await response.json();
      return data.data as User[];
    },
    retry: false
  });

  // Update emergency request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      if (!data.medicalFacilityId) {
        throw new Error("Please select a medical facility");
      }
      const res = await apiRequest("PATCH", `/api/emergency-requests/${id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Emergency request updated",
        description: "Request updated and notification sent to user.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-requests"] });
      setIsDialogOpen(false);

      // Clear form state
      setUpdateStatus("pending");
      setSelectedFacility(undefined);
      setUpdateNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update emergency request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete emergency request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/emergency-requests/${id}`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Emergency request deleted",
        description: "The emergency request has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete emergency request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle updating emergency request
  const handleUpdateRequest = () => {
    if (!selectedRequestId) return;

    const updateData: any = {
      status: updateStatus,
    };

    if (updateNotes) {
      updateData.description = updateNotes;
    }

    if (selectedFacility) {
      updateData.medicalFacilityId = selectedFacility;
    }

    if (assignedResponder) {
      updateData.assignedResponder = assignedResponder;
    }

    updateRequestMutation.mutate({ id: selectedRequestId, data: updateData });
  };

  // Handle opening the update dialog
  const openUpdateDialog = (request: EmergencyRequest) => {
    setSelectedRequestId(request.id);
    setUpdateStatus(request.status || "pending");
    setUpdateNotes(request.description || "");
    setAssignedResponder(request.assignedResponder || undefined);
    setSelectedFacility(request.medicalFacilityId || undefined);
    setIsDialogOpen(true);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">{status}</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">{status}</Badge>;
      case "completed":
        return <Badge className="bg-green-500">{status}</Badge>;
      case "canceled":
        return <Badge className="bg-red-500">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Find a facility by ID
  const getFacilityById = (id?: number | null) => {
    if (!id || !facilities) return "Not assigned";
    const facility = facilities.find(f => f.id === id);
    return facility ? facility.name : "Unknown facility";
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return format(date, "MMM d, yyyy h:mm a");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Filter requests by tab
  const filterRequestsByStatus = (status: string | null) => {
    if (!emergencyRequests) return [];
    if (!status) return emergencyRequests;
    return emergencyRequests.filter(r => r.status === status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002244] via-[#003366] to-[#004080] text-white">
      <NavigationBar />
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Card className="mb-6 bg-slate-800/60 border-slate-700 shadow-lg text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Emergency Response Dashboard</CardTitle>
            <CardDescription className="text-slate-300">
              Manage and respond to emergency requests from users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <Button 
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/emergency-requests"] });
                  setHasNewEmergencies(false);
                }}
                variant="outline"
                size="sm"
                className={`${
                  hasNewEmergencies 
                    ? "border-red-500 text-red-500 hover:bg-red-500/20 animate-pulse" 
                    : "border-blue-400 text-blue-400 hover:bg-blue-400/20"
                }`}
              >
                {hasNewEmergencies ? (
                  <>
                    <BellRing className="mr-2 h-4 w-4" />
                    New Emergency Alerts!
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            {isLoadingRequests ? (
              <div className="flex justify-center p-10">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
              </div>
            ) : requestsError ? (
              <div className="text-red-400 p-10 text-center flex flex-col items-center">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p>Error loading emergency requests</p>
              </div>
            ) : (
              <>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-5 mb-6 bg-slate-700/50">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="processing">Processing</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="canceled">Canceled</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <EmergencyRequestsList 
                      requests={filterRequestsByStatus(null)} 
                      onUpdate={openUpdateDialog}
                      onDelete={(id) => deleteRequestMutation.mutate(id)}
                      getFacilityById={getFacilityById}
                      getStatusBadge={getStatusBadge}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>

                  <TabsContent value="pending">
                    <EmergencyRequestsList 
                      requests={filterRequestsByStatus("pending")} 
                      onUpdate={openUpdateDialog}
                      onDelete={(id) => deleteRequestMutation.mutate(id)}
                      getFacilityById={getFacilityById}
                      getStatusBadge={getStatusBadge}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>

                  <TabsContent value="processing">
                    <EmergencyRequestsList 
                      requests={filterRequestsByStatus("processing")} 
                      onUpdate={openUpdateDialog}
                      onDelete={(id) => deleteRequestMutation.mutate(id)}
                      getFacilityById={getFacilityById}
                      getStatusBadge={getStatusBadge}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>

                  <TabsContent value="completed">
                    <EmergencyRequestsList 
                      requests={filterRequestsByStatus("completed")} 
                      onUpdate={openUpdateDialog}
                      onDelete={(id) => deleteRequestMutation.mutate(id)}
                      getFacilityById={getFacilityById}
                      getStatusBadge={getStatusBadge}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>

                  <TabsContent value="canceled">
                    <EmergencyRequestsList 
                      requests={filterRequestsByStatus("canceled")} 
                      onUpdate={openUpdateDialog}
                      onDelete={(id) => deleteRequestMutation.mutate(id)}
                      getFacilityById={getFacilityById}
                      getStatusBadge={getStatusBadge}
                      formatRelativeTime={formatRelativeTime}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Update Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Update Emergency Request</DialogTitle>
            <DialogDescription className="text-slate-300">
              Update the status and details of this emergency request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select 
                value={updateStatus}
                onValueChange={(value) => setUpdateStatus(value)}
              >
                <SelectTrigger id="status" className="w-full bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="facility" className="text-sm font-medium">Assign to Facility</label>
              <Select 
                value={selectedFacility?.toString()}
                onValueChange={(value) => setSelectedFacility(Number(value))}
              >
                <SelectTrigger id="facility" className="w-full bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {facilities?.map(facility => (
                    <SelectItem key={facility.id} value={facility.id.toString()}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {adminUsers && (
              <div className="space-y-2">
                <label htmlFor="responder" className="text-sm font-medium">Assign Responder</label>
                <Select 
                  value={assignedResponder?.toString()}
                  onValueChange={(value) => setAssignedResponder(Number(value))}
                >
                  <SelectTrigger className="w-full bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select responder" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {adminUsers?.map(admin => (
                      <SelectItem key={admin.id} value={admin.id.toString()}>
                        {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">Additional Notes</label>
              <Textarea 
                id="notes" 
                value={updateNotes} 
                onChange={(e) => setUpdateNotes(e.target.value)}
                className="min-h-[100px] bg-slate-700 border-slate-600"
                placeholder="Add additional notes or status updates..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRequest}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateRequestMutation.isPending}
            >
              {updateRequestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Emergency Requests List component
function EmergencyRequestsList({ 
  requests,
  onUpdate,
  onDelete,
  getFacilityById,
  getStatusBadge,
  formatRelativeTime
}: { 
  requests: EmergencyRequest[],
  onUpdate: (request: EmergencyRequest) => void,
  onDelete: (id: number) => void,
  getFacilityById: (id?: number | null) => string,
  getStatusBadge: (status: string) => JSX.Element,
  formatRelativeTime: (date: string | Date) => string
}) {
  if (!requests.length) {
    return (
      <div className="text-center p-10 border border-dashed border-slate-700 rounded-lg">
        <Clock className="h-10 w-10 mb-2 text-slate-500 mx-auto" />
        <p className="text-slate-400">No emergency requests in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <Card key={request.id} className="bg-slate-700/50 border-slate-600">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg flex items-center">
                  Request #{request.id} 
                  <span className="ml-3">{getStatusBadge(request.status || "pending")}</span>
                </CardTitle>
                <CardDescription className="text-slate-300 mt-1">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatRelativeTime(request.createdAt)}
                  </div>
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onUpdate(request)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDelete(request.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-slate-300">
                    Latitude: {(request.location as any).latitude}, 
                    Longitude: {(request.location as any).longitude}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <UserIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">User ID</p>
                  <p className="text-sm text-slate-300">{request.userId}</p>
                </div>
              </div>

              {request.description && (
                <div className="pl-7">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-slate-300">{request.description}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-600 pt-4 flex justify-between">
            <div>
              <p className="text-xs text-slate-400">Assigned to facility</p>
              <p className="text-sm">{getFacilityById(request.medicalFacilityId || undefined)}</p>
            </div>
            {request.assignedResponder && (
              <div>
                <p className="text-xs text-slate-400">Assigned responder</p>
                <p className="text-sm">ID: {request.assignedResponder}</p>
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}