// src/modules/journal/journal.module.ts
import { Module } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalController } from './journal.controller';

@Module({
  providers: [JournalService],
  controllers: [JournalController],
  exports: [JournalService],
})
export class JournalModule {}
