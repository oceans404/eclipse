'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreatorProfile } from '@/lib/db';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  currentProfile?: CreatorProfile | null;
  onProfileUpdated: (profile: CreatorProfile) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  address,
  currentProfile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        description: currentProfile.description || '',
        image_url: currentProfile.image_url || '',
      });
      setPreviewUrl(currentProfile.image_url || '');
    } else {
      setFormData({
        name: '',
        description: '',
        image_url: '',
      });
      setPreviewUrl('');
    }
    setSelectedFile(null);
  }, [currentProfile, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let imageUrl = formData.image_url;

      // Upload image if a new file was selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('address', address);

        const uploadResponse = await fetch('/api/upload-profile-image', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }

        const { url } = await uploadResponse.json();
        imageUrl = url;
      }

      const response = await fetch(`/api/creator/${address}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#fafaf8',
          border: '1px solid #e0e0e0',
          padding: '2rem',
          maxWidth: '32rem',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 300,
              letterSpacing: '-0.01em',
              color: '#1a1a1a',
            }}
          >
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              color: '#666',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#1a1a1a',
                marginBottom: '0.5rem',
              }}
            >
              Display Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f3',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                transition: 'border-color 200ms',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#D97757')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
              placeholder="Enter your display name"
            />
          </div>

          {/* Description Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#1a1a1a',
                marginBottom: '0.5rem',
              }}
            >
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f3',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                resize: 'vertical',
                transition: 'border-color 200ms',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#D97757')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
              placeholder="Tell others about yourself and your expertise"
            />
          </div>

          {/* Profile Image Field */}
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#1a1a1a',
                marginBottom: '0.5rem',
              }}
            >
              Profile Image
            </label>
            
            {/* Image Preview */}
            {previewUrl && (
              <div
                style={{
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  style={{
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #e0e0e0',
                  }}
                />
                <div style={{ flex: 1 }}>
                  {selectedFile ? (
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        color: '#1a1a1a',
                      }}
                    >
                      New image selected: {selectedFile.name}
                    </p>
                  ) : (
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        color: '#666',
                      }}
                    >
                      Current profile image
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f3',
                color: '#1a1a1a',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 200ms',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#D97757';
                e.currentTarget.style.backgroundColor = '#fafaf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
                e.currentTarget.style.backgroundColor = '#f5f5f3';
              }}
            >
              {previewUrl ? 'Change Profile Image' : 'Upload Profile Image'}
            </button>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#666',
                marginTop: '0.5rem',
              }}
            >
              Optional: Upload a profile picture (max 5MB, images only)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e0e0e0',
                backgroundColor: 'transparent',
                color: '#666',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms',
                opacity: isLoading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.borderColor = '#999';
                  e.currentTarget.style.color = '#1a1a1a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.color = '#666';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
              className="btn-primary"
              style={{
                opacity: isLoading || !formData.name.trim() || !formData.description.trim() ? 0.5 : 1,
                cursor: isLoading || !formData.name.trim() || !formData.description.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}