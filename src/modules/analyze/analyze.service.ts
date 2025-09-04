import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import fetch from 'node-fetch';
import FormData = require('form-data');

type Sentiment = { label: string; score: number };

@Injectable()
export class AnalyzeService {
  // Python service cho ảnh (haarcascade + Keras)
  private pythonBase = process.env.EMOTION_SVC_URL || 'http://localhost:8001';

  // OpenRouter config (CHỈ sử dụng OpenRouter)
  private orBase =
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  private orKey = process.env.OPENROUTER_API_KEY || '';
  private orModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  // forward sang Python
  async forwardImageToPython(filename: string, buffer: Buffer) {
    if (!buffer?.length) throw new BadRequestException('file buffer is empty');

    const form = new FormData();
    form.append('file', buffer, { filename });

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25_000);

    try {
      const res = await fetch(`${this.pythonBase}/predict-image`, {
        method: 'POST',
        body: form as any,
        signal: ac.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new InternalServerErrorException(
          `Python svc ${res.status}: ${text}`,
        );
      }
      return res.json();
    } catch (e: any) {
      if (e.name === 'AbortError') {
        throw new InternalServerErrorException('Python svc timeout');
      }
      throw e;
    } finally {
      clearTimeout(t);
    }
  }
}
