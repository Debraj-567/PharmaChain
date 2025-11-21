import { GoogleGenAI } from "@google/genai";
import { PrescriptionData, NFTStatus } from "../types";

const API_KEY = process.env.API_KEY || '';

export const analyzePrescriptionImage = async (base64Image: string): Promise<PrescriptionData> => {
  if (!API_KEY) {
    console.warn("No API Key found for Gemini. Returning mock data.");
    return mockPrescriptionResponse();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Clean base64 string if needed
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `
      Analyze this medical prescription image. Extract the patient name, prescriber name, and all medications.
      For each medication, normalize the name, extract strength, form, frequency, and duration.
      Provide a confidence score (0-1) for the OCR text and the entity extraction.
      
      Return the data in this exact JSON structure:
      {
        "patient_name": {"value": string, "confidence": number},
        "prescriber": {"value": string, "confidence": number},
        "medications": [
          {
            "raw_text": string,
            "name_normalized": string,
            "strength": string,
            "form": string,
            "frequency": string,
            "duration": string,
            "ocr_confidence": number,
            "entity_confidence": number
          }
        ],
        "warnings": string[]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for extraction accuracy
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    const data = JSON.parse(text);
    const timestamp = new Date().toISOString();
    const prescId = `presc_${Date.now()}`;

    // Hydrate with IDs and default catalog matches (simulated backend logic)
    const hydratedMeds = data.medications.map((med: any, index: number) => ({
      ...med,
      id: `med_${Date.now()}_${index}`,
      catalog_matches: [
        { medicine_id: `cat_${index}`, brand: med.name_normalized + " Brand", score: 0.95 },
        { medicine_id: `cat_${index}_gen`, brand: "Generic " + med.name_normalized, score: 0.92 }
      ]
    }));

    return {
      id: prescId,
      patient_name: data.patient_name,
      prescriber: data.prescriber,
      medications: hydratedMeds,
      warnings: data.warnings || [],
      timestamp: timestamp,
      imageUrl: base64Image,
      nft: {
        tokenId: `NFT-${Math.floor(Math.random() * 1000000)}`,
        contractAddress: '0xRxNFT...Contract',
        owner: `PatientWallet(${data.patient_name.value.split(' ')[0]})`,
        status: NFTStatus.ACTIVE,
        mintTimestamp: timestamp
      }
    };

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw error;
  }
};

// Fallback mock data if API key is missing or request fails (for demo robustness)
const mockPrescriptionResponse = (): Promise<PrescriptionData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const timestamp = new Date().toISOString();
      resolve({
        id: "mock_123",
        patient_name: { value: "John Doe", confidence: 0.98 },
        prescriber: { value: "Dr. Sarah Smith", confidence: 0.99 },
        warnings: ["ocr_low_confidence_med_2"],
        timestamp: timestamp,
        medications: [
          {
            id: "m1",
            raw_text: "Amox 500mg tds x5d",
            name_normalized: "Amoxicillin",
            strength: "500 mg",
            form: "tablet",
            frequency: "TDS",
            duration: "5 days",
            catalog_matches: [{ medicine_id: "c1", brand: "Amoxil", score: 0.98 }],
            ocr_confidence: 0.95,
            entity_confidence: 0.92
          },
          {
            id: "m2",
            raw_text: "Lipitor 20mg 1 daily",
            name_normalized: "Atorvastatin",
            strength: "20 mg",
            form: "tablet",
            frequency: "OD",
            duration: "30 days",
            catalog_matches: [{ medicine_id: "c2", brand: "Lipitor", score: 0.99 }],
            ocr_confidence: 0.65, // Low confidence trigger
            entity_confidence: 0.80
          }
        ],
        nft: {
          tokenId: "NFT-882910",
          contractAddress: "0xRxNFT...Contract",
          owner: "0xPatientWallet...123",
          status: NFTStatus.ACTIVE,
          mintTimestamp: timestamp
        }
      });
    }, 1500);
  });
}
