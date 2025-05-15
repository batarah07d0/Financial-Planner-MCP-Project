import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { theme } from '../theme';
import { useAudio } from '../hooks';
import { Ionicons } from '@expo/vector-icons';

interface VoiceAssistantProps {
  visible: boolean;
  onClose: () => void;
  onCommand?: (command: string) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  visible,
  onClose,
  onCommand,
}) => {
  const [animatedValue] = useState(new Animated.Value(0));
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('Halo, ada yang bisa saya bantu?');

  const { speak, stopSpeaking, isSpeaking } = useAudio();

  // Animasi untuk modal
  useEffect(() => {
    if (visible) {
      // Reset animasi
      animatedValue.setValue(0);

      // Mulai animasi
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      // Ucapkan pesan selamat datang
      speak(assistantMessage);
    } else {
      // Hentikan ucapan jika modal ditutup
      stopSpeaking();
    }
  }, [visible]);

  // Animasi untuk scale dan opacity
  const scale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Fungsi untuk memulai mendengarkan
  const startListening = () => {
    setIsListening(true);
    setTranscript('');

    // Simulasi mendengarkan (dalam implementasi nyata, gunakan Speech Recognition API)
    setTimeout(() => {
      setIsListening(false);

      // Simulasi hasil transkripsi
      const simulatedTranscripts = [
        'Tambahkan transaksi baru',
        'Berapa saldo saya saat ini',
        'Tampilkan anggaran bulan ini',
        'Berapa pengeluaran minggu ini',
      ];

      const randomTranscript = simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)];
      setTranscript(randomTranscript);

      // Proses perintah
      processCommand(randomTranscript);
    }, 2000);
  };

  // Fungsi untuk memproses perintah
  const processCommand = (command: string) => {
    let response = '';

    // Analisis perintah (dalam implementasi nyata, gunakan NLP)
    if (command.includes('tambah') && command.includes('transaksi')) {
      response = 'Baik, saya akan membuka form tambah transaksi';
      if (onCommand) onCommand('add_transaction');
    } else if (command.includes('saldo')) {
      response = 'Saldo Anda saat ini adalah Rp 2.500.000';
      if (onCommand) onCommand('check_balance');
    } else if (command.includes('anggaran')) {
      response = 'Menampilkan anggaran bulan ini';
      if (onCommand) onCommand('show_budget');
    } else if (command.includes('pengeluaran')) {
      response = 'Total pengeluaran minggu ini adalah Rp 750.000';
      if (onCommand) onCommand('show_expenses');
    } else {
      response = 'Maaf, saya tidak mengerti perintah tersebut';
    }

    // Tampilkan dan ucapkan respons
    setAssistantMessage(response);
    speak(response);
  };

  // Fungsi untuk menghentikan mendengarkan
  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.assistantContainer,
            {
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          <View style={styles.header}>
            <Typography variant="h5" align="center" color={theme.colors.white}>
              Asisten Suara
            </Typography>
          </View>

          <View style={styles.content}>
            <View style={styles.messageContainer}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color={theme.colors.primary[500]}
                style={styles.messageIcon}
              />
              <Typography variant="body1" style={styles.message}>
                {assistantMessage}
              </Typography>
            </View>

            {transcript ? (
              <View style={styles.transcriptContainer}>
                <Typography variant="body2" color={theme.colors.neutral[600]}>
                  Anda mengatakan:
                </Typography>
                <Typography variant="body1" style={styles.transcript}>
                  "{transcript}"
                </Typography>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
              ]}
              onPress={isListening ? stopListening : startListening}
              disabled={isSpeaking}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={32}
                color={isListening ? theme.colors.white : theme.colors.primary[500]}
              />
            </TouchableOpacity>

            <Typography
              variant="body2"
              align="center"
              color={theme.colors.neutral[600]}
              style={styles.hint}
            >
              {isListening
                ? 'Mendengarkan...'
                : isSpeaking
                  ? 'Berbicara...'
                  : 'Ketuk mikrofon untuk berbicara'}
            </Typography>
          </View>

          <View style={styles.footer}>
            <Button
              title="Tutup"
              variant="outline"
              onPress={onClose}
              fullWidth
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: theme.spacing.layout.md,
  },
  assistantContainer: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[500],
  },
  content: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    width: '100%',
  },
  messageIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  message: {
    flex: 1,
  },
  transcriptContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  transcript: {
    fontStyle: 'italic',
    marginTop: theme.spacing.xs,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
    ...theme.elevation.sm,
  },
  micButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
  hint: {
    marginBottom: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
});
