import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, Eye, Trash2 } from "lucide-react";

interface FlatDocumentsPanelProps {
  flatNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Document {
  id: string;
  flatNumber: string;
  documentType: string;
  documentName: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export function FlatDocumentsPanel({ flatNumber, open, onOpenChange }: FlatDocumentsPanelProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [filePath, setFilePath] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch documents for this flat
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ['/api/flat-documents', flatNumber],
    queryFn: async () => {
      const response = await fetch(`/api/flat-documents?flatNumber=${flatNumber}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
    enabled: open,
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: {
      flatNumber: string;
      documentType: string;
      documentName: string;
      filePath: string;
    }) => {
      const response = await fetch('/api/flat-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(documentData),
      });
      if (!response.ok) throw new Error('Failed to upload document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flat-documents', flatNumber] });
      setShowUploadForm(false);
      setDocumentType('');
      setDocumentName('');
      setFilePath('');
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  // Update document status mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/flat-documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flat-documents', flatNumber] });
      toast({
        title: "Success",
        description: "Document status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/flat-documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flat-documents', flatNumber] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (!documentType || !documentName || !filePath) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({
      flatNumber,
      documentType,
      documentName,
      filePath,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'rental_agreement':
        return 'Rental Agreement';
      case 'id_proof':
        return 'ID Proof';
      case 'address_proof':
        return 'Address Proof';
      case 'income_proof':
        return 'Income Proof';
      case 'police_verification':
        return 'Police Verification';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents for Flat {flatNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload New Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showUploadForm ? (
                <Button onClick={() => setShowUploadForm(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="documentType">Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rental_agreement">Rental Agreement</SelectItem>
                          <SelectItem value="id_proof">ID Proof</SelectItem>
                          <SelectItem value="address_proof">Address Proof</SelectItem>
                          <SelectItem value="income_proof">Income Proof</SelectItem>
                          <SelectItem value="police_verification">Police Verification</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="documentName">Document Name</Label>
                      <Input
                        id="documentName"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        placeholder="Enter document name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Upload File</Label>
                    <ObjectUploader
                      onUploadComplete={(url) => setFilePath(url)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      maxSizeMB={10}
                    >
                      <Button variant="outline" type="button">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </Button>
                    </ObjectUploader>
                    {filePath && (
                      <p className="text-sm text-green-600 mt-1">File uploaded successfully</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploadDocumentMutation.isPending || !documentType || !documentName || !filePath}
                    >
                      {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUploadForm(false);
                        setDocumentType('');
                        setDocumentName('');
                        setFilePath('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No documents uploaded for this flat</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{doc.documentName}</p>
                          <p className="text-sm text-gray-600">
                            {getDocumentTypeLabel(doc.documentType)} • Uploaded by {doc.uploadedBy}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.filePath, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.filePath;
                            link.download = doc.documentName;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDocumentMutation.mutate(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
