// src/modules/suggest/dto/analyze-text.dto.ts
import { IsString, Length } from 'class-validator';

export class AnalyzeTextDto {
  @IsString()
  @Length(1, 4000)
  content: string;
}
