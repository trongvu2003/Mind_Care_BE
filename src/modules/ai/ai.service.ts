import { Injectable, InternalServerErrorException } from '@nestjs/common';

type TextSentimentResult = {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  emotions: Record<string, number>;
  summary: string;
  suggestions: string[];
};

type ImageEmotionResult = {
  overallEmotion:
    | 'angry'
    | 'disgust'
    | 'fear'
    | 'happy'
    | 'sad'
    | 'surprise'
    | 'neutral';
  confidence: number;
  scores: Record<string, number>;
  summary: string;
  suggestions: string[];
  notes?: string;
};

@Injectable()
export class AiService {
  private readonly textModelName =
    process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-flash';
  private readonly imageModelName =
    process.env.GEMINI_IMAGE_MODEL || 'gemini-1.5-flash';
  private readonly apiKey = process.env.GOOGLE_API_KEY || '';

  private async getGemini() {
    const mod = await import('@google/generative-ai');
    const genAI = new mod.GoogleGenerativeAI(this.apiKey);
    return { genAI, SchemaType: mod.SchemaType };
  }

  async analyzeText(content: string): Promise<TextSentimentResult> {
    try {
      const { genAI, SchemaType } = await this.getGemini();
      const model = genAI.getGenerativeModel({ model: this.textModelName });

      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          sentiment: {
            type: SchemaType.STRING,
            enum: ['positive', 'neutral', 'negative'],
          },
          score: { type: SchemaType.NUMBER },
          emotions: {
            type: SchemaType.OBJECT,
            properties: {
              angry: { type: SchemaType.NUMBER },
              disgust: { type: SchemaType.NUMBER },
              fear: { type: SchemaType.NUMBER },
              happy: { type: SchemaType.NUMBER },
              sad: { type: SchemaType.NUMBER },
              surprise: { type: SchemaType.NUMBER },
              neutral: { type: SchemaType.NUMBER },
            },
          },
          summary: { type: SchemaType.STRING },
          suggestions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ['sentiment', 'score', 'emotions', 'summary', 'suggestions'],
      } as const;

      const prompt = `
Bạn là trợ lý sức khoẻ tinh thần. Hãy phân tích:
- sentiment (positive/neutral/negative) + score [0..1]
- điểm 7 cảm xúc (angry, disgust, fear, happy, sad, surprise, neutral) [0..1]
- summary 1-2 câu
- 4-5 gợi ý hành vi lành mạnh, tích cực, phù hợp, có icon cảm xúc tuơng ứng
Trả JSON theo schema.
Nội dung:
"""${content}"""`.trim();

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
          // Với text: giữ schema được
          responseSchema: schema as any,
        },
      });

      let text = result.response.text().trim();
      if (text.startsWith('```')) {
        text = text
          .replace(/^```json\s*/i, '')
          .replace(/```$/, '')
          .trim();
      }
      const parsed = JSON.parse(text);

      return {
        sentiment: parsed.sentiment,
        score: clamp01(parsed.score),
        emotions: normalizeSeven(parsed.emotions || {}),
        summary: parsed.summary ?? '',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
      };
    } catch (e: any) {
      throw new InternalServerErrorException(
        'Gemini text analyze failed: ' + (e?.message || e),
      );
    }
  }

  async analyzeImage(
    filename: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<ImageEmotionResult> {
    try {
      const { genAI } = await this.getGemini();
      const model = genAI.getGenerativeModel({ model: this.imageModelName });

      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];
      const mt = allowed.includes((mimeType || '').toLowerCase())
        ? mimeType
        : 'image/jpeg';

      const base64 = buffer.toString('base64');

      const prompt = `
Bạn là mô hình phân tích cảm xúc từ ảnh khuôn mặt/cảnh. Yêu cầu:
1) Dự đoán cảm xúc tổng thể (một trong 7 lớp: angry, disgust, fear, happy, sad, surprise, neutral) + confidence [0..1]
2) Điểm từng lớp [0..1] cho đủ 7 cảm xúc
3) TÓM TẮT ngắn gọn nội dung ảnh (1-2 câu, tiếng Việt tự nhiên)
4) Đưa 4-5 GỢI Ý HÀNH VI tích cực, ngắn gọn, phù hợp bối cảnh ảnh, có các iccon cảm xúc tương ứng
5) Nếu không rõ mặt người: overallEmotion='neutral', confidence≈0.0, notes giải thích

TRẢ VỀ JSON THUẦN đúng cấu trúc:
{
  "overallEmotion": "happy",
  "confidence": 0.82,
  "scores": { "angry": 0.01, "disgust": 0, "fear": 0.04, "happy": 0.85, "sad": 0.03, "surprise": 0.02, "neutral": 0.05 },
  "summary": "…",
  "suggestions": ["…","…","…"],
  "notes": "…"
}`.trim();

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          {
            role: 'user',
            parts: [
              { inlineData: { data: base64, mimeType: mt } },
              { text: `filename: ${filename}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: 'application/json', // ❗ bỏ responseSchema để tránh 400
        },
      });

      let text = result.response.text().trim();
      if (text.startsWith('```')) {
        text = text
          .replace(/^```json\s*/i, '')
          .replace(/```$/, '')
          .trim();
      }
      const parsed = JSON.parse(text);

      return {
        overallEmotion: String(
          parsed.overallEmotion ?? 'neutral',
        ) as ImageEmotionResult['overallEmotion'],
        confidence: clamp01(parsed.confidence),
        scores: normalizeSeven(parsed.scores || {}),
        summary: String(parsed.summary ?? ''),
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.map((x: any) => String(x))
          : [],
        notes: parsed.notes ? String(parsed.notes) : undefined,
      };
    } catch (e: any) {
      throw new InternalServerErrorException(
        'Gemini image analyze failed: ' + (e?.message || e),
      );
    }
  }
}

function clamp01(n: any) {
  const x = Number(n);
  if (Number.isFinite(x)) return Math.max(0, Math.min(1, x));
  return 0;
}

function normalizeSeven(s: Record<string, number>) {
  const keys = [
    'angry',
    'disgust',
    'fear',
    'happy',
    'sad',
    'surprise',
    'neutral',
  ] as const;
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = clamp01(s?.[k] ?? 0);
  return out;
}
