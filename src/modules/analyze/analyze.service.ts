// src/modules/analyze/analyze.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import FormData = require('form-data');

@Injectable()
export class AnalyzeService {
  private base = process.env.EMOTION_SVC_URL || 'http://localhost:8001';

  async forwardImageToPython(filename: string, buffer: Buffer) {
    const form = new FormData();
    form.append('file', buffer, { filename });

    const res = await fetch(`${this.base}/predict-image`, {
      method: 'POST',
      body: form as any,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new InternalServerErrorException(
        `Python svc ${res.status}: ${text}`,
      );
    }
    return res.json(); // { faces: [...] }
  }
}
