import { GoogleGenAI, Type } from "@google/genai";
import { Voter, District } from "../types";

/* 
   ===================================================================================
   كود Google Apps Script المحسن (للنسخ واللصق في محرر نصوص Google Sheets):
   
   function doPost(e) {
     const lock = LockService.getScriptLock();
     lock.tryLock(10000);

     try {
       const doc = SpreadsheetApp.getActiveSpreadsheet();
       const sheet = doc.getSheetByName('Voters') || doc.insertSheet('Voters');
       
       // إعداد العناوين (Header) إذا لم تكن موجودة - تنسيق جدول احترافي
       if (sheet.getLastRow() === 0) {
         const headers = [
           'المعرف (ID)', 'الاسم الثلاثي', 'رقم الهاتف', 'المنطقة', 'العشيرة', 
           'رقم الناخب', 'رقم العائلة', 'المواليد', 'المصدر', 'تاريخ التسجيل', 
           'رابط وجه البطاقة', 'رابط ظهر البطاقة', 'ملاحظات'
         ];
         const headerRange = sheet.getRange(1, 1, 1, headers.length);
         headerRange.setValues([headers])
              .setFontWeight('bold')
              .setBackground('#8B0000') // لون شمر الأحمر الغامق
              .setFontColor('#FFFFFF')
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle')
              .setBorder(true, true, true, true, true, true);
         
         // تجميد الصف الأول
         sheet.setFrozenRows(1);
       }

       const data = JSON.parse(e.postData.contents);
       
       // حفظ الصور في مجلد Drive
       let frontImgUrl = "";
       let backImgUrl = "";
       
       // ابحث عن مجلد باسم Shammari_Voter_Images أو أنشئه
       const folders = DriveApp.getFoldersByName("Shammari_Voter_Images");
       let folder;
       if (folders.hasNext()) {
         folder = folders.next();
       } else {
         folder = DriveApp.createFolder("Shammari_Voter_Images");
       }

       if (data.voterCardImage && data.voterCardImage.includes(',')) {
         const blob = Utilities.newBlob(Utilities.base64Decode(data.voterCardImage.split(',')[1]), 'image/jpeg', data.fullName + '_front.jpg');
         const file = folder.createFile(blob);
         file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // جعل الصورة قابلة للعرض
         frontImgUrl = file.getUrl();
       }
       
       if (data.voterCardBackImage && data.voterCardBackImage.includes(',')) {
         const blob = Utilities.newBlob(Utilities.base64Decode(data.voterCardBackImage.split(',')[1]), 'image/jpeg', data.fullName + '_back.jpg');
         const file = folder.createFile(blob);
         file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
         backImgUrl = file.getUrl();
       }

       // ترتيب البيانات كصف جديد
       const newRow = [
         "'" + data.id,
         data.fullName,
         "'" + data.phone,
         data.district,
         data.subClan,
         "'" + (data.voterIdNumber || ""), // إضافة ' لمنع تحويله لرقم علمي
         "'" + (data.familyIdNumber || ""),
         data.birthYear || "",
         data.source,
         new Date().toLocaleString('en-GB'),
         frontImgUrl,
         backImgUrl,
         data.notes || ""
       ];

       sheet.appendRow(newRow);
       
       // تنسيق الصف الجديد (حدود + لون متبادل)
       const lastRow = sheet.getLastRow();
       const range = sheet.getRange(lastRow, 1, 1, newRow.length);
       range.setHorizontalAlignment('right')
            .setVerticalAlignment('middle')
            .setWrap(true)
            .setBorder(true, true, true, true, true, true); // حدود كاملة للخلايا

       if (lastRow % 2 == 0) {
         range.setBackground('#f9fafb');
       } else {
         range.setBackground('#ffffff');
       }

       // IMPORTANT: Return the Generated URLs back to the App
       return ContentService.createTextOutput(JSON.stringify({ 
         'result': 'success', 
         'row': lastRow,
         'frontUrl': frontImgUrl,
         'backUrl': backImgUrl
       })).setMimeType(ContentService.MimeType.JSON);

     } catch (e) {
       return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
     } finally {
       lock.releaseLock();
     }
   }
   ===================================================================================
*/

// ضع رابط تطبيق الويب (Deployment URL) هنا بعد النشر
const GOOGLE_SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwHn-94f1tJk-b9c_7qR9jW2_5lP8x3_5vN2k4_6mQ8/exec"; 

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface ExtractionResult {
  isValid: boolean;
  isBackValid?: boolean;
  hasStationNumber?: boolean; // هل يوجد رقم محطة؟
  hasBarcode?: boolean; // هل يوجد باركود؟
  fullName?: string;
  district?: string;
  governorate?: string;
  voterIdNumber?: string;
  familyIdNumber?: string;
  birthYear?: string;
  reason?: string;
  raw_text_all?: string;
}

// دالة التحقق الصارمة من المحافظة (Kill Switch Logic)
export function validateGovernorate(rawText: string) {
  // نحول النص إلى lowercase ونزيل المسافات لتسهيل الفحص الدقيق
  const text = rawText.toLowerCase().replace(/\s+/g, '');

  // قائمة سوداء شاملة بجميع المحافظات العراقية الأخرى بكل الصيغ المحتملة
  const blacklist = [
    "baghdad", "بغداد", "bagdad", "bagdhad",
    "nineveh", "نينوى", "mosul", "الموصل", "nineva", "ninawa",
    "basra", "البصرة", "basrah",
    "erbil", "أربيل", "irbil", "hawler",
    "dhiqar", "ذي قار", "nasiriyah", "الناصرية", "thiqar",
    "maysan", "ميسان", "amara", "العمارة", "missan",
    "najaf", "النجف",
    "karbala", "كربلاء", "kerbala",
    "anbar", "الأنبار", "ramadi", "الرمادي", "fallujah", "الفلوجة",
    "babel", "بابل", "hilla", "الحلة", "babylon",
    "wasit", "واسط", "kut", "الكوت",
    "kirkuk", "كركوك", "ta'mim", "التأميم",
    "dohuk", "دهوك", "duhok",
    "sulaymaniyah", "السليمانية", "sulaymaniya", "slemani",
    "halabja", "حلبجة",
    "muthanna", "المثنى", "samawah", "السماوة",
    "qadisiyyah", "القادسية", "diwaniyah", "الديوانية", "qadisiya",
    "diyala", "ديالى", "baqubah", "بعقوبة"
  ];

  // 1. Blacklist Check
  for (const bad of blacklist) {
    if (text.includes(bad.replace(/\s+/g, ''))) {
      return {
        isValid: false,
        reason: `تم رفض البطاقة: تم العثور على اسم محافظة أخرى (${bad}). التطبيق مخصص لصلاح الدين فقط.`
      };
    }
  }

  // 2. Whitelist Check
  const validKeywords = [
    "صلاحالدين",
    "salahal-din",
    "salahaldin",
    "saladin",
    "salahuddin"
  ];

  const hasValidKeyword = validKeywords.some(keyword => text.includes(keyword));

  if (!hasValidKeyword) {
    return {
      isValid: false,
      reason: "هذا البرنامج مخصص لصلاح الدين فقط (لم يتم العثور على اسم المحافظة 'صلاح الدين' في البطاقة)"
    };
  }

  return {
    isValid: true,
    reason: "بطاقة صالحة من محافظة صلاح الدين"
  };
}

export const validateVoterCardImage = async (base64Data: string, mimeType: string): Promise<boolean> => {
  const result = await extractVoterData(base64Data, mimeType);
  return result.isValid;
};

export const extractVoterData = async (frontBase64: string, mimeType: string, backBase64?: string): Promise<ExtractionResult> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided. Returning mock data for development.");
    return { 
      isValid: true, 
      fullName: "تجربة محاكاة", 
      district: "تكريت",
      governorate: "صلاح الدين",
      voterIdNumber: "12345678",
      familyIdNumber: "98765",
      birthYear: "1990"
    };
  }

  const prompt = `
    You are a professional OCR system for Iraqi Voter Cards.
    
    TASK:
    1. Analyze Image 1 (Front Face) and Image 2 (Back Face, if provided).
    2. Extract ALL text into 'raw_text_all' from both images.
    3. CHECK GOVERNORATE: Look for "Baghdad", "Nineveh", "Salah al-Din", etc., on BOTH faces.
    
    STRICT IMAGE VALIDATION:
    - Image 1 MUST be the Front Face of an Iraqi Voter Card.
    
    - Image 2 (Back Face) RULES (CRITICAL):
      1. It MUST be the Back Face of an Iraqi Voter Card.
      2. It MUST contain the text "رقم المحطة" (Station Number).
      3. It MUST contain a visual Barcode or QR code.
      4. If 'رقم المحطة' is NOT readable, set 'hasStationNumber' to false.
      5. If Barcode is NOT visible, set 'hasBarcode' to false.
    
    OUTPUT JSON:
    {
      "isValid": boolean,
      "isBackValid": boolean,
      "hasStationNumber": boolean, // True ONLY if 'رقم المحطة' is found
      "hasBarcode": boolean, // True ONLY if Barcode/QR is visible
      "fullName": "The name on the card (remove titles)",
      "governorate": "The EXACT text written for governorate",
      "district": "The EXACT text written for district",
      "voterIdNumber": "digits only",
      "familyIdNumber": "digits only",
      "birthYear": "year only",
      "reason": "If invalid, explain why",
      "raw_text_all": "DUMP OF ALL TEXT FOUND ON BOTH CARDS"
    }
  `;

  const parts: { inlineData?: { mimeType: string; data: string }; text?: string }[] = [
    { inlineData: { mimeType: mimeType, data: frontBase64 } },
  ];

  if (backBase64) {
    parts.push({ inlineData: { mimeType: mimeType, data: backBase64 } });
  }
  
  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            isBackValid: { type: Type.BOOLEAN },
            hasStationNumber: { type: Type.BOOLEAN },
            hasBarcode: { type: Type.BOOLEAN },
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

    const jsonText = response.text?.trim();
    if (!jsonText) return { isValid: false, reason: "Empty response from AI" };

    const result = JSON.parse(jsonText) as ExtractionResult;
    
    // --- ULTIMATE STRICT CHECK ---
    
    // 1. Check if AI itself rejected the FRONT card
    if (result.isValid === false) {
       throw new Error(result.reason || "البطاقة غير واضحة أو غير صالحة.");
    }

    // 2. Clean up the extracted Raw Text
    const rawTextForValidation = result.raw_text_all || "";

    // 3. Perform Strict Governorate Validation (Kill Switch)
    const validation = validateGovernorate(rawTextForValidation);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // 4. EXTRA BACK FACE VALIDATION
    if (backBase64) {
        // A. Check General Validity
        if (result.isBackValid === false) {
            throw new Error("الصورة المرفقة لظهر البطاقة غير صحيحة. يجب أن تكون صورة لظهر بطاقة الناخب.");
        }

        // B. Check for Station Number (رقم المحطة)
        // We look for the boolean flag OR the text explicitly to be safe
        const hasStationText = rawTextForValidation.includes("محطة") || rawTextForValidation.includes("رقم المحطة") || rawTextForValidation.includes("Station");
        
        if (result.hasStationNumber === false && !hasStationText) {
            throw new Error("رفض البطاقة: ظهر البطاقة يجب أن يحتوي على 'رقم المحطة' (Station Number) بشكل مقروء.");
        }

        // C. Check for Barcode
        if (result.hasBarcode === false) {
            throw new Error("رفض البطاقة: ظهر البطاقة يجب أن يحتوي على باركود (Barcode) واضح.");
        }

        // D. Check for Voter ID
        if (!result.voterIdNumber || result.voterIdNumber.length < 6) {
            throw new Error("فشل في قراءة ظهر البطاقة: يجب أن تكون الصورة واضحة وتحتوي على (رقم الناخب).");
        }
    }

    // If we survived all checks:
    // Cleanup names
    if (result.fullName) {
      result.fullName = result.fullName
        .replace(/صلاح الدين/g, '')
        .replace(/Salah al-Din/gi, '')
        .replace(/محافظة/g, '')
        .replace(/Governorate/gi, '')
        .replace(/الاسم[:\.]?/g, '')
        .replace(/Name[:\.]?/gi, '')
        .replace(/[0-9]/g, '') // Remove numbers from name
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (result.voterIdNumber) result.voterIdNumber = result.voterIdNumber.replace(/\D/g, '');
    if (result.familyIdNumber) result.familyIdNumber = result.familyIdNumber.replace(/\D/g, '');
    if (result.birthYear) result.birthYear = result.birthYear.replace(/\D/g, '').slice(0, 4);

    // Explicitly set governorate to Salah al-Din since we validated it
    result.governorate = "صلاح الدين";

    return result;

  } catch (error: any) {
    // Gracefully handle expected validation errors
    const knownErrors = [
      "هذا البرنامج مخصص لصلاح الدين فقط",
      "تم رفض البطاقة",
      "فشل في قراءة ظهر البطاقة",
      "الصورة الخلفية",
      "الصورة المرفقة لظهر البطاقة",
      "رقم المحطة",
      "باركود"
    ];

    const isKnownError = knownErrors.some(msg => error.message && error.message.includes(msg));
    if (isKnownError) {
        return { isValid: false, reason: error.message };
    }

    // Log only unexpected errors
    console.error("Extraction error:", error);

    let friendlyMessage = error.message || "حدث خطأ في قراءة البطاقة، يرجى المحاولة مرة أخرى.";
    const errorString = JSON.stringify(error) + String(error);

    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("quota")) {
       friendlyMessage = "عذراً، الخدمة مشغولة جداً حالياً (تجاوز حد الاستخدام المجاني). يرجى الانتظار دقيقة والمحاولة مرة أخرى.";
    }

    return { 
      isValid: false, 
      reason: friendlyMessage
    };
  }
};

interface SheetResponse {
  success: boolean;
  frontUrl?: string;
  backUrl?: string;
  error?: string;
}

export const sendToGoogleSheets = async (voter: Voter): Promise<SheetResponse> => {
  if (!GOOGLE_SHEET_SCRIPT_URL || GOOGLE_SHEET_SCRIPT_URL.length < 10) {
    console.warn("Google Sheet Script URL is not configured correctly.");
    return { success: false, error: "Script URL missing" };
  }

  try {
    const response = await fetch(GOOGLE_SHEET_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(voter),
    });
    
    if (response.ok) {
       const json = await response.json();
       return {
         success: json.result === 'success',
         frontUrl: json.frontUrl,
         backUrl: json.backUrl
       };
    } else {
       const errorText = await response.text();
       console.error("Google Sheets server error:", response.status, errorText);
       return { success: false, error: `Server error: ${response.status}` };
    }
  } catch (error) {
    console.error("Failed to send to Google Sheets:", error);
    return { success: false, error: String(error) };
  }
};

export const generateShammariPoem = async (): Promise<string> => {
  if (!process.env.API_KEY) return "أنا لست شاعراً بدون مفتاحي (API Key Missing).";

  const prompt = `
    أنت "شاعر قبيلة شمر".
    المطلوب: اكتب بيتاً واحداً أو بيتين من الشعر الشعبي أو الفصيح القوي جداً.
    الموضوع: مدح قبيلة شمر، شجاعتهم، نخوتهم، وتاريخهم في صلاح الدين.
    الهدف: تحفيز الهمم ورفع المعنويات.
    
    الشروط:
    - قصير جداً (بيت أو بيتين).
    - لغة قوية ومؤثرة.
    - بدون أي مقدمات أو شرح، فقط الشعر.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "عذراً، خانني التعبير.";
  } catch (error) {
    console.error("Poetry Gen Error:", error);
    return "عز شمر ما يوفيه الكلام... (خطأ في الاتصال)";
  }
};

export const analyzeVoterDemographics = async (voters: Voter[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "يرجى تكوين مفتاح API الخاص بـ Gemini للحصول على التحليل.";
  }

  if (voters.length === 0) {
    return "لا توجد بيانات كافية للتحليل حتى الآن. يرجى إضافة ناخبين.";
  }

  const summary = {
    total: voters.length,
    districts: voters.reduce((acc, v) => {
      acc[v.district] = (acc[v.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    clans: voters.reduce((acc, v) => {
      acc[v.subClan] = (acc[v.subClan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const prompt = `
    أنت مستشار انتخابي ذكي لقبيلة شمر في محافظة صلاح الدين.
    
    توجيهات الشخصية والنبرة:
    1. يجب أن تكون نصائحك مبنية على **القوة، الشجاعة، والأمانة**.
    2. ذكرهم دائماً بأن "تاريخ شمر بناه الرجال الشجعان، والضعيف لا يمكن أن يغير شيئاً".
    3. حث الناخبين على اختيار المرشح القوي الأمين، ورفض الضعفاء والمترددين.
    
    لديك البيانات التالية عن الناخبين المسجلين:
    ${JSON.stringify(summary, null, 2)}

    المطلوب:
    1. تحليل التوزيع الجغرافي للناخبين.
    2. اقتراح استراتيجية انتخابية (3 نقاط) تركز على الحشد واختيار الأقوياء.
    3. كتابة رسالة نصية قصيرة (SMS) حماسية جداً ونارية تدعو لانتخاب "الرجل القوي الأمين" وتذكر بتاريخ القبيلة.

    أجب باللغة العربية وتنسيق Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "تعذر إنشاء التحليل.";
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const errorString = JSON.stringify(error) + String(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
       return "عذراً، المستشار الذكي مشغول حالياً (تجاوز الحد اليومي للخدمة). يرجى المحاولة لاحقاً.";
    }
    return "حدث خطأ أثناء الاتصال بالمستشار الذكي.";
  }
};

export const getChatResponse = async (
  message: string, 
  voters: Voter[]
): Promise<string> => {
  if (!process.env.API_KEY) return "عذراً، أنا في وضع التجربة ولا يمكنني الاتصال بالخادم.";

  const stats = {
    total: voters.length,
    topDistrict: Object.entries(voters.reduce((acc, v) => {
      acc[v.district] = (acc[v.district] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)).sort((a,b) => b[1] - a[1])[0]?.[0] || "غير محدد"
  };

  const prompt = `
    أنت "المساعد الذكي لحملة شمر تنتخب". 
    شخصيتك: حكيم، قوي، وتتحدث بنخوة وحماس عن تاريخ شمر.
    
    مبدأك الثابت: "تاريخ شمر بناه الرجال الشجعان، والضعيف لا يصنع التغيير".
    شجع دائماً على انتخاب القوي الشجاع الأمين.
    
    معلومات السياق:
    - عدد المسجلين الحالي: ${stats.total}
    - أكثر منطقة نشاطاً: ${stats.topDistrict}
    - الهدف: جمع ناخبي شمر في صلاح الدين.

    سؤال المستخدم: ${message}

    أجب باختصار وفائدة. إذا سأل عن كيفية التسجيل، اشرح له خطوات ملء الاستمارة ورفع صورة البطاقة.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "لم أفهم السؤال، ممكن توضح أكثر؟";
  } catch (error: any) {
    const errorString = JSON.stringify(error) + String(error);
    if (errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED")) {
       return "النظام مشغول حالياً (ضغط عالي على الخادم)، يرجى المحاولة لاحقاً.";
    }
    return "حدث خطأ بسيط، حاول مرة ثانية.";
  }
};