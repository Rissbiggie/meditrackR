import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Edit } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmergencyContact, insertEmergencyContactSchema } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface EmergencyContactsProps {
  userId: number;
}

export function EmergencyContacts({ userId }: EmergencyContactsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null);
  const { toast } = useToast();
  
  // Fetch emergency contacts
  const { data: contacts, isLoading } = useQuery<EmergencyContact[]>({
    queryKey: ['/api/emergency-contacts'],
  });
  
  // Define schema for form
  const formSchema = insertEmergencyContactSchema.extend({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(7, "Please enter a valid phone number"),
    relationship: z.string().optional(),
  }).omit({ userId: true });
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      relationship: '',
    },
  });
  
  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest('POST', '/api/emergency-contacts', {
        ...data,
        userId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: 'Contact added',
        description: 'Emergency contact has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async (data: { id: number; values: z.infer<typeof formSchema> }) => {
      const res = await apiRequest('PUT', `/api/emergency-contacts/${data.id}`, data.values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      setDialogOpen(false);
      setEditContact(null);
      form.reset();
      toast({
        title: 'Contact updated',
        description: 'Emergency contact has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/emergency-contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-contacts'] });
      toast({
        title: 'Contact deleted',
        description: 'Emergency contact has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editContact) {
      updateContactMutation.mutate({ id: editContact.id, values });
    } else {
      addContactMutation.mutate(values);
    }
  };
  
  const handleEdit = (contact: EmergencyContact) => {
    setEditContact(contact);
    form.reset({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship || '',
    });
    setDialogOpen(true);
  };
  
  const handleAdd = () => {
    setEditContact(null);
    form.reset({
      name: '',
      phone: '',
      relationship: '',
    });
    setDialogOpen(true);
  };
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(id);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Emergency Contacts</CardTitle>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading contacts...</div>
          ) : contacts && contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-gray-500">
                      {contact.phone}
                      {contact.relationship && ` • ${contact.relationship}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No emergency contacts added yet. Add your first contact.
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Family, Friend, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addContactMutation.isPending || updateContactMutation.isPending}
                >
                  {editContact ? 'Update Contact' : 'Add Contact'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
