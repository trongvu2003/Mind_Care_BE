// src/modules/suggest/suggest.module.ts
import { Module } from '@nestjs/common';
import { SuggestController } from './suggest.controller';
import { SuggestService } from './suggest.service';

@Module({
  controllers: [SuggestController],
  providers: [SuggestService],
})
export class SuggestModule {}
