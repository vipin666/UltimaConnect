import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Waves, Circle, PartyPopper, Car, Dumbbell, Clock, MapPin, Info } from "lucide-react";
import type { Amenity } from "@shared/schema";

interface BookingCardProps {
  amenity: Amenity;
  onBook: (amenityId: string, amenityType: string) => void;
}

export function BookingCard({ amenity, onBook }: BookingCardProps) {
  const getAmenityIcon = (type: string) => {
    switch (type) {
      case 'swimming_pool':
        return <Waves className="text-primary w-6 h-6" />;
      case 'pool_table':
        return <Circle className="text-secondary w-6 h-6" />;
      case 'party_hall':
        return <PartyPopper className="text-purple-600 w-6 h-6" />;
      case 'guest_parking':
        return <Car className="text-accent w-6 h-6" />;
      case 'gym':
        return <Dumbbell className="text-green-600 w-6 h-6" />;
      default:
        return <Circle className="text-gray-600 w-6 h-6" />;
    }
  };

  const getAmenityIconBg = (type: string) => {
    switch (type) {
      case 'swimming_pool':
        return 'bg-blue-100';
      case 'pool_table':
        return 'bg-green-100';
      case 'party_hall':
        return 'bg-purple-100';
      case 'guest_parking':
        return 'bg-orange-100';
      case 'gym':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getAmenityDetails = (type: string) => {
    switch (type) {
      case 'swimming_pool':
        return {
          hours: "6 AM - 10 PM",
          info: "Available slots: Morning (6-10 AM), Evening (6-10 PM)"
        };
      case 'pool_table':
        return {
          hours: "24/7",
          info: "1-hour slots available"
        };
      case 'party_hall':
        return {
          hours: "Events Only",
          info: "Full day booking required"
        };
      case 'guest_parking':
        return {
          hours: "24/7",
          info: "Maximum 24 hours per booking"
        };
      case 'gym':
        return {
          hours: "5 AM - 11 PM",
          info: "2-hour slots available"
        };
      default:
        return {
          hours: "Contact admin",
          info: "Please contact admin for details"
        };
    }
  };

  const details = getAmenityDetails(amenity.type);

  return (
    <Card className="shadow-material border border-gray-200" data-testid={`amenity-${amenity.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-12 h-12 ${getAmenityIconBg(amenity.type)} rounded-lg flex items-center justify-center`}>
            {getAmenityIcon(amenity.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800" data-testid={`text-name-${amenity.id}`}>
              {amenity.name}
            </h3>
            <p className="text-gray-500 text-sm flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {amenity.location} • <Clock className="w-3 h-3 ml-1 mr-1" /> {details.hours}
            </p>
          </div>
          <Button 
            onClick={() => onBook(amenity.id, amenity.type)}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            data-testid={`button-book-${amenity.id}`}
          >
            Book Now
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 flex items-start">
          <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
          <span>{details.info}</span>
        </div>
        
        {amenity.description && (
          <p className="text-sm text-gray-600 mt-2">{amenity.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
