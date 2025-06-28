"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useCustomer,
  useCustomerNotes,
  useCustomerReminders,
  useCustomerPhones,
  useCustomerAddresses,
} from "@/lib/hooks/use-customers";
import { useReminderActions } from "@/lib/hooks/use-reminders";

import { ProtectedLayout } from "@/components/layout/protected-layout";
import { Loading } from "@/components/ui/loading";
import { handleAPIError, handleAPISuccess } from "@/lib/utils/api-utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReminderCard } from "@/components/reminder-card";
import { ReminderForm } from "@/components/reminder-form";
import { NoteForm } from "@/components/note-form";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconArrowLeft,
  IconUsers,
  IconMail,
  IconPhone,
  IconMapPin,
  IconNote,
  IconBell,
  IconEdit,
  IconPlus,
  IconTrash,
  IconDotsVertical,
  IconCopy,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [isAddReminderSheetOpen, setIsAddReminderSheetOpen] = useState(false);
  const [isAddNoteSheetOpen, setIsAddNoteSheetOpen] = useState(false);
  const [isEditNoteSheetOpen, setIsEditNoteSheetOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{id: string, note: string} | null>(null);

  const { customer, isLoading, error } = useCustomer(customerId);
  const { notes, deleteNote } = useCustomerNotes(customerId);
  const { reminders } = useCustomerReminders(customerId);
  const { phones } = useCustomerPhones(customerId);
  const { addresses } = useCustomerAddresses(customerId);
  const { completeReminder, reopenReminder, deleteReminder } = useReminderActions();

  // Handle errors
  if (error) {
    handleAPIError(error, "Failed to load customer details");
  }

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loading />
            <p className="mt-4 text-muted-foreground">
              Loading customer details...
            </p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!customer) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <IconUsers className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Customer not found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The customer you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button className="mt-4" onClick={() => router.push("/customers")}>
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Customers
            </Button>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  // Get initials for avatar
  const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(
    0
  )}`;


  // Handle reminder actions
  const handleCompleteReminder = async (customerId: string, reminderId: string) => {
    const actionKey = `${customerId}-${reminderId}-complete`;
    setLoadingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const result = await completeReminder(customerId, reminderId);
      
      if (result.success) {
        handleAPISuccess("Reminder marked as completed!");
      } else {
        handleAPIError(result.error, "Failed to complete reminder");
      }
    } catch (error) {
      handleAPIError(error, "Failed to complete reminder");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleReopenReminder = async (customerId: string, reminderId: string) => {
    const actionKey = `${customerId}-${reminderId}-reopen`;
    setLoadingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const result = await reopenReminder(customerId, reminderId);
      
      if (result.success) {
        handleAPISuccess("Reminder reopened!");
      } else {
        handleAPIError(result.error, "Failed to reopen reminder");
      }
    } catch (error) {
      handleAPIError(error, "Failed to reopen reminder");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleDeleteReminder = async (customerId: string, reminderId: string) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    
    const actionKey = `${customerId}-${reminderId}-delete`;
    setLoadingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const result = await deleteReminder(customerId, reminderId);
      
      if (result.success) {
        handleAPISuccess("Reminder deleted!");
      } else {
        handleAPIError(result.error, "Failed to delete reminder");
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete reminder");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleAddReminderSuccess = () => {
    setIsAddReminderSheetOpen(false);
    // The reminders will automatically refresh due to SWR
  };

  const handleAddReminderCancel = () => {
    setIsAddReminderSheetOpen(false);
  };

  const handleAddNoteSuccess = () => {
    setIsAddNoteSheetOpen(false);
    // The notes will automatically refresh due to SWR
  };

  const handleAddNoteCancel = () => {
    setIsAddNoteSheetOpen(false);
  };

  const handleEditNoteSuccess = () => {
    setIsEditNoteSheetOpen(false);
    setEditingNote(null);
    // The notes will automatically refresh due to SWR
  };

  const handleEditNoteCancel = () => {
    setIsEditNoteSheetOpen(false);
    setEditingNote(null);
  };

  const handleEditNote = (noteId: string, noteContent: string) => {
    setEditingNote({ id: noteId, note: noteContent });
    setIsEditNoteSheetOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    const actionKey = `note-${noteId}-delete`;
    setLoadingActions(prev => new Set(prev).add(actionKey));
    
    try {
      const result = await deleteNote(noteId);
      
      if (result.success) {
        handleAPISuccess("Note deleted!");
      } else {
        handleAPIError(result.error, "Failed to delete note");
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete note");
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleCopyNote = async (noteContent: string) => {
    try {
      await navigator.clipboard.writeText(noteContent);
      handleAPISuccess("Note copied to clipboard!");
    } catch (error) {
      handleAPIError(error, "Failed to copy note");
    }
  };

  return (
    <ProtectedLayout>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col bg-background">
            <div className="@container/main flex flex-1 flex-col">
              {/* Modern Header with cleaner spacing */}
              <div className="border-b bg-card">
                <div className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/customers")}
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      <IconArrowLeft className="h-4 w-4" />
                      <span className="sr-only">Back to customers</span>
                    </Button>

                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-14 w-14 border-2 border-border">
                        <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                          {customer.firstName} {customer.lastName}
                        </h1>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <IconMail className="h-3.5 w-3.5" />
                          <span>{customer.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <IconEdit className="mr-2 h-4 w-4" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <IconCopy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 px-6 py-6 space-y-10">
                {/* Contact Information Section */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Phone Numbers */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <IconPhone className="h-5 w-5" />
                          Phone Numbers
                        </h2>
                        <Button size="sm" variant="outline">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Phone
                        </Button>
                      </div>
                      {phones && phones.length > 0 ? (
                        <div className="space-y-3">
                          {phones.map((phone) => (
                            <div
                              key={phone.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <IconPhone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {phone.phoneNumber}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    {phone.designation}
                                  </Badge>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <IconDotsVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Copy</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg bg-muted/10">
                          <IconPhone className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                          <h3 className="text-sm font-medium text-foreground mb-1">
                            No phone numbers
                          </h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Add a phone number to get started
                          </p>
                          <Button size="sm" variant="outline">
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Phone
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Addresses */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <IconMapPin className="h-5 w-5" />
                          Addresses
                        </h2>
                        <Button size="sm" variant="outline">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Address
                        </Button>
                      </div>
                      {addresses && addresses.length > 0 ? (
                        <div className="space-y-3">
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              className="flex items-start justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <IconMapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">
                                    {address.street}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.city}, {address.state} {address.postalCode}
                                  </p>
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {address.addressType}
                                  </Badge>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <IconDotsVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Copy</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg bg-muted/10">
                          <IconMapPin className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                          <h3 className="text-sm font-medium text-foreground mb-1">
                            No addresses
                          </h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Add an address to get started
                          </p>
                          <Button size="sm" variant="outline">
                            <IconPlus className="mr-2 h-4 w-4" />
                            Add Address
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <IconNote className="h-5 w-5" />
                      Notes
                    </h2>
                    <Sheet open={isAddNoteSheetOpen} onOpenChange={setIsAddNoteSheetOpen}>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Note
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-y-auto p-6">
                            <NoteForm
                              customerId={customerId}
                              onSuccess={handleAddNoteSuccess}
                              onCancel={handleAddNoteCancel}
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Edit Note Sheet */}
                    <Sheet open={isEditNoteSheetOpen} onOpenChange={setIsEditNoteSheetOpen}>
                      <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-y-auto p-6">
                            {editingNote && (
                              <NoteForm
                                customerId={customerId}
                                noteId={editingNote.id}
                                initialNote={editingNote.note}
                                onSuccess={handleEditNoteSuccess}
                                onCancel={handleEditNoteCancel}
                              />
                            )}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  {notes && notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-sm text-foreground line-clamp-3 pr-2">
                              {note.note}
                            </p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                                  <IconDotsVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEditNote(note.id, note.note)}>
                                  <IconEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyNote(note.note)}>
                                  <IconCopy className="mr-2 h-4 w-4" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={loadingActions.has(`note-${note.id}-delete`)}
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  {loadingActions.has(`note-${note.id}-delete`) ? "Deleting..." : "Delete"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(note.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                      <IconNote className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        No notes yet
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Add your first note about this customer
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setIsAddNoteSheetOpen(true)}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Note
                      </Button>
                    </div>
                  )}
                </div>

                {/* Reminders Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <IconBell className="h-5 w-5" />
                      Reminders
                    </h2>
                    <Sheet open={isAddReminderSheetOpen} onOpenChange={setIsAddReminderSheetOpen}>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Reminder
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0">
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-y-auto p-6">
                            <ReminderForm
                              preselectedCustomerId={customerId}
                              onSuccess={handleAddReminderSuccess}
                              onCancel={handleAddReminderCancel}
                            />
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  {reminders && reminders.length > 0 ? (
                    <div className="space-y-2">
                      {reminders.map((reminder) => (
                        <ReminderCard
                          key={reminder.id}
                          reminder={{
                            id: reminder.id,
                            description: reminder.description,
                            dueDate: reminder.dueDate,
                            priority: reminder.priority as 'low' | 'medium' | 'high',
                            completed: !!reminder.dateCompleted,
                            customerId: customerId,
                            customerName: `${customer.firstName} ${customer.lastName}`,
                            customerEmail: customer.email,
                          }}
                          onComplete={handleCompleteReminder}
                          onReopen={handleReopenReminder}
                          onDelete={handleDeleteReminder}
                          loadingActions={loadingActions}
                          showCustomerInfo={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                      <IconBell className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                      <h3 className="text-sm font-medium text-foreground mb-1">
                        No reminders yet
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Create your first reminder to get started
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setIsAddReminderSheetOpen(true)}>
                        <IconPlus className="mr-2 h-4 w-4" />
                        Add Reminder
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedLayout>
  );
}

