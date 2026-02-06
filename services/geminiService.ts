
import { GoogleGenAI, Type } from "@google/genai";
import { Voter, District, Candidate } from "../types";

const GOOGLE_SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwHn-94f1tJk-b9c_7qR9jW2_5lP8x3_5vN2k4_6mQ8/exec"; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ExtractionResult {
  isValid: boolean;
  fullName?: string;
  district?: string;
  governorate?: string;
  voterIdNumber?: string;
  familyIdNumber?: string;
  birthYear?: string;
  reason?: string;
  raw_text_all?: string;
  isSalahAlDin: boolean;
  sideDetected?: 'front' | 'back';
}

export const extractVoterData = async (imageBase64: string, mimeType: string, isBackMode: boolean = false): Promise<ExtractionResult> => {
  const prompt = isBackMode ? `
    أنت خبير فحص أمني لـ "ظهر بطاقة الناخب العراقية" حصراً.
    قاعدة أمنية صارمة جداً:
    1. ظهر البطاقة لا يحتوي إطلاقاً على "صورة شخصية" أو "وجه إنسان".
    2. إذا وجدت أي "وجه بشري" في هذه الصورة، فهذا يعني أن المستخدم يصور "وجه البطاقة" وليس الظهر. في هذه الحالة، ارفض العملية فوراً واكتب في السبب: "هذا وجه البطاقة، يرجى تصوير الظهر (الجهة التي لا تحتوي على صورة شخصية)".
    3. ابحث عن رقم بطاقة الناخب (Voter ID) المكون من 8 مراتب، ورقم العائلة، وسنة التولد.
    4. تأكد من أن البطاقة تابعة لمحافظة صلاح الدين.

    JSON Output ONLY:
    {
      "isValid": boolean (false إذا وجد وجه إنسان),
      "isSalahAlDin": boolean,
      "sideDetected": "back",
      "voterIdNumber": "string",
      "familyIdNumber": "string",
      "birthYear": "string",
      "reason": "string"
    }
  ` : `
    أنت خبير فحص "وجه بطاقة الناخب العراقية" (الجهة الأمامية).
    قاعدة أمنية صارمة جداً:
    1. وجه البطاقة يجب أن يحتوي على "صورة شخصية" واضحة لصاحب البطاقة.
    2. إذا لم تجد "وجهاً بشرياً" أو صورة شخصية، ارفض الصورة فوراً واكتب في السبب: "يرجى تصوير وجه البطاقة الذي يحتوي على صورتك الشخصية".
    3. استخرج الاسم الثلاثي أو الرباعي كما هو مكتوب، والمحافظة، والقضاء.
    4. تأكد أن المحافظة هي "صلاح الدين".
    
    JSON Output ONLY:
    {
      "isValid": boolean (false إذا لم يجد وجه إنسان),
      "isSalahAlDin": boolean,
      "sideDetected": "front",
      "fullName": "string",
      "governorate": "صلاح الدين",
      "district": "string",
      "voterIdNumber": "string",
      "reason": "string"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ inlineData: { mimeType, data: imageBase64 } }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            isSalahAlDin: { type: Type.BOOLEAN },
            sideDetected: { type: Type.STRING },
            fullName: { type: Type.STRING },
            district: { type: Type.STRING },
            governorate: { type: Type.STRING },
            voterIdNumber: { type: Type.STRING },
            familyIdNumber: { type: Type.STRING },
            birthYear: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["isValid", "isSalahAlDin", "sideDetected"]
        }
      }
    });

    return JSON.parse(response.text || "{}") as ExtractionResult;
  } catch (error) {
    return { isValid: false, isSalahAlDin: false, reason: "فشل في معالجة الصورة. تأكد من الإضاءة ووضوح الأرقام." };
  }
};

export const sendToGoogleSheets = async (voter: Voter): Promise<{success: boolean; frontUrl?: string; backUrl?: string; error?: string}> => {
  try {
    const response = await fetch(GOOGLE_SHEET_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ ...voter, type: 'voter' }),
      redirect: 'follow'
    });
    const json = await response.json();
    return { success: json.result === 'success', frontUrl: json.frontUrl, backUrl: json.backUrl };
  } catch (e) {
    return { success: false, error: String(e) };
  }
};

export const sendVoteToGoogleSheets = async (candidate: Candidate): Promise<boolean> => {
  try {
    await fetch(GOOGLE_SHEET_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ type: 'vote', candidateId: candidate.id, candidateName: candidate.name, candidateTitle: candidate.title }),
      mode: 'no-cors'
    });
    return true; 
  } catch { return false; }
};

export const generateShammariPoem = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "اكتب بيتاً شعرياً واحداً قوياً جداً في مدح قبيلة شمر ونخوتهم في صلاح الدين، بدون مقدمات.",
    });
    return response.text || "شمر هل الطولات وعز الميادين.";
  } catch { return "عز شمر ما يوفيه الكلام."; }
};

export const getChatResponse = async (userMessage: string, voters: Voter[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أنت مساعد ذكي لحملة "شمر تنتخب" في محافظة صلاح الدين. سؤال المستخدم: ${userMessage}`,
      config: {
        systemInstruction: 'أنت مستشار ذكي فصيح وخبير بشؤون قبيلة شمر في صلاح الدين. أجب بلهجة عراقية محترمة وحماسية.',
      },
    });
    return response.text || "عذراً، لم أستطع معالجة طلبك.";
  } catch (error) {
    return "عذراً، المستشار غير متاح حالياً.";
  }
};
