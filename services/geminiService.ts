
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

// Initialize the Google GenAI client using the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async analyzeSchedule(data: AppData) {
    // Fix: The BusRequest type uses an 'assignments' array. 
    // We filter for requests that have no assignments yet.
    const pendingRequests = data.requests.filter(r => !r.assignments || r.assignments.length === 0);

    const prompt = `
      Atue como um coordenador de transportes do Município de Soure. 
      Analise os seguintes dados e forneça um breve resumo (max 3 parágrafos) sobre conflitos de agenda, 
      sugestões de atribuição de motoristas e autocarros.

      Motoristas: ${JSON.stringify(data.drivers)}
      Autocarros: ${JSON.stringify(data.buses)}
      Pedidos Pendentes: ${JSON.stringify(pendingRequests)}
      Indisponibilidades: ${JSON.stringify(data.unavailabilities)}

      Seja direto e prático. Responda em Português de Portugal.
    `;

    try {
      // Generate content using the recommended model for text tasks.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      // Access the .text property directly as per the latest SDK guidelines.
      return response.text;
    } catch (error) {
      console.error("Erro ao chamar Gemini:", error);
      return "Não foi possível realizar a análise inteligente no momento.";
    }
  }
};
