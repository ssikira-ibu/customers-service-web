"use client"

import { useState } from "react"
import { useCustomerMutations } from "@/lib/hooks"
import { handleAPIError, handleAPISuccess, isValidEmail, isValidPhoneNumber } from "@/lib/utils/api-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconTrash, IconLoader } from "@tabler/icons-react"

interface CustomerFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CustomerForm({ onSuccess, onCancel }: CustomerFormProps) {
  const { createCustomer } = useCustomerMutations()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phones: [{ phoneNumber: "", designation: "mobile" }],
    addresses: [{
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "USA",
      addressType: "home"
    }]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
        throw new Error("First name, last name, and email are required")
      }

      if (!isValidEmail(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Validate phone numbers
      const validPhones = formData.phones.filter(phone => 
        phone.phoneNumber.trim() && isValidPhoneNumber(phone.phoneNumber)
      )

      if (validPhones.length === 0) {
        throw new Error("At least one valid phone number is required")
      }

      // Prepare data for API
      const customerData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phones: validPhones,
        addresses: formData.addresses.filter(addr => 
          addr.street.trim() && addr.city.trim() && addr.state.trim() && addr.postalCode.trim()
        )
      }

      const result = await createCustomer(customerData)
      
      if (result.success) {
        handleAPISuccess("Customer created successfully!")
        onSuccess?.()
      } else {
        handleAPIError(result.error, "Failed to create customer")
      }
    } catch (error) {
      handleAPIError(error, "Failed to create customer")
    } finally {
      setIsLoading(false)
    }
  }

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, { phoneNumber: "", designation: "mobile" }]
    }))
  }

  const removePhone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index)
    }))
  }

  const updatePhone = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      phones: prev.phones.map((phone, i) => 
        i === index ? { ...phone, [field]: value } : phone
      )
    }))
  }

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "USA",
        addressType: "home"
      }]
    }))
  }

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }))
  }

  const updateAddress = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((address, i) => 
        i === index ? { ...address, [field]: value } : address
      )
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Phone Numbers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Phone Numbers</h3>
          <Button type="button" variant="outline" size="sm" onClick={addPhone}>
            <IconPlus className="h-4 w-4 mr-2" />
            Add Phone
          </Button>
        </div>
        {formData.phones.map((phone, index) => (
          <div key={index} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`phone-${index}`}>Phone Number</Label>
              <Input
                id={`phone-${index}`}
                value={phone.phoneNumber}
                onChange={(e) => updatePhone(index, "phoneNumber", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="w-32 space-y-2">
              <Label htmlFor={`designation-${index}`}>Type</Label>
              <Select
                value={phone.designation}
                onValueChange={(value) => updatePhone(index, "designation", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.phones.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removePhone(index)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Addresses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Addresses</h3>
          <Button type="button" variant="outline" size="sm" onClick={addAddress}>
            <IconPlus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>
        {formData.addresses.map((address, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Address {index + 1}</h4>
              {formData.addresses.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeAddress(index)}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`street-${index}`}>Street Address</Label>
                <Input
                  id={`street-${index}`}
                  value={address.street}
                  onChange={(e) => updateAddress(index, "street", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`city-${index}`}>City</Label>
                <Input
                  id={`city-${index}`}
                  value={address.city}
                  onChange={(e) => updateAddress(index, "city", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`state-${index}`}>State</Label>
                <Input
                  id={`state-${index}`}
                  value={address.state}
                  onChange={(e) => updateAddress(index, "state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`postalCode-${index}`}>Postal Code</Label>
                <Input
                  id={`postalCode-${index}`}
                  value={address.postalCode}
                  onChange={(e) => updateAddress(index, "postalCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`addressType-${index}`}>Type</Label>
                <Select
                  value={address.addressType}
                  onValueChange={(value) => updateAddress(index, "addressType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <IconLoader className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Customer"
          )}
        </Button>
      </div>
    </form>
  )
} 