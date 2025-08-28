// src/modules/suggest/suggest.controller.ts
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SuggestService } from './suggest.service';
import { AnalyzeTextDto } from './dto/analyze-text.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class SuggestController {
  constructor(private readonly svc: SuggestService) {}

  @Post('analyze/text')
  async analyzeText(@Body() body: AnalyzeTextDto) {
    const res = await this.svc.analyzeText(body.content);
    return res;
  }

  @Post('suggestions')
  async suggestions(@Body() body: AnalyzeTextDto) {
    const res = await this.svc.analyzeText(body.content);
    const tips = this.svc.makeSuggestions(res.sentiment.label);
    return { ...res, suggestions: tips };
  }
}
