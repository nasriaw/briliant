import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Diagnosis } from "../types";

// Validate API Key presence
if (!process.env.API_KEY) {
  console.error("API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const diagnosisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    nama: { type: Type.STRING, description: "Nama umum hama atau penyakit, atau 'Tanaman Sehat' jika tidak ada masalah." },
    namaLatin: { type: Type.STRING, description: "Nama ilmiah hama/penyakit jika ada." },
    isHama: { type: Type.BOOLEAN, description: "True jika terdeteksi hama atau penyakit, False jika sehat." },
    gejala: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Daftar gejala visual yang terlihat pada tanaman."
    },
    solusi: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Daftar cara pembasmian atau pengobatan. PRIORITASKAN metode alami/organik/nabati."
    },
    pencegahan: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Langkah-langkah pencegahan di masa depan."
    },
    tingkatBahaya: {
      type: Type.STRING,
      enum: ["Rendah", "Sedang", "Tinggi"],
      description: "Tingkat keparahan serangan."
    }
  },
  required: ["nama", "isHama", "gejala", "solusi", "tingkatBahaya"]
};

export const analyzeRiceImage = async (base64Image: string): Promise<Diagnosis> => {
  try {
    const model = "gemini-3-pro-preview"; // Explicitly requested model

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity from canvas/camera
              data: base64Image
            }
          },
          {
            text: `Kamu adalah ahli pertanian (Briliant AI). Analisis gambar tanaman ini. 
            Identifikasi apakah tanaman terkena hama, penyakit, atau sehat. 
            
            Jika ada masalah, berikan solusi penanganan dengan ketentuan berikut:
            1. UTAMAKAN SOLUSI RAMAH LINGKUNGAN & NON-PESTISIDA (misalnya: pestisida nabati, agens hayati, musuh alami, atau cara mekanis).
            2. Berikan contoh bahan alami yang mudah didapat petani (seperti daun sirsak, tembakau, gadung, dll) untuk membuat pestisida nabati beserta cara singkat pembuatannya.
            3. HINDARI menyarankan pestisida kimia sintetik kecuali serangan sudah sangat kritis (sebagai pilihan terakhir).
            
            Berikan jawaban dalam Bahasa Indonesia yang praktis dan mudah dimengerti petani.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: diagnosisSchema,
        systemInstruction: "Anda adalah asisten cerdas Briliant untuk petani. Misi Anda adalah membantu petani mengatasi hama dengan cara yang aman bagi ekosistem sawah dan lingkungan."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as Diagnosis;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};