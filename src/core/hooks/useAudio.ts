import { useState, useEffect, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// Tipe data untuk status audio
export interface AudioStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
  volume: number;
  rate: number;
}

// Tipe data untuk opsi audio
export interface AudioOptions {
  volume?: number;
  rate?: number;
  shouldCorrectPitch?: boolean;
  progressUpdateIntervalMillis?: number;
}

// Tipe data untuk opsi speech
export interface SpeechOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
  volume?: number;
}

export const useAudio = () => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AudioStatus>({
    isLoaded: false,
    isPlaying: false,
    isBuffering: false,
    positionMillis: 0,
    durationMillis: 0,
    didJustFinish: false,
    volume: 1.0,
    rate: 1.0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Ref untuk menyimpan URI audio yang sedang dimuat
  const currentUri = useRef<string | null>(null);

  // Fungsi untuk memuat audio
  const loadAudio = async (
    uri: string,
    options: AudioOptions = {}
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Jika sudah ada sound yang dimuat, unload dulu
      if (sound) {
        await sound.unloadAsync();
      }

      // Muat audio baru
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        {
          volume: options.volume ?? 1.0,
          rate: options.rate ?? 1.0,
          shouldCorrectPitch: options.shouldCorrectPitch ?? true,
          progressUpdateIntervalMillis: options.progressUpdateIntervalMillis ?? 500,
        },
        (status) => {
          if (status.isLoaded) {
            setStatus({
              isLoaded: status.isLoaded,
              isPlaying: status.isPlaying,
              isBuffering: status.isBuffering,
              positionMillis: status.positionMillis,
              durationMillis: status.durationMillis,
              didJustFinish: status.didJustFinish,
              volume: status.volume,
              rate: status.rate,
            });
          }
        }
      );

      setSound(newSound);
      currentUri.current = uri;

      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat memuat audio');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memutar audio
  const playAudio = async (
    uri?: string,
    options?: AudioOptions
  ): Promise<boolean> => {
    try {
      // Jika URI diberikan dan berbeda dengan yang sedang dimuat, muat dulu
      if (uri && uri !== currentUri.current) {
        const loaded = await loadAudio(uri, options);
        if (!loaded) return false;
      }

      // Jika tidak ada sound yang dimuat, return false
      if (!sound) return false;

      // Putar audio
      await sound.playAsync();

      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat memutar audio');
      return false;
    }
  };

  // Fungsi untuk menjeda audio
  const pauseAudio = async (): Promise<boolean> => {
    try {
      if (!sound) return false;

      await sound.pauseAsync();
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menjeda audio');
      return false;
    }
  };

  // Fungsi untuk menghentikan audio
  const stopAudio = async (): Promise<boolean> => {
    try {
      if (!sound) return false;

      await sound.stopAsync();
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menghentikan audio');
      return false;
    }
  };

  // Fungsi untuk mengatur posisi audio
  const seekAudio = async (positionMillis: number): Promise<boolean> => {
    try {
      if (!sound) return false;

      await sound.setPositionAsync(positionMillis);
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat mengatur posisi audio');
      return false;
    }
  };

  // Fungsi untuk mengatur volume audio
  const setVolume = async (volume: number): Promise<boolean> => {
    try {
      if (!sound) return false;

      await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat mengatur volume audio');
      return false;
    }
  };

  // Fungsi untuk mengatur kecepatan audio
  const setRate = async (rate: number): Promise<boolean> => {
    try {
      if (!sound) return false;

      await sound.setRateAsync(rate, true);
      return true;
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat mengatur kecepatan audio');
      return false;
    }
  };

  // Fungsi untuk text-to-speech
  const speak = async (
    text: string,
    options: SpeechOptions = {}
  ): Promise<boolean> => {
    try {
      // Jika sedang berbicara, hentikan dulu
      if (isSpeaking) {
        Speech.stop();
      }

      setIsSpeaking(true);

      // Opsi default untuk bahasa Indonesia
      const defaultOptions: SpeechOptions = {
        language: 'id-ID',
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
      };

      // Gabungkan opsi default dengan opsi yang diberikan
      const mergedOptions = {
        ...defaultOptions,
        ...options,
      };

      // Mulai berbicara
      Speech.speak(text, {
        ...mergedOptions,
        onDone: () => {
          setIsSpeaking(false);
        },
        onError: (error) => {
          setIsSpeaking(false);
          setError(error instanceof Error ? error.message : String(error));
        },
      });

      return true;
    } catch (error: any) {
      setIsSpeaking(false);
      setError(error.message || 'Terjadi kesalahan saat text-to-speech');
      return false;
    }
  };

  // Fungsi untuk menghentikan text-to-speech
  const stopSpeaking = (): void => {
    Speech.stop();
    setIsSpeaking(false);
  };

  // Fungsi untuk mendapatkan daftar suara yang tersedia
  const getAvailableVoices = async (): Promise<Speech.Voice[]> => {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat mendapatkan daftar suara');
      return [];
    }
  };

  // Unload audio saat komponen unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return {
    sound,
    status,
    isLoading,
    error,
    isSpeaking,
    loadAudio,
    playAudio,
    pauseAudio,
    stopAudio,
    seekAudio,
    setVolume,
    setRate,
    speak,
    stopSpeaking,
    getAvailableVoices,
  };
};
