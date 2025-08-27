import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, User, Building, FileText, Crown, DollarSign } from "lucide-react";

interface CommitteeMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  phone: string | null;
  email: string | null;
  unitNumber: string | null;
}

const roleIcons = {
  caretaker: Building,
  secretary: FileText,
  president: Crown,
  treasurer: DollarSign,
  committee_member: User,
};

const roleColors = {
  caretaker: "bg-blue-100 text-blue-800 border-blue-200",
  secretary: "bg-green-100 text-green-800 border-green-200",
  president: "bg-purple-100 text-purple-800 border-purple-200",
  treasurer: "bg-orange-100 text-orange-800 border-orange-200",
  committee_member: "bg-gray-100 text-gray-800 border-gray-200",
};

export function CommitteeMembers() {
  const { data: committeeMembers = [], isLoading } = useQuery<CommitteeMember[]>({
    queryKey: ['/api/committee-members'],
    queryFn: async () => {
      const response = await fetch('/api/committee-members');
      if (!response.ok) throw new Error('Failed to fetch committee members');
      return response.json();
    },
  });

  const keyMembers = committeeMembers.filter(member => 
    ['caretaker', 'secretary', 'president', 'treasurer'].includes(member.role)
  );

  const otherMembers = committeeMembers.filter(member => 
    member.role === 'committee_member'
  );

  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleEmail = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-300 rounded w-1/3"></div>
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 mb-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Committee Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Committee Members with Contact Options */}
          {keyMembers.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Key Contacts</h4>
              <div className="space-y-3">
                {keyMembers.map((member) => {
                  const IconComponent = roleIcons[member.role as keyof typeof roleIcons] || User;
                  const colorClass = roleColors[member.role as keyof typeof roleColors] || roleColors.committee_member;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium text-gray-800">
                              {member.firstName} {member.lastName}
                            </h5>
                            <Badge className={`text-xs ${colorClass}`}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          </div>
                          {member.unitNumber && (
                            <p className="text-sm text-gray-600">{member.unitNumber}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {member.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(member.phone!)}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        )}
                        {member.email && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEmail(member.email!)}
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Committee Members */}
          {otherMembers.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Other Committee Members</h4>
              <div className="space-y-2">
                {otherMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {member.firstName} {member.lastName}
                      </span>
                      {member.phone && (
                        <span className="text-xs text-gray-600">• {member.phone}</span>
                      )}
                    </div>
                    {member.phone && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCall(member.phone!)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Phone className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {committeeMembers.length === 0 && (
            <div className="text-center py-6">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No committee members found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
