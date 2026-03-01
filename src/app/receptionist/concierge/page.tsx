"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Plane, MapPin, Utensils } from "lucide-react";
import { toast } from "sonner";

export default function ConciergePage() {
  const services = [
    { icon: Car, title: "Transportation", description: "Airport transfers, taxi booking", color: "text-blue-500", bgColor: "bg-blue-50" },
    { icon: MapPin, title: "Tours & Activities", description: "City tours, local attractions", color: "text-green-500", bgColor: "bg-green-50" },
    { icon: Utensils, title: "Restaurant Reservations", description: "Book tables at top restaurants", color: "text-purple-500", bgColor: "bg-purple-50" },
    { icon: Plane, title: "Travel Assistance", description: "Flight booking, visa support", color: "text-orange-500", bgColor: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Concierge Services</h1>
        <p className="text-muted-foreground">Assist guests with bookings and arrangements</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, idx) => (
          <Card key={idx} className="p-6">
            <div className={`h-12 w-12 rounded-lg ${service.bgColor} flex items-center justify-center mb-4`}>
              <service.icon className={`h-6 w-6 ${service.color}`} />
            </div>
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
            <Button className="w-full" onClick={() => toast.success(`${service.title} requested`)}>
              Request Service
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
