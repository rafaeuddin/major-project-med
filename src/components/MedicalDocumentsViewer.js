import React, { useState, useEffect } from 'react';
import '../styles/MedicalDocumentsViewer.css';

const MedicalDocumentsViewer = ({ documents, onDocumentDelete }) => {
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Group documents by type for filter counts
  const getDocumentCounts = () => {
    const counts = { all: documents.length };
    
    documents.forEach(doc => {
      const type = doc.documentType || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return counts;
  };

  const documentCounts = getDocumentCounts();

  useEffect(() => {
    if (searchTerm.trim() === '' && activeFilter === 'all') {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(doc => {
      const matchesFilter = activeFilter === 'all' || doc.documentType === activeFilter;
      const matchesSearch = searchTerm.trim() === '' || 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });

    setFilteredDocuments(filtered);
  }, [documents, activeFilter, searchTerm]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDocumentClick = (docId) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
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

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fa-file-image';
      case 'doc':
      case 'docx':
        return 'fa-file-word';
      case 'xls':
      case 'xlsx':
        return 'fa-file-excel';
      default:
        return 'fa-file';
    }
  };

  return (
    <div className="medical-documents-viewer">
      <div className="documents-header">
        <h3>Medical Documents</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="document-search"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>

      <div className="documents-filters">
        <button 
          className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All ({documentCounts.all || 0})
        </button>
        <button 
          className={`filter-button ${activeFilter === 'test_report' ? 'active' : ''}`}
          onClick={() => handleFilterChange('test_report')}
        >
          Test Reports ({documentCounts.test_report || 0})
        </button>
        <button 
          className={`filter-button ${activeFilter === 'xray' ? 'active' : ''}`}
          onClick={() => handleFilterChange('xray')}
        >
          X-Ray/Imaging ({documentCounts.xray || 0})
        </button>
        <button 
          className={`filter-button ${activeFilter === 'prescription' ? 'active' : ''}`}
          onClick={() => handleFilterChange('prescription')}
        >
          Prescriptions ({documentCounts.prescription || 0})
        </button>
        <button 
          className={`filter-button ${activeFilter === 'other' ? 'active' : ''}`}
          onClick={() => handleFilterChange('other')}
        >
          Other ({documentCounts.other || 0})
        </button>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="documents-grid">
          {filteredDocuments.map(doc => (
            <div 
              key={doc.id} 
              className={`document-card ${expandedDoc === doc.id ? 'expanded' : ''}`}
              onClick={() => handleDocumentClick(doc.id)}
            >
              <div className="document-icon">
                <i className={`fas ${getFileIcon(doc.fileType || 'pdf')}`}></i>
              </div>
              <div className="document-info">
                <div className="document-name">{doc.fileName}</div>
                <div className="document-meta">
                  <span className="document-type">{getDocumentTypeLabel(doc.documentType || 'other')}</span>
                  <span className="document-date">{formatDate(doc.uploadDate || doc.createdAt)}</span>
                </div>
                {expandedDoc === doc.id && (
                  <div className="document-details">
                    {doc.description && (
                      <div className="document-description">
                        <strong>Description:</strong> {doc.description}
                      </div>
                    )}
                    {doc.doctor && (
                      <div className="document-doctor">
                        <strong>Doctor:</strong> {doc.doctor}
                      </div>
                    )}
                    <div className="document-actions">
                      <a 
                        href={doc.fileUrl} 
                        className="view-document" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-eye"></i> View
                      </a>
                      <a 
                        href={doc.fileUrl} 
                        className="download-document" 
                        download
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fas fa-download"></i> Download
                      </a>
                      {onDocumentDelete && (
                        <button 
                          className="delete-document" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDocumentDelete(doc.id);
                          }}
                        >
                          <i className="fas fa-trash-alt"></i> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-documents">
          {searchTerm || activeFilter !== 'all' ? (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>No documents match your search or filter criteria.</p>
              <button 
                className="clear-filters"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-file-medical"></i>
              <p>No medical documents uploaded yet.</p>
              <p className="hint">Upload test reports, X-rays, prescriptions, and other medical documents.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalDocumentsViewer; 