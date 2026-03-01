"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BedDouble,
  Users,
  DollarSign,
  Building,
  Wifi,
  Car,
  Coffee,
  Tv,
  Bath,
  Wind,
  UserPlus,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Room } from "@/hooks/use-available-rooms";

interface RoomCardProps {
  room: Room;
  onAssign: () => void;
}

const getStatusInfo = (room: Room) => {
  if (room.status === "occupied" || room.isCurrentlyOccupied) {
    return {
      color: "bg-red-500",
      text: "Occupied",
      textColor: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      guest: room.currentGuest,
      checkOut: room.nextCheckOut
    };
  }
  if (room.status === "reserved") {
    return {
      color: "bg-yellow-500",
      text: "Reserved",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50 border-yellow-200"
    };
  }
  if (room.status === "maintenance") {
    return {
      color: "bg-gray-500",
      text: "Maintenance",
      textColor: "text-gray-600",
      bgColor: "bg-gray-50 border-gray-200"
    };
  }
  if (room.status === "cleaning") {
    return {
      color: "bg-blue-500",
      text: "Cleaning",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200"
    };
  }
  return {
    color: "bg-green-500",
    text: "Available",
    textColor: "text-green-600",
    bgColor: "bg-green-50 border-green-200"
  };
};

export default function RoomCard({ room, onAssign }: RoomCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "standard": return "bg-blue-100 text-blue-800";
      case "deluxe": return "bg-purple-100 text-purple-800";
      case "executive_suite": return "bg-gold/20 text-gold";
      case "presidential_suite": return "bg-emerald-100 text-emerald-800";
      case "family": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "free wifi": return <Wifi className="w-4 h-4" />;
      case "air conditioning": return <Wind className="w-4 h-4" />;
      case "private bathroom": return <Bath className="w-4 h-4" />;
      case "room service": return <Coffee className="w-4 h-4" />;
      case "tv": return <Tv className="w-4 h-4" />;
      case "parking": return <Car className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  const statusInfo = getStatusInfo(room);
  const isAvailable = room.status === "available" && !room.isCurrentlyOccupied;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${!isAvailable ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Room Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-charcoal">Room {room.number}</h3>
              <Badge className={getTypeColor(room.type)}>
                {room.type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald">{formatCurrency(room.price)}</p>
              <p className="text-sm text-text-muted-custom">per night</p>
            </div>
          </div>

          {/* Room Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <span>Floor {room.floor}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>Max {room.maxOccupancy}</span>
            </div>
          </div>

          {/* Amenities Preview */}
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 4).map((amenity, index) => (
              <div key={index} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                {getAmenityIcon(amenity)}
                <span>{amenity}</span>
              </div>
            ))}
            {room.amenities.length > 4 && (
              <span className="text-xs text-gray-500">+{room.amenities.length - 4} more</span>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${statusInfo.color} rounded-full`}></div>
              <span className={`text-sm ${statusInfo.textColor} font-medium`}>{statusInfo.text}</span>
            </div>
            {room.totalBookings > 0 && (
              <span className="text-xs text-gray-500">{room.totalBookings} bookings</span>
            )}
          </div>

          {/* Current Guest Info */}
          {statusInfo.guest && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
              <p className="font-medium text-red-800">Current Guest: {statusInfo.guest}</p>
              {statusInfo.checkOut && (
                <p className="text-red-600">Check-out: {new Date(statusInfo.checkOut).toLocaleDateString()}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Room {room.number} Details</DialogTitle>
                  <DialogDescription>
                    {room.type.replace('_', ' ')} room on floor {room.floor}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Room Image Placeholder */}
                  <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <BedDouble className="w-12 h-12 text-gray-400" />
                  </div>

                  {/* Room Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Price</p>
                      <p className="text-lg font-bold text-emerald">{formatCurrency(room.price)}/night</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Capacity</p>
                      <p className="text-lg font-bold">{room.maxOccupancy} guests</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Floor</p>
                      <p className="text-lg font-bold">{room.floor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Branch</p>
                      <p className="text-sm">{room.branch.name}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {room.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                      <p className="text-sm text-gray-700">{room.description}</p>
                    </div>
                  )}

                  {/* All Amenities */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Amenities</p>
                    <div className="grid grid-cols-2 gap-2">
                      {room.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className={`p-3 ${statusInfo.bgColor} rounded-md`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${statusInfo.color} rounded-full`}></div>
                      <span className={`font-medium ${statusInfo.textColor.replace('text-', 'text-').replace('-600', '-800')}`}>
                        {statusInfo.text} {isAvailable ? 'for Assignment' : ''}
                      </span>
                    </div>
                    {statusInfo.guest && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Current Guest: {statusInfo.guest}</p>
                        {statusInfo.checkOut && (
                          <p>Check-out: {new Date(statusInfo.checkOut).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    {room.totalBookings > 0 && (
                      <p className="text-sm mt-1">
                        Total bookings: {room.totalBookings}
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={onAssign} 
              size="sm" 
              className="flex-1"
              disabled={!isAvailable}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isAvailable ? 'Assign' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}