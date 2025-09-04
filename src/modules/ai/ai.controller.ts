import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { TextAnalyzeDto } from './dto/text-analyze.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly svc: AiService) {}

  @Post('analyze-text')
  async analyzeText(@Body() dto: TextAnalyzeDto) {
    if (!dto.content?.trim()) {
      throw new BadRequestException('content is required');
    }
    return this.svc.analyzeText(dto.content.trim());
  }

  @Post('analyze-image')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    return this.svc.analyzeImage(
      file.originalname || 'image.jpg',
      file.mimetype,
      file.buffer,
    );
  }
}
