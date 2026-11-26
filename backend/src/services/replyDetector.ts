import { ImapFlow } from 'imapflow';
import { prisma } from '../prisma.js';

export async function classifyReplySentiment(subject: string, textSnippet: string): Promise<'INTERVIEW' | 'QUESTION' | 'REJECTED' | 'GENERAL'> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'GENERAL';

  const prompt = `Classify this recruiter reply to a student job application into exactly ONE category:
- INTERVIEW: If the recruiter wants to schedule an interview, screening call, meet, or asked for candidate's availability.
- REJECTED: If they are not hiring, position filled, or politely declining.
- QUESTION: If they are asking for assignment, links, GPA, or questions.
- GENERAL: Auto-replies, general acknowledgement, or out of office.

Subject: "${subject}"
Content Snippet: "${textSnippet}"

Output ONLY the category name.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
    if (raw?.includes('INTERVIEW')) return 'INTERVIEW';
    if (raw?.includes('REJECT')) return 'REJECTED';
    if (raw?.includes('QUESTION')) return 'QUESTION';
    return 'GENERAL';
  } catch (_) {
    return 'GENERAL';
  }
}

export interface CheckRepliesOptions {
  user?: string;
  pass?: string;
  userId?: string;
}

export async function checkInboxForReplies(options?: CheckRepliesOptions) {
  const user = options?.user || process.env.GMAIL_USER;
  const pass = options?.pass || process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return { success: false, message: 'Gmail credentials not configured.' };
  }

  // 1. Mark applications sent > 4 days ago as FOLLOW_UP_DUE if still awaiting reply
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  const whereDue: any = {
    status: 'SENT',
    sentAt: { lte: fourDaysAgo },
    followUpCount: 0,
  };
  if (options?.userId) {
    whereDue.userId = options.userId;
  }

  await prisma.application.updateMany({
    where: whereDue,
    data: {
      status: 'FOLLOW_UP_DUE',
    },
  });

  // 2. Find all applications that are awaiting reply or follow-up due
  const pendingWhere: any = {
    status: {
      in: ['SENT', 'FOLLOW_UP_DUE'],
    },
  };
  if (options?.userId) {
    pendingWhere.userId = options.userId;
  }

  const pendingApps = await prisma.application.findMany({
    where: pendingWhere,
  });

  if (pendingApps.length === 0) {
    return { success: true, checked: 0, newReplies: 0, message: 'No applications awaiting reply.' };
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  let newRepliesCount = 0;
  const updatedApps: any[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      for (const app of pendingApps) {
        const searchCriteria: any = {
          from: app.recipientEmail,
        };

        if (app.sentAt) {
          const sentDate = new Date(app.sentAt);
          sentDate.setHours(0, 0, 0, 0);
          searchCriteria.since = sentDate;
        }

        const messageUids = await client.search(searchCriteria);

        if (messageUids && messageUids.length > 0) {
          const latestUid = messageUids[messageUids.length - 1];
          let replySubject = 'Reply received';
          let replyDate = new Date();

          for await (const message of client.fetch(latestUid, { envelope: true })) {
            if (message.envelope) {
              replySubject = message.envelope.subject || 'No Subject';
              if (message.envelope.date) {
                replyDate = new Date(message.envelope.date);
              }
            }
          }

          // AI sentiment classification
          const sentiment = await classifyReplySentiment(replySubject, replySubject);

          let newStatus = 'REPLIED';
          if (sentiment === 'INTERVIEW') {
            newStatus = 'INTERVIEW';
          } else if (sentiment === 'REJECTED') {
            newStatus = 'REJECTED';
          }

          // Update application in database
          const updated = await prisma.application.update({
            where: { id: app.id },
            data: {
              status: newStatus,
              sentiment: sentiment,
              replySnippet: replySubject,
              notes: `[${sentiment}] ${replySubject} (Received on ${replyDate.toLocaleDateString()})`,
            },
          });

          newRepliesCount++;
          updatedApps.push(updated);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return {
      success: true,
      checked: pendingApps.length,
      newReplies: newRepliesCount,
      updatedApps,
      message: `Checked ${pendingApps.length} application(s). Found ${newRepliesCount} new response(s).`,
    };
  } catch (error: any) {
    console.error('[ReplyDetector] Error checking replies:', error);
    try {
      await client.logout();
    } catch (_) {}
    return {
      success: false,
      message: error.message || 'Failed to check inbox via IMAP.',
    };
  }
}
