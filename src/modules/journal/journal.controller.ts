// src/modules/journal/journal.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { JournalService } from './journal.service';

@Controller('journals')
@UseGuards(FirebaseAuthGuard)
export class JournalController {
  constructor(private readonly svc: JournalService) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() body: { content: string; sentiment: any },
  ) {
    const uid = req.user?.uid ?? 'anonymous';
    await this.svc.addJournal(uid, body.content, body.sentiment);
    return { ok: true };
  }
}
