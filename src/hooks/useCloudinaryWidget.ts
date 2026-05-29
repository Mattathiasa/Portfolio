import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: object,
        callback: (error: unknown, result: CloudinaryResult) => void
      ) => CloudinaryWidget;
    };
  }
}

interface CloudinaryResult {
  event: string;
  info: {
    secure_url: string;
    public_id: string;
    format: string;
    width: number;
    height: number;
  };
}

interface CloudinaryWidget {
  open: () => void;
  close: () => void;
  destroy: () => void;
}

export function useCloudinaryWidget(onSuccess: (url: string) => void) {
  const widgetRef = useRef<CloudinaryWidget | null>(null);
  const cloudName    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const isConfigured = !!cloudName && !!uploadPreset;

  // Load the Cloudinary widget script once
  useEffect(() => {
    if (document.getElementById('cloudinary-widget')) return;
    const script = document.createElement('script');
    script.id  = 'cloudinary-widget';
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const openWidget = useCallback(() => {
    const init = () => {
      if (!window.cloudinary) { setTimeout(init, 300); return; }

      // Re-use existing widget instance
      if (widgetRef.current) { widgetRef.current.open(); return; }

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          sources: ['local', 'url', 'camera'],
          multiple: false,
          resourceType: 'image',

          // Enable the built-in image editor
          cropping: true,
          croppingAspectRatio: 16 / 9,   // matches the project card aspect ratio
          showSkipCropButton: true,
          croppingDefaultSelectionRatio: 0.9,
          showPoweredBy: false,

          // Dark theme to match the portfolio aesthetic
          styles: {
            palette: {
              window:          '#0f0f1a',
              windowBorder:    '#6366f1',
              tabIcon:         '#6366f1',
              menuIcons:       '#d1d5db',
              textDark:        '#1f2937',
              textLight:       '#f9fafb',
              link:            '#6366f1',
              action:          '#6366f1',
              inactiveTabIcon: '#9ca3af',
              error:           '#ef4444',
              inProgress:      '#6366f1',
              complete:        '#10b981',
              sourceBg:        '#111827',
            },
          },
        },
        (error, result) => {
          if (!error && result.event === 'success') {
            onSuccess(result.info.secure_url);
          }
        }
      );

      widgetRef.current.open();
    };

    init();
  }, [cloudName, uploadPreset, onSuccess]);

  // Destroy widget when the hook unmounts so it re-creates with fresh callbacks
  useEffect(() => () => { widgetRef.current?.destroy(); widgetRef.current = null; }, []);

  return { openWidget, isConfigured };
}
