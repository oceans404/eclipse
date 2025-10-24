'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  onUploadSuccess: (result: any) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  productId: string;
  owner: string;
  title: string;
  description: string;
}

export default function FileUpload({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  productId,
  owner,
  title,
  description,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !productId || !owner || !title) {
      onUploadError('Missing required fields for upload');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('productId', productId);
      formData.append('owner', owner);
      formData.append('title', title);
      formData.append('description', description);

      const response = await fetch('/api/upload-asset', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      onUploadSuccess(result);
      setSelectedFile(null);
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <label
        style={{
          display: 'block',
          fontFamily: 'var(--font-inter)',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#1a1a1a',
          marginBottom: '0.75rem',
        }}
      >
        Upload File *
      </label>
      
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? '#D97757' : '#e0e0e0'}`,
          borderRadius: '4px',
          padding: '2rem',
          textAlign: 'center',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          backgroundColor: dragActive ? '#fafaf8' : disabled ? '#f9f9f9' : 'transparent',
          transition: 'border-color 200ms, background-color 200ms',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileSelect(files[0]);
            }
          }}
          disabled={disabled || uploading}
          accept=".txt,.pdf,.png,.jpg,.jpeg,.json,.md"
        />
        
        {selectedFile ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.3 }}>
              📁
            </div>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#1a1a1a',
              }}
            >
              {selectedFile.name}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#666',
                marginBottom: '1rem',
              }}
            >
              {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
            </p>
            
            {/* Upload Actions */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={uploading || disabled}
                style={{
                  backgroundColor: '#D97757',
                  color: '#fafaf8',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: uploading || disabled ? 'not-allowed' : 'pointer',
                  opacity: uploading || disabled ? 0.6 : 1,
                  transition: 'opacity 200ms',
                }}
              >
                {uploading ? 'Encrypting...' : 'Encrypt & Upload'}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                disabled={uploading || disabled}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  padding: '0.5rem 1rem',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  cursor: uploading || disabled ? 'not-allowed' : 'pointer',
                  opacity: uploading || disabled ? 0.6 : 1,
                  transition: 'opacity 200ms',
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
              📤
            </div>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#1a1a1a',
              }}
            >
              Drop your file here or click to browse
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#666',
              }}
            >
              Supports: Text, PDF, Images, JSON, Markdown
            </p>
          </div>
        )}
      </div>
      
      {uploading && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f3',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '50%',
              height: '1rem',
              width: '1rem',
              borderBottom: '2px solid #D97757',
            }}
          ></div>
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.875rem',
              color: '#666',
            }}
          >
            Encrypting file and storing securely...
          </span>
        </div>
      )}
    </div>
  );
}