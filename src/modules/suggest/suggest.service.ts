// src/modules/suggest/suggest.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

type Sentiment = { label: 'positive' | 'negative' | 'neutral'; score: number };

@Injectable()
export class SuggestService {
  private client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL, // cho OpenRouter
  });
  private model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  async analyzeText(
    content: string,
  ): Promise<{ sentiment: Sentiment; reasoning: string }> {
    const prompt = `
Bạn là bộ phân tích cảm xúc. Trả JSON thuần: {"label":"positive|negative|neutral","score":0..1,"reasoning":"..."}.
Văn bản: """${content}"""`;

    const resp = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const text = resp.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(text);
    return {
      sentiment: { label: parsed.label, score: parsed.score },
      reasoning: parsed.reasoning,
    };
  }

  makeSuggestions(label: Sentiment['label']) {
    switch (label) {
      case 'negative':
        return [
          'Thử hít thở 4-7-8 trong 2 phút',
          'Đi bộ 10–15 phút ngoài trời',
          'Viết 3 điều biết ơn hôm nay',
          'Nghe playlist thư giãn 10 phút',
        ];
      case 'neutral':
        return [
          'Đặt mục tiêu nhỏ trong ngày (Pomodoro 25’)',
          'Uống một cốc nước, giãn cơ nhẹ',
          'Nhắn tin cho một người bạn',
        ];
      case 'positive':
      default:
        return [
          'Ghi lại điều khiến bạn vui hôm nay',
          'Chia sẻ năng lượng tích cực với người khác',
          'Dành 15’ cho sở thích cá nhân',
        ];
    }
  }
}
