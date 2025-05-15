import React, { useEffect } from 'react';
import { useAudio, useSensors } from '../hooks';

interface AudioFeedbackProps {
  type: 'success' | 'warning' | 'error' | 'info';
  message?: string;
  autoPlay?: boolean;
  haptic?: boolean;
  children?: React.ReactNode;
}

export const AudioFeedback: React.FC<AudioFeedbackProps> = ({
  type,
  message,
  autoPlay = true,
  haptic = true,
  children,
}) => {
  const { speak, stopSpeaking } = useAudio();
  const { triggerHapticFeedback } = useSensors();
  
  // Efek untuk memutar umpan balik audio dan haptic
  useEffect(() => {
    if (autoPlay) {
      playFeedback();
    }
    
    return () => {
      stopSpeaking();
    };
  }, [type, message]);
  
  // Fungsi untuk memutar umpan balik
  const playFeedback = () => {
    // Umpan balik haptic
    if (haptic) {
      switch (type) {
        case 'success':
          triggerHapticFeedback('success');
          break;
        case 'warning':
          triggerHapticFeedback('warning');
          break;
        case 'error':
          triggerHapticFeedback('error');
          break;
        case 'info':
          triggerHapticFeedback('light');
          break;
      }
    }
    
    // Umpan balik suara
    if (message) {
      speak(message);
    } else {
      // Pesan default berdasarkan tipe
      switch (type) {
        case 'success':
          speak('Berhasil');
          break;
        case 'warning':
          speak('Perhatian');
          break;
        case 'error':
          speak('Terjadi kesalahan');
          break;
        case 'info':
          speak('Informasi');
          break;
      }
    }
  };
  
  return <>{children}</>;
};
