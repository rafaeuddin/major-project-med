import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/DocumentUploader.css';

const DocumentUploader = ({ onUploadComplete }) => {
  const { authFetch } = useAuth();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState('test_report');
  const [documentDate, setDocumentDate] = useState('');
  const [description, setDescription] = useState('');

  // Define allowed file types
  const allowedFileTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
  };

  // Maximum file size in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    // Set the document date to today's date by default
    setDocumentDate(new Date().toISOString().split('T')[0]);
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    
    // Validate each file
    for (const file of selectedFiles) {
      // Check file type
      if (!allowedFileTypes[file.type]) {
        setError(`File type not allowed: ${file.name}. Please upload images, PDFs, or office documents.`);
        continue;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }
      
      // Generate a preview URL for images
      const isImage = file.type.startsWith('image/');
      validFiles.push({
        file,
        preview: isImage ? URL.createObjectURL(file) : null,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }
    
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      // Revoke object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    if (!documentDate) {
      setError('Please select a document date');
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      
      // Add metadata
      formData.append('documentType', documentType);
      formData.append('documentDate', documentDate);
      formData.append('description', description);
      
      // Add files
      files.forEach((fileObj, index) => {
        formData.append('documents', fileObj.file);
      });
      
      // In a real application, you would show actual upload progress
      // by using XMLHttpRequest with progress events
      const simulateProgress = () => {
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            let completed = true;
            
            files.forEach((file, index) => {
              const currentProgress = newProgress[index] || 0;
              if (currentProgress < 100) {
                completed = false;
                newProgress[index] = Math.min(currentProgress + Math.random() * 30, 95);
              }
            });
            
            if (completed) {
              clearInterval(interval);
            }
            
            return newProgress;
          });
        }, 500);
        
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      // In a real application, this would be an actual API call
      // Here, we'll simulate the upload with a delay
      const response = await authFetch('/api/patients/documents', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (response.ok) {
        // Set all progress to 100%
        const finalProgress = {};
        files.forEach((file, index) => {
          finalProgress[index] = 100;
        });
        setUploadProgress(finalProgress);
        
        const result = await response.json();
        
        // Call the callback function with the uploaded documents
        if (onUploadComplete) {
          onUploadComplete(result.documents);
        }
        
        // Reset the form after successful upload
        setTimeout(() => {
          setFiles([]);
          setDocumentType('test_report');
          setDescription('');
          setUploadProgress({});
          setIsUploading(false);
        }, 1000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      setError(error.message || 'An error occurred while uploading documents');
      setIsUploading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      'test_report': 'Test Report',
      'xray': 'X-Ray/Imaging',
      'prescription': 'Prescription',
      'medical_certificate': 'Medical Certificate',
      'discharge_summary': 'Discharge Summary',
      'insurance_claim': 'Insurance Claim',
      'other': 'Other Document'
    };
    return labels[type] || 'Document';
  };

  return (
    <div className="document-uploader">
      <h3>Upload Medical Documents</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="upload-form">
        <div className="form-group">
          <label htmlFor="documentType">Document Type</label>
          <select 
            id="documentType" 
            value={documentType} 
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={isUploading}
          >
            <option value="test_report">Test Report</option>
            <option value="xray">X-Ray/Imaging</option>
            <option value="prescription">Prescription</option>
            <option value="medical_certificate">Medical Certificate</option>
            <option value="discharge_summary">Discharge Summary</option>
            <option value="insurance_claim">Insurance Claim</option>
            <option value="other">Other Document</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="documentDate">Document Date</label>
          <input 
            type="date" 
            id="documentDate" 
            value={documentDate} 
            onChange={(e) => setDocumentDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isUploading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter additional details about these documents"
            disabled={isUploading}
          />
        </div>
        
        <div className="file-upload-container">
          <label htmlFor="file-upload" className={`file-upload-label ${isUploading ? 'disabled' : ''}`}>
            <div className="upload-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <div className="upload-text">
              <span className="primary-text">Drag and drop files here</span>
              <span className="secondary-text">or click to browse files</span>
              <span className="file-types">Images, PDFs, Word documents (Max 5MB)</span>
            </div>
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
            />
          </label>
        </div>
        
        {files.length > 0 && (
          <div className="selected-files">
            <h4>Selected Files ({files.length})</h4>
            <ul className="files-list">
              {files.map((fileObj, index) => (
                <li key={index} className="file-item">
                  <div className="file-preview">
                    {fileObj.preview ? (
                      <img src={fileObj.preview} alt="Preview" />
                    ) : (
                      <div className="file-icon">
                        <i className={`fas ${getFileTypeIcon(fileObj.type)}`}></i>
                      </div>
                    )}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{fileObj.name}</div>
                    <div className="file-size">{formatFileSize(fileObj.size)}</div>
                    {isUploading && (
                      <div className="upload-progress">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${uploadProgress[index] || 0}%` }}
                        ></div>
                        <span className="progress-text">{Math.round(uploadProgress[index] || 0)}%</span>
                      </div>
                    )}
                  </div>
                  {!isUploading && (
                    <button 
                      type="button" 
                      className="remove-file"
                      onClick={() => removeFile(index)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="upload-actions">
          <button 
            type="button" 
            className="upload-button"
            onClick={uploadFiles}
            disabled={isUploading || files.length === 0}
          >
            {isUploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine the file icon based on MIME type
const getFileTypeIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) {
    return 'fa-file-image';
  } else if (mimeType === 'application/pdf') {
    return 'fa-file-pdf';
  } else if (mimeType === 'application/msword' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'fa-file-word';
  } else if (mimeType === 'application/vnd.ms-excel' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'fa-file-excel';
  } else {
    return 'fa-file';
  }
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
};

export default DocumentUploader; 