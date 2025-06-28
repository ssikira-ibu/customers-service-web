"use client";

import { useParams } from "next/navigation";
import { useCustomer } from "@/lib/hooks/use-customers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconMapPin,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const { customer, isLoading, error } = useCustomer(customerId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Customer Not Found
          </h1>
          <p className="text-muted-foreground">
            The customer you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button onClick={() => router.back()}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phoneNumber;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          <IconArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {customer.firstName} {customer.lastName}
          </h1>
          <p className="text-muted-foreground">Customer Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconUser className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{customer.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Member since {formatDate(customer.createdAt)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Last updated {formatDate(customer.updatedAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <IconPhone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.phones && customer.phones.length > 0 ? (
              customer.phones.map((phone) => (
                <div
                  key={phone.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatPhoneNumber(phone.phoneNumber)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {phone.designation}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No phone numbers added
              </p>
            )}
          </CardContent>
        </Card>

        {/* Addresses */}
        {customer.addresses && customer.addresses.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <IconMapPin className="h-5 w-5" />
                <span>Addresses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{address.addressType}</Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>{address.street}</p>
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {customer.notes && customer.notes.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                {customer.notes.length} note
                {customer.notes.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.notes.map((note) => (
                  <div key={note.id} className="space-y-2">
                    <p className="text-sm">{note.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </p>
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reminders */}
        {customer.reminders && customer.reminders.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>
                {customer.reminders.length} reminder
                {customer.reminders.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {reminder.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          reminder.priority === "high"
                            ? "destructive"
                            : reminder.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {reminder.priority}
                      </Badge>
                      {reminder.dateCompleted && (
                        <Badge variant="outline">Completed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
