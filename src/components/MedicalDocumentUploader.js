import React, { useState, useRef } from 'react';
import { FaUpload, FaFilePdf, FaFileImage, FaFileAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/MedicalDocumentUploader.css';

const MedicalDocumentUploader = ({ onUploadComplete }) => {
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [doctor, setDoctor] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'test_report', label: 'Test Report' },
    { value: 'xray', label: 'X-Ray/Imaging' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'medical_certificate', label: 'Medical Certificate' },
    { value: 'discharge_summary', label: 'Discharge Summary' },
    { value: 'insurance_claim', label: 'Insurance Claim' },
    { value: 'other', label: 'Other Document' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;
    
    // Check file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 
                         'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('File type not supported. Please upload PDF, image, or document files.');
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError('');
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetForm = () => {
    setDocumentType('');
    setFile(null);
    setFileName('');
    setDescription('');
    setDoctor('');
    setError('');
    setUploading(false);
    setUploadSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!documentType) {
      setError('Please select a document type');
      return;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setError('');
    setUploading(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('fileName', fileName);
      formData.append('description', description);
      formData.append('doctor', doctor);
      
      // In a real app, you'd make an API call here
      // const response = await api.uploadMedicalDocument(formData);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setUploadSuccess(true);
      
      // Notify parent component
      if (onUploadComplete) {
        const mockResponse = {
          id: `doc-${Date.now()}`,
          documentType,
          fileName,
          description,
          doctor,
          uploadDate: new Date().toISOString(),
          fileUrl: URL.createObjectURL(file),
          fileType: file.name.split('.').pop()
        };
        
        onUploadComplete(mockResponse);
      }
      
      // Reset form after 2 seconds
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  return (
    <div className="medical-document-uploader">
      <h3>Upload Medical Document</h3>
      
      {error && (
        <div className="upload-error">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      
      {uploadSuccess && (
        <div className="upload-success">
          <FaCheckCircle /> Document uploaded successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Document Type*</label>
          <select 
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={uploading}
          >
            <option value="">Select document type</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group file-upload-group">
          <label>File*</label>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            disabled={uploading}
          />
          
          <div 
            className={`file-upload-area ${file ? 'has-file' : ''}`}
            onClick={triggerFileInput}
          >
            {file ? (
              <div className="file-preview">
                <FaFileAlt className={`file-icon ${getFileExtension(fileName)}`} />
                <div className="file-name">{fileName}</div>
                <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <FaUpload />
                <span>Click to select a file</span>
                <span className="upload-hint">PDF, Images, or Documents (Max 10MB)</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>Custom File Name (optional)</label>
          <input 
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter a descriptive name for the file"
            disabled={uploading || !file}
          />
        </div>
        
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this document"
            rows={3}
            disabled={uploading}
          />
        </div>
        
        <div className="form-group">
          <label>Doctor/Provider (optional)</label>
          <input 
            type="text"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            placeholder="Enter doctor or provider name"
            disabled={uploading}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={resetForm}
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="upload-button"
            disabled={uploading || !file}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalDocumentUploader; 