import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalyzeService } from './analyze.service';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('analyze')
@UseGuards(FirebaseAuthGuard)
export class AnalyzeController {
  constructor(private readonly svc: AnalyzeService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async analyzeImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('file is required');
    return this.svc.forwardImageToPython(
      file.originalname || 'frame.jpg',
      file.buffer,
    );
  }
}
