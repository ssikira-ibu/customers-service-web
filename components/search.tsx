"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconSearch,
  IconX,
  IconUser,
  IconMail,
  IconPhone,
} from "@tabler/icons-react";
import { useCustomerSearch } from "@/lib/hooks/use-customers";
import { cn } from "@/lib/utils";

interface SearchProps {
  className?: string;
}

export function Search({ className }: SearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { searchResults, isLoading, error } = useCustomerSearch(
    query.length >= 2 ? query : ""
  );

  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Search error:", error);
      console.log(
        "API Base URL:",
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      );
      console.log("Search query:", query);
    }
  }, [error, query]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setQuery("");
        setSelectedIndex(-1);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isExpanded) return;

      switch (event.key) {
        case "Escape":
          setIsExpanded(false);
          setQuery("");
          setSelectedIndex(-1);
          break;
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < Math.min(searchResults.length - 1, 7) ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            handleCustomerClick(searchResults[selectedIndex].id);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, searchResults, selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearchClick = () => {
    setIsExpanded(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleCustomerClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
    setIsExpanded(false);
    setQuery("");
    setSelectedIndex(-1);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Simple phone formatting - you can enhance this
    const cleaned = phoneNumber.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phoneNumber;
  };

  const showResults = isExpanded && query.length >= 2;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {!isExpanded ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSearchClick}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <IconSearch className="h-3.5 w-3.5 mr-1.5" />
          Search customers...
        </Button>
      ) : (
        <div className="relative">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search customers..."
              value={query}
              onChange={handleInputChange}
              className="h-8 pl-9 pr-8 text-sm border-muted bg-muted/50 focus:bg-background transition-colors"
            />
            {isLoading && query.length >= 2 && (
              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            {query && !isLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
              >
                <IconX className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Search Results */}
          {showResults && (
            <Card className="absolute top-full left-0 right-0 mt-1 max-h-96 overflow-hidden border shadow-lg z-50">
              <div className="p-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <p>Error loading search results</p>
                      {process.env.NODE_ENV === "development" && (
                        <p className="text-xs text-destructive">
                          {error.message || "Unknown error"}
                        </p>
                      )}
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No customers found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.slice(0, 8).map((customer, index) => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerClick(customer.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-2 rounded-md transition-colors text-left group",
                          selectedIndex === index
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <IconUser className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {customer.firstName} {customer.lastName}
                            </span>
                            {customer.phones?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {customer.phones.length} phone
                                {customer.phones.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <IconMail className="h-3 w-3" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                            {customer.phones?.[0] && (
                              <div className="flex items-center space-x-1">
                                <IconPhone className="h-3 w-3" />
                                <span className="truncate">
                                  {formatPhoneNumber(
                                    customer.phones[0].phoneNumber
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchResults.length > 8 && (
                      <div className="p-2 text-xs text-muted-foreground text-center border-t">
                        {searchResults.length - 8} more results...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
