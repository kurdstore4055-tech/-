
import { GoogleGenAI, Type } from "@google/genai";
import { Voter, District, Candidate } from "../types";

/* 
   ===================================================================================
   كود Google Apps Script المحدث (للنسخ واللصق في محرر نصوص Google Sheets):
   
   function doPost(e) {
     const lock = LockService.getScriptLock();
     lock.tryLock(10000);

     try {
       const doc = SpreadsheetApp.getActiveSpreadsheet();
       const data = JSON.parse(e.postData.contents);

       if (data.type === 'vote') {
         const sheet = doc.getSheetByName('Election_Results') || doc.insertSheet('Election_Results');
         if (sheet.getLastRow() === 0) {
           const headers = ['اسم المرشح', 'اللقب/الصفة', 'وقت التصويت', 'معرف المرشح'];
           sheet.appendRow(headers);
         }
         sheet.appendRow([data.candidateName, data.candidateTitle, new Date().toLocaleString('en-GB'), "'" + data.candidateId]);
         return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' })).setMimeType(ContentService.MimeType.JSON);
       } else {
         const sheet = doc.getSheetByName('Voters') || doc.insertSheet('Voters');
         if (sheet.getLastRow() === 0) {
           const headers = ['ID', 'الاسم', 'الهاتف', 'المنطقة', 'العشيرة', 'رقم الناخب', 'رقم العائلة', 'المواليد', 'المصدر', 'تاريخ التسجيل', 'الوجه', 'الظهر', 'ملاحظات', 'Lat', 'Lng'];
           sheet.appendRow(headers);
         }
         let folder = DriveApp.getFoldersByName("Shammari_Voter_Images").hasNext() ? DriveApp.getFoldersByName("Shammari_Voter_Images").next() : DriveApp.createFolder("Shammari_Voter_Images");
         let fUrl = "", bUrl = "";
         if (data.voterCardImage) fUrl = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.voterCardImage.split(',')[1]), 'image/jpeg', data.fullName + '_f.jpg')).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW).getUrl();
         if (data.voterCardBackImage) bUrl = folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.voterCardBackImage.split(',')[1]), 'image/jpeg', data.fullName + '_b.jpg')).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW).getUrl();
         sheet.appendRow(["'" + data.id, data.fullName, "'" + data.phone, data.district, data.subClan, "'" + (data.voterIdNumber || ""), "'" + (data.familyIdNumber || ""), data.birthYear || "", data.source, new Date().toLocaleString('en-GB'), fUrl, bUrl, data.notes || "", data.gpsLat || "", data.gpsLng || ""]);
         return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'frontUrl': fUrl, 'backUrl': bUrl })).setMimeType(ContentService.MimeType.JSON);
       }
     } catch (e) {
       return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
     } finally {
       lock.releaseLock();
     }
   }
   ===================================================================================
*/

const GOOGLE_SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwHn-94f1tJk-b9c_7qR9jW2_5lP8x3_5vN2k4_6mQ8/exec"; 

// Initialize GoogleGenAI using the environment variable API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ExtractionResult {
  isValid: boolean;
  isBackValid?: boolean;
  hasStationNumber?: boolean;
  hasBarcode?: boolean;
  fullName?: string;
  district?: string;
  governorate?: string;
  voterIdNumber?: string;
  familyIdNumber?: string;
  birthYear?: string;
  reason?: string;
  raw_text_all?: string;
}

export function validateGovernorate(rawText: string) {
  const text = rawText.toLowerCase().replace(/\s+/g, '');
  const blacklist = ["baghdad", "بغداد", "nineveh", "نينوى", "mosul", "الموصل", "basra", "البصرة", "erbil", "أربيل", "dhiqar", "ذي قار", "maysan", "ميسان", "najaf", "النجف", "karbala", "كربلاء", "anbar", "الأنبار", "babel", "بابل", "wasit", "واسط", "kirkuk", "كركوك", "dohuk", "دهوك", "sulaymaniyah", "السليمانية", "muthanna", "المثنى", "qadisiyyah", "القادسية", "diyala", "ديالى"];

  for (const bad of blacklist) {
    if (text.includes(bad.replace(/\s+/g, ''))) {
      return { isValid: false, reason: `تم رفض البطاقة: تابعة لمحافظة أخرى (${bad}). النظام مخصص لصلاح الدين فقط.` };
    }
  }

  const validKeywords = ["صلاحالدين", "salahal-din", "salahaldin", "saladin", "salahuddin"];
  const hasValidKeyword = validKeywords.some(keyword => text.includes(keyword));

  if (!hasValidKeyword) {
    return { isValid: false, reason: "هذا النظام مخصص لمحافظة صلاح الدين فقط. لم يتم العثور على اسم المحافظة بوضوح." };
  }

  return { isValid: true, reason: "بطاقة صالحة" };
}

// Extract voter data from ID card images using Gemini 3
export const extractVoterData = async (frontBase64: string, mimeType: string, backBase64?: string): Promise<ExtractionResult> => {
  const prompt = `
    You are a professional OCR system for Iraqi Voter Cards.
    
    CRITICAL IDENTIFICATION:
    1. Examine Image 1 (Front). It is an Iraqi Voter Card if it contains features like: "جمهورية العراق", "بطاقة الناخب", "المفوضية العليا المستقلة للانتخبابات", the IHEC logo, or the specific text layout of Iraqi ID cards.
    2. If it is NOT an Iraqi Voter Card, set "isValid" to false and provide a reason.
    3. If it IS a voter card, try to extract all visible fields even if blurry.
    4. If Image 2 (Back) is provided, verify it has a barcode/QR and "رقم المحطة".

    OUTPUT JSON:
    {
      "isValid": boolean,
      "isBackValid": boolean,
      "fullName": "Name only",
      "governorate": "EXACT Text",
      "district": "EXACT Text",
      "voterIdNumber": "Digits",
      "familyIdNumber": "Digits",
      "birthYear": "YYYY",
      "reason": "Clear explanation in Arabic if invalid",
      "raw_text_all": "Dump of all text found"
    }
  `;

  const parts = [
    { inlineData: { mimeType, data: frontBase64 } },
    ...(backBase64 ? [{ inlineData: { mimeType, data: backBase64 } }] : []),
    { text: prompt }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            isBackValid: { type: Type.BOOLEAN },
            fullName: { type: Type.STRING },
            district: { type: Type.STRING },
            governorate: { type: Type.STRING },
            voterIdNumber: { type: Type.STRING },
            familyIdNumber: { type: Type.STRING },
            birthYear: { type: Type.STRING },
            reason: { type: Type.STRING },
            raw_text_all: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}") as ExtractionResult;
    
    if (!result.isValid) {
      throw new Error(result.reason || "الصورة لا تبدو كبطاقة ناخب عراقية واضحة.");
    }

    const validation = validateGovernorate(result.raw_text_all || "");
    if (!validation.isValid) throw new Error(validation.reason);

    // Clean data
    if (result.fullName) result.fullName = result.fullName.replace(/[0-9]/g, '').trim();
    if (result.voterIdNumber) result.voterIdNumber = result.voterIdNumber.replace(/\D/g, '');
    
    return result;
  } catch (error: any) {
    console.error("Extraction error:", error);
    return { 
      isValid: false, 
      reason: error.message || "فشل في معالجة الصورة، يرجى التأكد من الإضاءة وتصوير وجه البطاقة بوضوح." 
    };
  }
};

// Send voter data to Google Sheets
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

// Send vote data to Google Sheets
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

// Generate a poem in praise of Shammari tribe
export const generateShammariPoem = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "اكتب بيتاً شعرياً واحداً قوياً في مدح قبيلة شمر ونخوتهم في صلاح الدين، بدون مقدمات.",
    });
    return response.text || "شمر هل الطولات وعز الميادين.";
  } catch { return "عز شمر ما يوفيه الكلام."; }
};

// Analyze voter demographics using Gemini 3
export const analyzeVoterDemographics = async (voters: Voter[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `حلل هذه البيانات الانتخابية باختصار وقوة: ${JSON.stringify(voters.length)} ناخب مسجل. شجع على انتخاب القوي الأمين.`,
    });
    return response.text || "البيانات تشير إلى وعي انتخابي كبير.";
  } catch { return "عذراً، المستشار الذكي غير متاح حالياً."; }
};

// Get response from campaign chatbot using Gemini 3
export const getChatResponse = async (userMessage: string, voters: Voter[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أنت مساعد ذكي لحملة "شمر تنتخب" في محافظة صلاح الدين. 
      بيانات حالية: عدد الناخبين المسجلين هو ${voters.length}.
      سؤال المستخدم: ${userMessage}`,
      config: {
        systemInstruction: 'أنت مستشار ذكي فصيح وخبير بشؤون قبيلة شمر في صلاح الدين. أجب بلهجة عراقية محترمة وحماسية. ساعد المستخدمين في فهم كيفية التسجيل وأهمية المشاركة الانتخابية.',
      },
    });
    return response.text || "عذراً، لم أستطع معالجة طلبك.";
  } catch (error) {
    console.error("Chat error:", error);
    return "عذراً، المستشار غير متاح حالياً.";
  }
};
