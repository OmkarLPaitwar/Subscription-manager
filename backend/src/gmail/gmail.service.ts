import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

export interface GmailEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet?: string;
}

@Injectable()
export class GmailService {
  constructor(private prisma: PrismaService) {}

  async syncInbox(userId: string, accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50, // Fetch more for better subscription detection
    });

    const messages = response.data.messages || [];
    let syncedCount = 0;

    for (const msg of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
      });

      const headers = fullMessage.data.payload?.headers ?? [];

      const getHeader = (name: string): string => {
        return headers.find(h => h.name === name)?.value ?? '';
      };

      const from = getHeader('From');
      const subject = getHeader('Subject');
      const date = getHeader('Date');

      // Save to database (upsert prevents duplicates)
      await this.prisma.email.upsert({
        where: { gmailMessageId: msg.id! },
        update: {}, // Don't update if exists
        create: {
          gmailMessageId: msg.id!,
          userId,
          from,
          subject,
          date,
          snippet: fullMessage.data.snippet ?? undefined,
        },
      });

      syncedCount++;
    }

    return {
      success: true,
      synced: syncedCount,
      message: `Synced ${syncedCount} emails`,
    };
  }
}