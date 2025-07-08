import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, FileText, Users, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CSVImportProps {
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  created: number;
  failed: number;
  skipped: number;
  errors: string[];
  users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    status: 'created' | 'failed' | 'skipped';
    error?: string;
  }>;
}

export default function CSVImport({ onImportComplete }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const { tenantId } = useRole();

  const downloadTemplate = () => {
    // Create CSV template content
    const csvContent = [
      'email,firstName,lastName',
      'john.doe@example.com,John,Doe',
      'jane.smith@example.com,Jane,Smith',
      'bob.wilson@example.com,Bob,Wilson'
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Fill in the CSV template with your staff details and import it back.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const processCSV = async (csvContent: string): Promise<Array<{ email: string; firstName: string; lastName: string }>> => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate headers
    const requiredHeaders = ['email', 'firstName', 'lastName'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length === headers.length && values[0]) { // Skip empty lines
        const user = {
          email: values[headers.indexOf('email')],
          firstName: values[headers.indexOf('firstName')],
          lastName: values[headers.indexOf('lastName')]
        };
        
        // Basic validation
        if (!user.email || !user.firstName || !user.lastName) {
          throw new Error(`Invalid data in row ${i + 1}: missing required fields`);
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
          throw new Error(`Invalid email format in row ${i + 1}: ${user.email}`);
        }
        
        users.push(user);
      }
    }

    if (users.length === 0) {
      throw new Error('No valid user data found in CSV file');
    }

    return users;
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await file.text();
      setImportProgress(20);

      // Parse CSV
      const users = await processCSV(fileContent);
      setImportProgress(40);

      // Import users
      const result = await apiRequest("POST", "/api/staff/bulk-import", { 
        users, 
        tenantId 
      });
      setImportProgress(80);

      setImportResult(result);
      setImportProgress(100);

      toast({
        title: "Import Complete",
        description: `Created ${result.created} users, skipped ${result.skipped} existing users, ${result.failed} failed.`,
      });

      // Trigger parent refresh
      onImportComplete();

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import users from CSV.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Template Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download CSV Template
          </CardTitle>
          <CardDescription>
            Download the template file, fill it with your staff details, and import it back.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            The template includes columns for email, first name, and last name.
          </p>
        </CardContent>
      </Card>

      {/* Import File Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Users from CSV
          </CardTitle>
          <CardDescription>
            Select your completed CSV file to import users. Existing users will be skipped, only new users will be created and receive activation emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={importProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processing users... {importProgress}%
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Importing Users...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Import Users
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.created}
                </div>
                <div className="text-sm text-green-700">Users Created</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {importResult.skipped}
                </div>
                <div className="text-sm text-blue-700">Existing Users</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failed}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Errors:</Label>
                <div className="bg-red-50 p-3 rounded-lg">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {importResult.created > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Activation emails have been sent to all successfully created users.
                  They will need to check their email and set their passwords to complete registration.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}