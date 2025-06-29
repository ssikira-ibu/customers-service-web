"use client";

import { useState, useEffect } from "react";
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
import {
  handleAPIError,
  handleAPISuccess,
  formatPhoneNumber,
  formatAddressForDisplay,
  getAddressTypeEmoji,
  formatAddressForMaps,
} from "@/lib/utils/api-utils";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { ReminderCard } from "@/components/reminder-card";
import { ReminderForm } from "@/components/reminder-form";
import { NoteForm } from "@/components/note-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const router = useRouter();
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [isAddReminderSheetOpen, setIsAddReminderSheetOpen] = useState(false);
  const [isAddNoteSheetOpen, setIsAddNoteSheetOpen] = useState(false);
  const [isEditNoteSheetOpen, setIsEditNoteSheetOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    id: string;
    note: string;
  } | null>(null);

  // Phone dialog states
  const [isAddPhoneDialogOpen, setIsAddPhoneDialogOpen] = useState(false);
  const [isEditPhoneDialogOpen, setIsEditPhoneDialogOpen] = useState(false);
  const [isDeletePhoneDialogOpen, setIsDeletePhoneDialogOpen] = useState(false);
  const [phoneToEdit, setPhoneToEdit] = useState<{
    id: string;
    phoneNumber: string;
    designation: string;
  } | null>(null);
  const [phoneToDelete, setPhoneToDelete] = useState<{
    id: string;
    phoneNumber: string;
  } | null>(null);
  const [phoneFormData, setPhoneFormData] = useState({
    phoneNumber: "",
    designation: "mobile",
  });
  const [isPhoneFormLoading, setIsPhoneFormLoading] = useState(false);

  // Address dialog states
  const [isAddAddressDialogOpen, setIsAddAddressDialogOpen] = useState(false);
  const [isEditAddressDialogOpen, setIsEditAddressDialogOpen] = useState(false);
  const [isDeleteAddressDialogOpen, setIsDeleteAddressDialogOpen] =
    useState(false);
  const [addressToEdit, setAddressToEdit] = useState<{
    id: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    region?: string;
    district?: string;
    postalCode?: string;
    country: string;
    addressType: string;
  } | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<{
    id: string;
    addressLine1: string;
  } | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    region: "",
    district: "",
    postalCode: "",
    country: "United States",
    addressType: "home",
  });
  const [isAddressFormLoading, setIsAddressFormLoading] = useState(false);

  const { customer, isLoading, error } = useCustomer(customerId);
  const { notes, deleteNote } = useCustomerNotes(customerId);
  const { reminders } = useCustomerReminders(customerId);
  const { phones, addPhone, updatePhone, deletePhone } =
    useCustomerPhones(customerId);
  const { addresses, addAddress, updateAddress, deleteAddress } =
    useCustomerAddresses(customerId);
  const { completeReminder, reopenReminder, deleteReminder } =
    useReminderActions();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + P: Add Phone
      if ((event.ctrlKey || event.metaKey) && event.key === "p") {
        event.preventDefault();
        openAddPhoneDialog();
      }

      // Ctrl/Cmd + N: Add Note
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault();
        setIsAddNoteSheetOpen(true);
      }

      // Ctrl/Cmd + R: Add Reminder
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        setIsAddReminderSheetOpen(true);
      }

      // Ctrl/Cmd + A: Add Address
      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        openAddAddressDialog();
      }

      // Escape: Close all dialogs
      if (event.key === "Escape") {
        setIsAddPhoneDialogOpen(false);
        setIsEditPhoneDialogOpen(false);
        setIsDeletePhoneDialogOpen(false);
        setIsAddNoteSheetOpen(false);
        setIsEditNoteSheetOpen(false);
        setIsAddReminderSheetOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
              The customer you&apos;re looking for doesn&apos;t exist or has
              been removed.
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
  const handleCompleteReminder = async (
    customerId: string,
    reminderId: string
  ) => {
    const actionKey = `${customerId}-${reminderId}-complete`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

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
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleReopenReminder = async (
    customerId: string,
    reminderId: string
  ) => {
    const actionKey = `${customerId}-${reminderId}-reopen`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

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
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleDeleteReminder = async (
    customerId: string,
    reminderId: string
  ) => {
    if (!confirm("Are you sure you want to delete this reminder?")) return;

    const actionKey = `${customerId}-${reminderId}-delete`;
    setLoadingActions((prev) => new Set(prev).add(actionKey));

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
      setLoadingActions((prev) => {
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
    setLoadingActions((prev) => new Set(prev).add(actionKey));

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
      setLoadingActions((prev) => {
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

  // Phone dialog handlers
  const handleAddPhone = async () => {
    // PhoneInput only provides valid E164 numbers, so no need for manual validation
    setIsPhoneFormLoading(true);
    try {
      const result = await addPhone({
        phoneNumber: phoneFormData.phoneNumber,
        designation: phoneFormData.designation,
      });

      if (result.success) {
        toast.success("Phone number added successfully!");
        setIsAddPhoneDialogOpen(false);
        setPhoneFormData({ phoneNumber: "", designation: "mobile" });
      } else {
        handleAPIError(result.error, "Failed to add phone number");
      }
    } catch (error) {
      handleAPIError(error, "Failed to add phone number");
    } finally {
      setIsPhoneFormLoading(false);
    }
  };

  const handleEditPhone = async () => {
    if (!phoneToEdit) {
      return;
    }

    // PhoneInput only provides valid E164 numbers, so no need for manual validation
    setIsPhoneFormLoading(true);
    try {
      const result = await updatePhone(phoneToEdit.id, {
        phoneNumber: phoneFormData.phoneNumber,
        designation: phoneFormData.designation,
      });

      if (result.success) {
        toast.success("Phone number updated successfully!");
        setIsEditPhoneDialogOpen(false);
        setPhoneToEdit(null);
        setPhoneFormData({ phoneNumber: "", designation: "mobile" });
      } else {
        handleAPIError(result.error, "Failed to update phone number");
      }
    } catch (error) {
      handleAPIError(error, "Failed to update phone number");
    } finally {
      setIsPhoneFormLoading(false);
    }
  };

  const handleDeletePhone = async () => {
    if (!phoneToDelete) return;

    setIsPhoneFormLoading(true);
    try {
      const result = await deletePhone(phoneToDelete.id);

      if (result.success) {
        toast.success("Phone number deleted successfully!");
        setIsDeletePhoneDialogOpen(false);
        setPhoneToDelete(null);
      } else {
        handleAPIError(result.error, "Failed to delete phone number");
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete phone number");
    } finally {
      setIsPhoneFormLoading(false);
    }
  };

  const openAddPhoneDialog = () => {
    setPhoneFormData({ phoneNumber: "", designation: "mobile" });
    setIsAddPhoneDialogOpen(true);
  };

  const openEditPhoneDialog = (phone: {
    id: string;
    phoneNumber: string;
    designation: string;
  }) => {
    setPhoneToEdit(phone);
    setPhoneFormData({
      phoneNumber: phone.phoneNumber,
      designation: phone.designation,
    });
    setIsEditPhoneDialogOpen(true);
  };

  const openDeletePhoneDialog = (phone: {
    id: string;
    phoneNumber: string;
  }) => {
    setPhoneToDelete(phone);
    setIsDeletePhoneDialogOpen(true);
  };

  const handleCopyPhone = async (phoneNumber: string) => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      toast.success("Phone number copied to clipboard!");
    } catch (error) {
      handleAPIError(error, "Failed to copy phone number");
    }
  };

  // Address dialog handlers
  const handleAddAddress = async () => {
    setIsAddressFormLoading(true);
    try {
      const addressData: any = {
        addressLine1: addressFormData.addressLine1,
        city: addressFormData.city,
        country: addressFormData.country,
        addressType: addressFormData.addressType,
      };

      // Only add optional fields if they have values
      if (addressFormData.addressLine2?.trim()) {
        addressData.addressLine2 = addressFormData.addressLine2;
      }
      if (addressFormData.stateProvince?.trim()) {
        addressData.stateProvince = addressFormData.stateProvince;
      }
      if (addressFormData.region?.trim()) {
        addressData.region = addressFormData.region;
      }
      if (addressFormData.district?.trim()) {
        addressData.district = addressFormData.district;
      }
      if (addressFormData.postalCode?.trim()) {
        addressData.postalCode = addressFormData.postalCode;
      }

      const result = await addAddress(addressData);

      if (result.success) {
        toast.success("Address added successfully!");
        setIsAddAddressDialogOpen(false);
        setAddressFormData({
          addressLine1: "",
          addressLine2: "",
          city: "",
          stateProvince: "",
          region: "",
          district: "",
          postalCode: "",
          country: "United States",
          addressType: "home",
        });
      } else {
        handleAPIError(result.error, "Failed to add address");
      }
    } catch (error) {
      handleAPIError(error, "Failed to add address");
    } finally {
      setIsAddressFormLoading(false);
    }
  };

  const handleEditAddress = async () => {
    if (!addressToEdit) {
      return;
    }

    setIsAddressFormLoading(true);
    try {
      const addressData: any = {
        addressLine1: addressFormData.addressLine1,
        city: addressFormData.city,
        country: addressFormData.country,
        addressType: addressFormData.addressType,
      };

      // Only add optional fields if they have values
      if (addressFormData.addressLine2?.trim()) {
        addressData.addressLine2 = addressFormData.addressLine2;
      }
      if (addressFormData.stateProvince?.trim()) {
        addressData.stateProvince = addressFormData.stateProvince;
      }
      if (addressFormData.region?.trim()) {
        addressData.region = addressFormData.region;
      }
      if (addressFormData.district?.trim()) {
        addressData.district = addressFormData.district;
      }
      if (addressFormData.postalCode?.trim()) {
        addressData.postalCode = addressFormData.postalCode;
      }

      const result = await updateAddress(addressToEdit.id, addressData);

      if (result.success) {
        toast.success("Address updated successfully!");
        setIsEditAddressDialogOpen(false);
        setAddressToEdit(null);
        setAddressFormData({
          addressLine1: "",
          addressLine2: "",
          city: "",
          stateProvince: "",
          region: "",
          district: "",
          postalCode: "",
          country: "United States",
          addressType: "home",
        });
      } else {
        handleAPIError(result.error, "Failed to update address");
      }
    } catch (error) {
      handleAPIError(error, "Failed to update address");
    } finally {
      setIsAddressFormLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;

    setIsAddressFormLoading(true);
    try {
      const result = await deleteAddress(addressToDelete.id);
      if (result.success) {
        toast.success("Address deleted successfully!");
        setIsDeleteAddressDialogOpen(false);
        setAddressToDelete(null);
      } else {
        handleAPIError(result.error, "Failed to delete address");
      }
    } catch (error) {
      handleAPIError(error, "Failed to delete address");
    } finally {
      setIsAddressFormLoading(false);
    }
  };

  const openAddAddressDialog = () => {
    setAddressFormData({
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateProvince: "",
      region: "",
      district: "",
      postalCode: "",
      country: "United States",
      addressType: "home",
    });
    setIsAddAddressDialogOpen(true);
  };

  const openEditAddressDialog = (address: {
    id: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    region?: string;
    district?: string;
    postalCode?: string;
    country: string;
    addressType: string;
  }) => {
    setAddressToEdit(address);
    setAddressFormData({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      stateProvince: address.stateProvince || "",
      region: address.region || "",
      district: address.district || "",
      postalCode: address.postalCode || "",
      country: address.country,
      addressType: address.addressType,
    });
    setIsEditAddressDialogOpen(true);
  };

  const openDeleteAddressDialog = (address: {
    id: string;
    addressLine1: string;
  }) => {
    setAddressToDelete(address);
    setIsDeleteAddressDialogOpen(true);
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openAddPhoneDialog}
                          title="Add Phone Number (⌘+P)"
                        >
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Phone
                          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
                            <span className="text-xs">⌘</span>P
                          </kbd>
                        </Button>
                      </div>
                      {phones && phones.length > 0 ? (
                        <div className="space-y-3">
                          {phones.map((phone) => (
                            <div
                              key={phone.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors group relative"
                            >
                              <a
                                href={`tel:${phone.phoneNumber}`}
                                className="flex items-center gap-3 flex-1 min-w-0"
                                title={`Call ${formatPhoneNumber(
                                  phone.phoneNumber,
                                  "international"
                                )}`}
                              >
                                <div className="p-2 rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                  <IconPhone className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    {formatPhoneNumber(
                                      phone.phoneNumber,
                                      "international"
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {phone.designation === "mobile" && "📱 "}
                                      {phone.designation === "home" && "🏠 "}
                                      {phone.designation === "work" && "💼 "}
                                      {phone.designation === "other" && "📞 "}
                                      {phone.designation}
                                    </Badge>
                                  </div>
                                </div>
                              </a>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 relative z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <IconDotsVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() => openEditPhoneDialog(phone)}
                                  >
                                    <IconEdit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleCopyPhone(phone.phoneNumber)
                                    }
                                  >
                                    <IconCopy className="mr-2 h-4 w-4" />
                                    Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => openDeletePhoneDialog(phone)}
                                  >
                                    <IconTrash className="mr-2 h-4 w-4" />
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={openAddPhoneDialog}
                          >
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openAddAddressDialog}
                          title="Add Address (⌘+A)"
                        >
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Address
                          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
                            <span className="text-xs">⌘</span>A
                          </kbd>
                        </Button>
                      </div>
                      {addresses && addresses.length > 0 ? (
                        <div className="space-y-3">
                          {addresses.map((address) => {
                            const formattedAddress =
                              formatAddressForDisplay(address);
                            const mapsUrl = `https://maps.google.com/maps?q=${formatAddressForMaps(
                              address
                            )}`;
                            const addressEmoji = getAddressTypeEmoji(
                              address.addressType
                            );

                            return (
                              <div
                                key={address.id}
                                className="flex items-start justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors group relative"
                              >
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-3 flex-1 min-w-0"
                                  title={`Open in Google Maps: ${formattedAddress.replace(
                                    /\n/g,
                                    ", "
                                  )}`}
                                >
                                  <div className="p-2 rounded-full bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors mt-0.5">
                                    <IconMapPin className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors whitespace-pre-line">
                                      {formattedAddress}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {addressEmoji} {address.addressType}
                                      </Badge>
                                    </div>
                                  </div>
                                </a>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 relative z-10"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <IconDotsVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openEditAddressDialog(address)
                                      }
                                    >
                                      <IconEdit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          formattedAddress.replace(/\n/g, ", ")
                                        );
                                        toast.success(
                                          "Address copied to clipboard"
                                        );
                                      }}
                                    >
                                      <IconCopy className="mr-2 h-4 w-4" />
                                      Copy Address
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        window.open(mapsUrl, "_blank")
                                      }
                                    >
                                      <IconMapPin className="mr-2 h-4 w-4" />
                                      Open in Maps
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() =>
                                        openDeleteAddressDialog(address)
                                      }
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            );
                          })}
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={openAddAddressDialog}
                          >
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
                    <Sheet
                      open={isAddNoteSheetOpen}
                      onOpenChange={setIsAddNoteSheetOpen}
                    >
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Note
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[500px] sm:w-[600px] p-0"
                      >
                        <SheetHeader className="sr-only">
                          <SheetTitle>Add Note</SheetTitle>
                          <SheetDescription>
                            Add a new note for this customer
                          </SheetDescription>
                        </SheetHeader>
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
                    <Sheet
                      open={isEditNoteSheetOpen}
                      onOpenChange={setIsEditNoteSheetOpen}
                    >
                      <SheetContent
                        side="right"
                        className="w-[500px] sm:w-[600px] p-0"
                      >
                        <SheetHeader className="sr-only">
                          <SheetTitle>Edit Note</SheetTitle>
                          <SheetDescription>
                            Edit this customer note
                          </SheetDescription>
                        </SheetHeader>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 shrink-0"
                                >
                                  <IconDotsVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEditNote(note.id, note.note)
                                  }
                                >
                                  <IconEdit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyNote(note.note)}
                                >
                                  <IconCopy className="mr-2 h-4 w-4" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={loadingActions.has(
                                    `note-${note.id}-delete`
                                  )}
                                >
                                  <IconTrash className="mr-2 h-4 w-4" />
                                  {loadingActions.has(`note-${note.id}-delete`)
                                    ? "Deleting..."
                                    : "Delete"}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddNoteSheetOpen(true)}
                      >
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
                    <Sheet
                      open={isAddReminderSheetOpen}
                      onOpenChange={setIsAddReminderSheetOpen}
                    >
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          <IconPlus className="mr-2 h-4 w-4" />
                          Add Reminder
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[500px] sm:w-[600px] p-0"
                      >
                        <SheetHeader className="sr-only">
                          <SheetTitle>Add Reminder</SheetTitle>
                          <SheetDescription>
                            Create a new reminder for this customer
                          </SheetDescription>
                        </SheetHeader>
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
                            priority: reminder.priority as
                              | "low"
                              | "medium"
                              | "high",
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddReminderSheetOpen(true)}
                      >
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

      {/* Add Phone Dialog */}
      <Dialog
        open={isAddPhoneDialogOpen}
        onOpenChange={setIsAddPhoneDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Phone Number</DialogTitle>
            <DialogDescription>
              Add a new phone number for {customer.firstName}{" "}
              {customer.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <PhoneInput
                id="phoneNumber"
                value={phoneFormData.phoneNumber}
                onChange={(value: string | undefined) =>
                  setPhoneFormData((prev) => ({
                    ...prev,
                    phoneNumber: value || "",
                  }))
                }
                placeholder="Enter phone number"
                disabled={isPhoneFormLoading}
                defaultCountry="US"
                autoFocus
              />
              {!phoneFormData.phoneNumber && (
                <div className="text-xs text-muted-foreground">
                  Select country and enter phone number
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Type</Label>
              <Select
                value={phoneFormData.designation}
                onValueChange={(value) =>
                  setPhoneFormData((prev) => ({ ...prev, designation: value }))
                }
                disabled={isPhoneFormLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">📱 Mobile</SelectItem>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="other">📞 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPhoneDialogOpen(false)}
              disabled={isPhoneFormLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPhone}
              disabled={isPhoneFormLoading || !phoneFormData.phoneNumber}
            >
              {isPhoneFormLoading ? (
                <>
                  <Loading className="mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                <>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Phone
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog
        open={isEditPhoneDialogOpen}
        onOpenChange={setIsEditPhoneDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Phone Number</DialogTitle>
            <DialogDescription>
              Update the phone number for {customer.firstName}{" "}
              {customer.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPhoneNumber">Phone Number</Label>
              <PhoneInput
                id="editPhoneNumber"
                value={phoneFormData.phoneNumber}
                onChange={(value: string | undefined) =>
                  setPhoneFormData((prev) => ({
                    ...prev,
                    phoneNumber: value || "",
                  }))
                }
                placeholder="Enter phone number"
                disabled={isPhoneFormLoading}
                defaultCountry="US"
                autoFocus
              />
              {!phoneFormData.phoneNumber && (
                <div className="text-xs text-muted-foreground">
                  Select country and enter phone number
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDesignation">Type</Label>
              <Select
                value={phoneFormData.designation}
                onValueChange={(value) =>
                  setPhoneFormData((prev) => ({ ...prev, designation: value }))
                }
                disabled={isPhoneFormLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">📱 Mobile</SelectItem>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="other">📞 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditPhoneDialogOpen(false)}
              disabled={isPhoneFormLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPhone}
              disabled={isPhoneFormLoading || !phoneFormData.phoneNumber}
            >
              {isPhoneFormLoading ? (
                <>
                  <Loading className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                <>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Update Phone
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Phone Confirmation Dialog */}
      <Dialog
        open={isDeletePhoneDialogOpen}
        onOpenChange={setIsDeletePhoneDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Phone Number</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the phone number{" "}
              <span className="font-medium">{phoneToDelete?.phoneNumber}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeletePhoneDialogOpen(false)}
              disabled={isPhoneFormLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePhone}
              disabled={isPhoneFormLoading}
            >
              {isPhoneFormLoading ? "Deleting..." : "Delete Phone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Address Dialog */}
      <Dialog
        open={isAddAddressDialogOpen}
        onOpenChange={setIsAddAddressDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Address</DialogTitle>
            <DialogDescription>
              Add a new address for {customer.firstName} {customer.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Street Address</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                autoComplete="address-line1"
                value={addressFormData.addressLine1}
                onChange={(e) =>
                  setAddressFormData((prev) => ({
                    ...prev,
                    addressLine1: e.target.value,
                  }))
                }
                placeholder="123 Main Street"
                disabled={isAddressFormLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                autoComplete="address-line2"
                value={addressFormData.addressLine2}
                onChange={(e) =>
                  setAddressFormData((prev) => ({
                    ...prev,
                    addressLine2: e.target.value,
                  }))
                }
                placeholder="Apt, Suite, Floor (optional)"
                disabled={isAddressFormLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={addressFormData.city}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="New York"
                  disabled={isAddressFormLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateProvince">State/Province</Label>
                <Input
                  id="stateProvince"
                  name="stateProvince"
                  autoComplete="address-level1"
                  value={addressFormData.stateProvince}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      stateProvince: e.target.value,
                    }))
                  }
                  placeholder="NY"
                  disabled={isAddressFormLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">ZIP/Postal Code</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={addressFormData.postalCode}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      postalCode: e.target.value,
                    }))
                  }
                  placeholder="10001"
                  disabled={isAddressFormLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  value={addressFormData.country}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder="United States"
                  disabled={isAddressFormLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressType">Type</Label>
              <Select
                value={addressFormData.addressType}
                onValueChange={(value) =>
                  setAddressFormData((prev) => ({
                    ...prev,
                    addressType: value,
                  }))
                }
                disabled={isAddressFormLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="billing">💳 Billing</SelectItem>
                  <SelectItem value="shipping">📦 Shipping</SelectItem>
                  <SelectItem value="other">📍 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddAddressDialogOpen(false)}
              disabled={isAddressFormLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAddress}
              disabled={
                isAddressFormLoading ||
                !addressFormData.addressLine1 ||
                !addressFormData.city
              }
            >
              {isAddressFormLoading ? (
                <>
                  <Loading className="mr-2 h-4 w-4" />
                  Adding...
                </>
              ) : (
                <>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Address
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Address Dialog */}
      <Dialog
        open={isEditAddressDialogOpen}
        onOpenChange={setIsEditAddressDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
            <DialogDescription>
              Update the address for {customer.firstName} {customer.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editAddressLine1">Street Address</Label>
              <Input
                id="editAddressLine1"
                name="addressLine1"
                autoComplete="address-line1"
                value={addressFormData.addressLine1}
                onChange={(e) =>
                  setAddressFormData((prev) => ({
                    ...prev,
                    addressLine1: e.target.value,
                  }))
                }
                placeholder="123 Main Street"
                disabled={isAddressFormLoading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddressLine2">
                Address Line 2 (Optional)
              </Label>
              <Input
                id="editAddressLine2"
                name="addressLine2"
                autoComplete="address-line2"
                value={addressFormData.addressLine2}
                onChange={(e) =>
                  setAddressFormData((prev) => ({
                    ...prev,
                    addressLine2: e.target.value,
                  }))
                }
                placeholder="Apt, Suite, Floor (optional)"
                disabled={isAddressFormLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCity">City</Label>
                <Input
                  id="editCity"
                  name="city"
                  autoComplete="address-level2"
                  value={addressFormData.city}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  placeholder="New York"
                  disabled={isAddressFormLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStateProvince">State/Province</Label>
                <Input
                  id="editStateProvince"
                  name="stateProvince"
                  autoComplete="address-level1"
                  value={addressFormData.stateProvince}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      stateProvince: e.target.value,
                    }))
                  }
                  placeholder="NY"
                  disabled={isAddressFormLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPostalCode">ZIP/Postal Code</Label>
                <Input
                  id="editPostalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={addressFormData.postalCode}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      postalCode: e.target.value,
                    }))
                  }
                  placeholder="10001"
                  disabled={isAddressFormLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCountry">Country</Label>
                <Input
                  id="editCountry"
                  name="country"
                  autoComplete="country-name"
                  value={addressFormData.country}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      country: e.target.value,
                    }))
                  }
                  placeholder="United States"
                  disabled={isAddressFormLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAddressType">Type</Label>
              <Select
                value={addressFormData.addressType}
                onValueChange={(value) =>
                  setAddressFormData((prev) => ({
                    ...prev,
                    addressType: value,
                  }))
                }
                disabled={isAddressFormLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">🏠 Home</SelectItem>
                  <SelectItem value="work">💼 Work</SelectItem>
                  <SelectItem value="billing">💳 Billing</SelectItem>
                  <SelectItem value="shipping">📦 Shipping</SelectItem>
                  <SelectItem value="other">📍 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditAddressDialogOpen(false)}
              disabled={isAddressFormLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditAddress}
              disabled={
                isAddressFormLoading ||
                !addressFormData.addressLine1 ||
                !addressFormData.city
              }
            >
              {isAddressFormLoading ? (
                <>
                  <Loading className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                <>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Update Address
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Address Confirmation Dialog */}
      <Dialog
        open={isDeleteAddressDialogOpen}
        onOpenChange={setIsDeleteAddressDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the address{" "}
              <span className="font-medium">
                {addressToDelete?.addressLine1}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteAddressDialogOpen(false)}
              disabled={isAddressFormLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAddress}
              disabled={isAddressFormLoading}
            >
              {isAddressFormLoading ? "Deleting..." : "Delete Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedLayout>
  );
}

