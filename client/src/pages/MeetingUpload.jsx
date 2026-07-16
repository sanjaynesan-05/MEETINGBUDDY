import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingAPI } from '../services/api';

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
  return '.' + filename.split('.').pop().toLowerCase();
}

function isAudioFile(filename) {
  const ext = getFileExtension(filename);
  return ['.mp3', '.wav', '.m4a', '.aac'].includes(ext);
}

export default function MeetingUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Validate a selected file
  const validateFile = useCallback((selectedFile) => {
    if (!selectedFile) return 'No file selected.';

    const ext = getFileExtension(selectedFile.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file type (${ext}). Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return `File is too large (${formatFileSize(selectedFile.size)}). Maximum: ${formatFileSize(MAX_FILE_SIZE)}`;
    }

    return null; // Valid
  }, []);

  // Handle file selection (from input or drop)
  const handleFileSelect = useCallback((selectedFile) => {
    setError('');
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);

    // Auto-fill title from filename if empty
    if (!title.trim()) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  }, [title, validateFile]);

  // Drag & Drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [handleFileSelect]);

  // Remove selected file
  const removeFile = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validate = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'Meeting title is required';
    if (!file) errors.file = 'Please select a file to upload';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle upload submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (description.trim()) {
      formData.append('description', description.trim());
    }

    try {
      const res = await meetingAPI.upload(formData, (percent) => {
        setProgress(percent);
      });

      // Navigate to the meeting transcript page
      navigate(`/meetings/${res.data.meeting.id}`);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Upload failed. Please check your connection and try again.';
      setError(message);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 600,
          color: 'var(--md-on-surface)',
          marginBottom: 'var(--space-2)',
        }}>
          Upload Meeting
        </h1>
        <p style={{
          fontSize: 'var(--text-md)',
          color: 'var(--md-on-surface-variant)',
        }}>
          Upload an audio or video recording to generate an AI transcript.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Global Error */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        {!file && !uploading && (
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            id="upload-dropzone"
          >
            <div className="upload-zone-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
            </div>
            <h3>Drag and drop your recording here</h3>
            <p>
              or <span className="browse-link">browse files</span>
            </p>
            <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              Supports MP3, WAV, M4A, MP4, MOV, WebM — up to 100 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.mp4,.mov,.webm"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
              }}
              style={{ display: 'none' }}
              id="upload-file-input"
            />
          </div>
        )}

        {/* Selected File Info */}
        {file && !uploading && (
          <div className="file-info">
            <div className={`file-info-icon ${isAudioFile(file.name) ? 'audio' : 'video'}`}>
              {isAudioFile(file.name) ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              )}
            </div>
            <div className="file-info-details">
              <h4>{file.name}</h4>
              <p>
                {formatFileSize(file.size)} • {getFileExtension(file.name).replace('.', '').toUpperCase()}
              </p>
            </div>
            <button
              type="button"
              className="file-info-remove"
              onClick={removeFile}
              aria-label="Remove file"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div style={{ margin: 'var(--space-6) 0' }}>
            <div className="file-info" style={{ marginBottom: 'var(--space-4)' }}>
              <div className={`file-info-icon ${isAudioFile(file.name) ? 'audio' : 'video'}`}>
                <span className="spinner spinner-sm" />
              </div>
              <div className="file-info-details">
                <h4>{file.name}</h4>
                <p>Uploading...</p>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-text">
              {progress < 100 ? `${progress}% uploaded` : 'Processing...'}
            </p>
          </div>
        )}

        {/* Title & Description */}
        {!uploading && (
          <>
            <div className="form-group" style={{ marginTop: 'var(--space-6)' }}>
              <label className="form-label" htmlFor="upload-title">
                Meeting Title *
              </label>
              <input
                id="upload-title"
                type="text"
                className={`form-input ${fieldErrors.title ? 'error' : ''}`}
                placeholder="e.g., Weekly Sprint Review — July 15"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: '' }));
                }}
              />
              {fieldErrors.title && (
                <div className="form-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {fieldErrors.title}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="upload-description">
                Description (optional)
              </label>
              <textarea
                id="upload-description"
                className="form-input"
                placeholder="Add context about this meeting..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ height: 'auto', padding: 'var(--space-3) var(--space-4)', resize: 'vertical' }}
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        {!uploading && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/meetings')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!file || !title.trim()}
              id="upload-submit"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
              Upload & Transcribe
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
