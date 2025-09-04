import { IsString, MinLength } from 'class-validator';

export class TextAnalyzeDto {
  @IsString()
  @MinLength(1, {
    message: 'content must be longer than or equal to 1 characters',
  })
  content!: string;
}
