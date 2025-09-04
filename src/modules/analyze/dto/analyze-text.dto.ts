import { IsOptional, IsString, MinLength } from 'class-validator';

export class AnalyzeTextDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;
}
