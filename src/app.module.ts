// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyzeModule } from './modules/analyze/analyze.module';
import { SuggestModule } from './modules/suggest/suggest.module';
import { JournalModule } from './modules/journal/journal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AnalyzeModule,
    SuggestModule,
    JournalModule,
  ],
})
export class AppModule {}
