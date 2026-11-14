import { ImapFlow } from 'imapflow';
import { prisma } from '../prisma.js';

export async function checkInboxForReplies() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return { success: false, message: 'Gmail credentials not configured.' };
  }

  // Find all applications awaiting reply
  const pendingApps = await prisma.application.findMany({
    where: {
      status: 'SENT',
    },
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
        // Search for emails from the recruiter email
        const searchCriteria: any = {
          from: app.recipientEmail,
        };

        if (app.sentAt) {
          // Look for messages sent on or after the application date
          const sentDate = new Date(app.sentAt);
          sentDate.setHours(0, 0, 0, 0);
          searchCriteria.since = sentDate;
        }

        const messageUids = await client.search(searchCriteria);

        if (messageUids && messageUids.length > 0) {
          // Get the latest message snippet
          const latestUid = messageUids[messageUids.length - 1];
          let replySnippet = 'Reply received';
          let replyDate = new Date();

          for await (const message of client.fetch(latestUid, { envelope: true })) {
            if (message.envelope) {
              replySnippet = `Reply Subject: "${message.envelope.subject || 'No Subject'}"`;
              if (message.envelope.date) {
                replyDate = new Date(message.envelope.date);
              }
            }
          }

          // Update application in database
          const updated = await prisma.application.update({
            where: { id: app.id },
            data: {
              status: 'REPLIED',
              notes: `${replySnippet} (Received on ${replyDate.toLocaleString()})`,
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
      message: `Checked ${pendingApps.length} pending application(s). Found ${newRepliesCount} new reply(ies).`,
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
