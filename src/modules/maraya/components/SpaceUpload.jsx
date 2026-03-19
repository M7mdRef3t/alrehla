import React, { useState, useRef } from 'react';

/**
 * SpaceUpload - Image upload for room/space analysis.
 */
export default function SpaceUpload({ onUpload, onBack, uiText, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1024;
        let w = img.width;
        let h = img.height;

        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = (h / w) * maxSize;
            w = maxSize;
          } else {
            w = (w / h) * maxSize;
            h = maxSize;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPreview(dataUrl);

        const base64 = dataUrl.split(',')[1];
        onUpload(base64, 'image/jpeg');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;

    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-upload">
      <button type="button" className="space-upload__back" onClick={onBack}>
        {'<-'} {uiText.back}
      </button>

      <h2 className="space-upload__title">{uiText.uploadTitle}</h2>
      <p className="space-upload__desc">{uiText.uploadDesc}</p>

      {!preview ? (
        <label
          className={`space-upload__dropzone ${isDragging ? 'space-upload__dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <span className="space-upload__dropzone-icon">[]</span>
          <span>{uiText.uploadDrop}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            disabled={disabled}
            onChange={(e) => processFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <div className="space-upload__preview">
          <img src={preview} alt="Preview" />
          <p className="space-upload__analyzing">{uiText.analyzingSpace}</p>
        </div>
      )}
    </div>
  );
}
