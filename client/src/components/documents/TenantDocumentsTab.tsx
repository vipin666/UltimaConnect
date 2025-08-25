import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Eye, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const documentFormSchema = z.object({
  documentType: z.enum(["lease", "id_proof", "income_proof", "photo", "other"]),
  documentName: z.string().min(1, "Document name is required"),
  filePath: z.string().min(1, "File is required"),
  fileSize: z.string().optional(),
  mimeType: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

export function TenantDocumentsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/tenant-documents"],
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentType: "id_proof",
      documentName: "",
      filePath: "",
    },
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const response = await fetch("/api/tenant-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-documents"] });
      form.reset();
      setShowUploadForm(false);
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/tenant-documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update document");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-documents"] });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Get upload URL
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
      });
      const { uploadURL } = await uploadResponse.json();

      // Upload file
      const uploadFileResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
      });

      if (!uploadFileResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Update form with file info
      form.setValue("filePath", uploadURL);
      form.setValue("fileSize", file.size.toString());
      form.setValue("mimeType", file.type);
      form.setValue("documentName", file.name);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: DocumentFormData) => {
    createDocumentMutation.mutate(data);
  };

  const handleReview = (documentId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    updateDocumentMutation.mutate({
      id: documentId,
      updates: { status, adminNotes },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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
      case 'lease':
        return 'Lease Agreement';
      case 'id_proof':
        return 'ID Proof';
      case 'income_proof':
        return 'Income Proof';
      case 'photo':
        return 'Photo ID';
      case 'other':
        return 'Other Document';
      default:
        return 'Document';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Document Management</h2>
          <p className="text-gray-600">Upload and manage tenant documents</p>
        </div>
        {!isAdmin && (
          <Button 
            onClick={() => setShowUploadForm(!showUploadForm)}
            data-testid="button-upload-document"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Upload Form */}
      {showUploadForm && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload required documents for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-document-type">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lease">Lease Agreement</SelectItem>
                          <SelectItem value="id_proof">ID Proof</SelectItem>
                          <SelectItem value="income_proof">Income Proof</SelectItem>
                          <SelectItem value="photo">Photo ID</SelectItem>
                          <SelectItem value="other">Other Document</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter document name"
                          {...field}
                          data-testid="input-document-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload File
                  </label>
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    data-testid="input-file-upload"
                  />
                  {uploading && (
                    <p className="text-sm text-gray-600 mt-1">Uploading...</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createDocumentMutation.isPending || uploading}
                    data-testid="button-submit-document"
                  >
                    {createDocumentMutation.isPending ? "Saving..." : "Save Document"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                    data-testid="button-cancel-upload"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {isAdmin ? "All Documents" : "Your Documents"}
        </h3>
        
        {documents && Array.isArray(documents) && documents.length > 0 ? (
          documents.map((document: any) => (
            <Card key={document.id} data-testid={`card-document-${document.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{document.documentName}</h4>
                        <Badge className={getStatusColor(document.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(document.status)}
                            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                          </div>
                        </Badge>
                      </div>
                      {isAdmin && (
                        <p className="text-sm text-gray-600">
                          Uploaded by: {document.user?.firstName} {document.user?.lastName} (Unit {document.user?.unitNumber})
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Type:</span> {getDocumentTypeLabel(document.documentType)}
                      </p>
                      {document.fileSize && (
                        <p className="text-sm">
                          <span className="font-medium">Size:</span> {Math.round(parseInt(document.fileSize) / 1024)} KB
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Uploaded on {format(new Date(document.uploadDate), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                      {document.adminNotes && (
                        <p className="text-sm">
                          <span className="font-medium">Admin Notes:</span> {document.adminNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* View/Download Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(document.filePath, '_blank')}
                      data-testid={`button-view-${document.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                    {/* Admin Review Actions */}
                    {isAdmin && document.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleReview(document.id, 'approved')}
                          disabled={updateDocumentMutation.isPending}
                          data-testid={`button-approve-${document.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(document.id, 'rejected')}
                          disabled={updateDocumentMutation.isPending}
                          data-testid={`button-reject-${document.id}`}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                <p className="text-gray-600">
                  {isAdmin ? "No documents have been uploaded yet." : "You haven't uploaded any documents yet."}
                </p>
                {!isAdmin && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowUploadForm(true)}
                    data-testid="button-upload-first-document"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}