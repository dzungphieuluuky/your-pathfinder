import { useState } from 'react';
import { Upload, FileText, Trash2, CheckCircle, Clock, XCircle, Menu } from 'lucide-react';

interface Document {
  id: number;
  fileName: string;
  category: 'HR' | 'IT' | 'Sales';
  uploadDate: string;
  status: 'Processing' | 'Completed' | 'Failed';
}

interface KnowledgeManagementProps {
  onToggleSidebar?: () => void;
}

const mockDocuments: Document[] = [
  { id: 1, fileName: 'Employee_Handbook_2025.pdf', category: 'HR', uploadDate: '2025-11-20', status: 'Completed' },
  { id: 2, fileName: 'IT_Security_Policy.pdf', category: 'IT', uploadDate: '2025-11-21', status: 'Completed' },
  { id: 3, fileName: 'Sales_Guidelines.docx', category: 'Sales', uploadDate: '2025-11-23', status: 'Processing' },
  { id: 4, fileName: 'Network_Specs.pdf', category: 'IT', uploadDate: '2025-11-24', status: 'Failed' },
];

export function KnowledgeManagement({ onToggleSidebar }: KnowledgeManagementProps) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'HR' | 'IT' | 'Sales'>('HR');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setIsUploading(true);

    // Simulate API call: processUpload(file, category)
    setTimeout(() => {
      const newDoc: Document = {
        id: Date.now(),
        fileName: selectedFile.name,
        category: selectedCategory,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'Processing',
      };

      setDocuments([newDoc, ...documents]);
      setSelectedFile(null);
      setIsUploading(false);

      // Simulate processing completion
      setTimeout(() => {
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === newDoc.id ? { ...doc, status: 'Completed' } : doc
          )
        );
      }, 3000);
    }, 1000);
  };

  const handleDelete = (id: number, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This will remove associated vectors.`)) {
      // Simulate deletion API call
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const configs = {
      Processing: { icon: Clock, color: 'bg-yellow-100 text-yellow-700', text: 'Processing' },
      Completed: { icon: CheckCircle, color: 'bg-green-100 text-green-700', text: 'Completed' },
      Failed: { icon: XCircle, color: 'bg-red-100 text-red-700', text: 'Failed' },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top App Bar - Fixed Height with Proper Layout */}
      <div className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Left Section: Hamburger + Title */}
          <div className="flex items-center gap-6">
            {/* Hamburger Menu Icon */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <h1 className="text-xl text-gray-900">Knowledge Management</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Upload Section Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
            <h2 className="text-lg text-gray-900 mb-6">Upload Document</h2>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* File Picker */}
              <div className="flex-1 w-full sm:w-auto">
                <label className="block text-sm text-gray-700 mb-2">Choose File</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    accept=".pdf,.txt,.doc,.docx,.xlsx"
                  />
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-600 mt-2">Selected: {selectedFile.name}</p>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="w-full sm:w-48">
                <label className="block text-sm text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as 'HR' | 'IT' | 'Sales')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                >
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Document Table Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="text-sm text-gray-900">{doc.fileName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{doc.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{doc.uploadDate}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleDelete(doc.id, doc.fileName)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No documents uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
