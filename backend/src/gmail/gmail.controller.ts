import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('sync')
  @UseGuards(AuthGuard('jwt'))
  async syncInbox(@Req() req) {
    const userId = req.user.id;
    const accessToken = req.user.accessToken;
    
    return this.gmailService.syncInbox(userId, accessToken);
  }
}