import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import * as FileSystem from 'expo-file-system';

export interface OCRResult {
  text: string;
  confidence: number;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface ParsedReceipt {
  date?: string;
  total?: number;
  merchant?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
}

export const useOCR = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk melakukan OCR pada gambar
  const recognizeText = async (
    imageUri: string,
    language: string = 'ind'
  ): Promise<OCRResult | null> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Buat worker untuk OCR
      const worker = await createWorker();

      // Baca file gambar sebagai base64
      let imageData = imageUri;
      if (imageUri.startsWith('file://')) {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        imageData = `data:image/jpeg;base64,${base64}`;
      }

      // Lakukan OCR
      const result = await worker.recognize(imageData);

      // Terminasi worker
      await worker.terminate();

      // Format hasil OCR dengan tipe any untuk menghindari error TypeScript
      const resultData: any = result.data;

      const formattedResult: OCRResult = {
        text: resultData.text || '',
        confidence: resultData.confidence || 0,
        lines: [],
      };

      // Coba ekstrak data lines atau words dari hasil OCR
      if (resultData.lines && Array.isArray(resultData.lines)) {
        formattedResult.lines = resultData.lines.map((line: any) => ({
          text: line.text || '',
          confidence: line.confidence || 0,
          bbox: line.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
        }));
      } else if (resultData.words && Array.isArray(resultData.words)) {
        formattedResult.lines = resultData.words.map((word: any) => ({
          text: word.text || '',
          confidence: word.confidence || 0,
          bbox: word.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
        }));
      }

      return formattedResult;
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat melakukan OCR');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memproses hasil OCR dan mengekstrak informasi dari struk
  const parseReceipt = (ocrResult: OCRResult): ParsedReceipt => {
    const result: ParsedReceipt = {};

    if (!ocrResult.text) {
      return result;
    }

    // Ekstrak tanggal
    const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/g;
    const dateMatches = ocrResult.text.match(dateRegex);
    if (dateMatches && dateMatches.length > 0) {
      result.date = dateMatches[0];
    }

    // Ekstrak total
    const totalRegex = /total\s*:?\s*rp\.?\s*([\d\.,]+)/i;
    const totalMatch = ocrResult.text.match(totalRegex);
    if (totalMatch && totalMatch.length > 1) {
      const totalStr = totalMatch[1].replace(/[^\d]/g, '');
      result.total = parseInt(totalStr, 10);
    }

    // Ekstrak nama merchant (biasanya di awal struk)
    const lines = ocrResult.text.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 0) {
      result.merchant = lines[0].trim();
    }

    // Ekstrak item (ini lebih kompleks dan memerlukan analisis lebih lanjut)
    const items: Array<{ name: string; price: number; quantity?: number }> = [];

    // Cari baris yang memiliki pola: nama item diikuti dengan harga
    const itemRegex = /(.+)\s+(\d+)\s*x\s*rp\.?\s*([\d\.,]+)/i;
    const itemRegexSimple = /(.+)\s+rp\.?\s*([\d\.,]+)/i;

    for (let i = 1; i < lines.length - 1; i++) {
      const line = lines[i].trim();

      // Coba pola dengan kuantitas
      const itemMatch = line.match(itemRegex);
      if (itemMatch && itemMatch.length > 3) {
        const name = itemMatch[1].trim();
        const quantity = parseInt(itemMatch[2], 10);
        const priceStr = itemMatch[3].replace(/[^\d]/g, '');
        const price = parseInt(priceStr, 10);

        if (name && price) {
          items.push({ name, price, quantity });
          continue;
        }
      }

      // Coba pola tanpa kuantitas
      const itemMatchSimple = line.match(itemRegexSimple);
      if (itemMatchSimple && itemMatchSimple.length > 2) {
        const name = itemMatchSimple[1].trim();
        const priceStr = itemMatchSimple[2].replace(/[^\d]/g, '');
        const price = parseInt(priceStr, 10);

        if (name && price) {
          items.push({ name, price });
        }
      }
    }

    if (items.length > 0) {
      result.items = items;
    }

    return result;
  };

  return {
    isLoading,
    progress,
    error,
    recognizeText,
    parseReceipt,
  };
};
