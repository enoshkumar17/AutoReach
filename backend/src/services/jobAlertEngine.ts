import { prisma } from '../prisma.js';
import { sendHtmlEmail } from './mailer.js';
import type { LiveListingItem } from './liveTracker.js';

// Cache of already notified listing keys to prevent duplicate emails
const notifiedUrls = new Set<string>();

/**
 * Preload persisted historical notifications from SQLite database into memory cache on server boot
 */
export async function initNotificationDeduplication() {
  try {
    const historical = await prisma.notification.findMany({
      select: { url: true, company: true, role: true },
    });
    for (const item of historical) {
      if (item.url) notifiedUrls.add(item.url);
      if (item.company && item.role) notifiedUrls.add(`${item.company}:${item.role}`);
    }
    console.log(`[JobAlertEngine] Initialized deduplication cache with ${historical.length} persisted records from SQLite.`);
  } catch (err: any) {
    console.warn('[JobAlertEngine] Notice preloading notifications cache:', err.message);
  }
}

// Auto-initialize deduplication cache
initNotificationDeduplication();

/**
 * Check if a listing matches candidate's profile
 */
export function matchJobWithProfile(
  listing: LiveListingItem,
  profile: { targetBatch?: number | null; targetRoles?: string | null; degree?: string | null }
): { isMatch: boolean; score: number; reason: string } {
  // Only match open jobs
  if (listing.status !== 'open') {
    return { isMatch: false, score: 0, reason: 'Listing is closed' };
  }

  let score = 0;
  const matchReasons: string[] = [];

  const targetBatch = profile.targetBatch || 2028;
  const userRoles = (profile.targetRoles || 'SWE,SDE,Backend,Fullstack,Systems,Software')
    .toLowerCase()
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  // 1. Batch Match (Crucial: 50 points)
  if (Array.isArray(listing.eligibleBatches) && listing.eligibleBatches.includes(targetBatch)) {
    score += 50;
    matchReasons.push(`Eligible for your graduation batch (${targetBatch})`);
  } else if (Array.isArray(listing.eligibleBatches) && listing.eligibleBatches.length === 0) {
    // Open to all batches
    score += 30;
    matchReasons.push(`Open to all university students`);
  }

  // 2. Role Title & Discipline Match (30 points)
  const titleLower = listing.title.toLowerCase();
  const catLower = (listing.categoryLabel || '').toLowerCase();
  const matchedRole = userRoles.find((role) => titleLower.includes(role) || catLower.includes(role));

  if (matchedRole) {
    score += 30;
    matchReasons.push(`Matches target role: "${matchedRole.toUpperCase()}"`);
  } else if (listing.category === 'swe' || listing.category === 'data_ml') {
    score += 20;
    matchReasons.push(`Core engineering category (${listing.categoryLabel})`);
  }

  // 3. Freshness boost (+20 points for fast closing fresh listings)
  if (listing.isUrgentFresh) {
    score += 20;
    matchReasons.push(`Urgent: Closes within 24-48 hours`);
  }

  const isMatch = score >= 60;
  return {
    isMatch,
    score: Math.min(100, score),
    reason: matchReasons.join(' • '),
  };
}

function cleanStipend(raw?: string): string {
  if (!raw) return 'Competitive CTC';
  const lower = raw.toLowerCase();
  if (
    raw.includes('[') ||
    raw.includes(']') ||
    raw.includes('€') ||
    lower.includes('min') ||
    lower.includes('max') ||
    lower.includes('pay zone') ||
    lower.includes('guidelines') ||
    lower.includes('standard industry') ||
    raw.length > 30
  ) {
    return 'Competitive CTC';
  }
  return raw;
}

/**
 * Generate responsive HTML email for Job Alert
 */
export function generateJobAlertHtml(
  listing: LiveListingItem,
  candidateName: string,
  matchReason: string,
  matchScore: number
): string {
  const companyInitials = listing.company.slice(0, 2).toUpperCase();
  const batchLabel = listing.eligibleBatchesLabel || `Batch ${listing.eligibleBatches.join(', ')}`;
  const portalUrl = listing.url || 'https://autoreach-crgv.onrender.com';
  const stipendText = cleanStipend(listing.stipend);

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚡ New Opportunity Alert: ${listing.company} - ${listing.title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f7f9; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            
            <!-- Header Banner -->
            <tr>
              <td style="background: linear-gradient(135deg, #09090b 0%, #1c1917 100%); padding: 24px 28px; text-align: left;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24; background-color: rgba(251, 191, 36, 0.15); padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(251, 191, 36, 0.3);">
                        ⚡ Immediate Career Alert
                      </span>
                      <h1 style="margin: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                        AutoReach Live Placement Radar
                      </h1>
                    </td>
                    <td align="right" style="vertical-align: top;">
                      <span style="font-size: 13px; font-weight: 700; color: #10b981; background-color: rgba(16, 185, 129, 0.12); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3); white-space: nowrap;">
                        ${matchScore}% Match
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Candidate Greeting -->
            <tr>
              <td style="padding: 24px 28px 12px 28px;">
                <p style="margin: 0; font-size: 15px; color: #44403c; line-height: 1.5;">
                  Hi <strong>${candidateName}</strong>, a new verified engineering opening matching your profile has been detected on official ATS portals.
                </p>
              </td>
            </tr>

            <!-- Job Highlight Card -->
            <tr>
              <td style="padding: 0 28px 24px 28px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px;">
                  <tr>
                    <td>
                      <!-- Company & Title -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td width="48" style="vertical-align: top;">
                            <div style="width: 44px; height: 44px; background-color: #09090b; color: #ffffff; font-weight: 800; font-size: 15px; border-radius: 10px; text-align: center; line-height: 44px;">
                              ${companyInitials}
                            </div>
                          </td>
                          <td style="padding-left: 14px; vertical-align: top;">
                            <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">
                              ${listing.company}
                            </span>
                            <h2 style="margin: 2px 0 0 0; font-size: 18px; font-weight: 700; color: #0c0a09; line-height: 1.3;">
                              ${listing.title}
                            </h2>
                          </td>
                        </tr>
                      </table>

                      <!-- Job Specs Table (Clean, balanced rows) -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px; border-top: 1px solid #e7e5e4; padding-top: 12px;">
                        <tr>
                          <td style="padding: 4px 0; font-size: 13px; color: #44403c;">
                            <span style="font-size: 11px; font-weight: 700; color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-right: 8px;">
                              🎯 ${batchLabel}
                            </span>
                            <span style="font-size: 11px; font-weight: 600; color: #1e40af; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; display: inline-block;">
                              💼 ${listing.roleType}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0 4px 0; font-size: 13px; color: #57534e;">
                            📍 <strong>Location:</strong> ${listing.locations.join(', ') || 'India'}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; font-size: 13px; color: #57534e;">
                            💰 <strong>Compensation:</strong> <span style="font-weight: 700; color: #047857;">${stipendText}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; font-size: 13px; color: #57534e;">
                            ⏱️ <strong>Application Window:</strong> ${listing.deadline || 'Rolling (Apply early)'}
                          </td>
                        </tr>
                      </table>

                      <!-- Match Reason -->
                      <div style="margin-top: 14px; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #44403c;">
                        <strong style="color: #0c0a09;">Profile Fit:</strong> ${matchReason}
                      </div>

                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Action Button -->
            <tr>
              <td style="padding: 0 28px 28px 28px; text-align: center;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="background-color: #09090b; border-radius: 10px;">
                      <a href="${portalUrl}" target="_blank" style="display: block; box-sizing: border-box; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-align: center;">
                        Apply Directly on Official Portal &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 14px 0 0 0; font-size: 12px; color: #a8a29e;">
                  Want an internal referral? Open AutoReach to generate a 1-click tailored referral request.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f5f5f4; border-top: 1px solid #e7e5e4; padding: 16px 28px; text-align: center; font-size: 11px; color: #78716c;">
                AutoReach Autonomous Placement Radar • Powered by verified direct ATS adapters.<br/>
                You are receiving this alert for Batch ${listing.eligibleBatches.join('/')} engineering roles.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Process a batch of live listings and dispatch alerts to all active candidate profiles
 */
export async function processAndNotifyListings(listings: LiveListingItem[]): Promise<{
  matchedCount: number;
  emailsSent: number;
}> {
  try {
    const profiles = await prisma.candidateProfile.findMany({
      where: { emailAlertsEnabled: true },
    });
    if (!profiles || profiles.length === 0) return { matchedCount: 0, emailsSent: 0 };

    let matchedCount = 0;
    let emailsSent = 0;

    for (const listing of listings) {
      // Must be open
      if (listing.status !== 'open') continue;

      for (const profile of profiles) {
        // Persisted Check: Never notify a job that this specific user already received
        const existing = await prisma.notification.findFirst({
          where: {
            userId: profile.userId,
            OR: [
              ...(listing.url ? [{ url: listing.url }] : []),
              {
                AND: [
                  { company: listing.company },
                  { role: listing.title },
                ],
              },
            ],
          },
        });

        if (existing) continue;

        const match = matchJobWithProfile(listing, {
          targetBatch: profile.targetBatch,
          targetRoles: profile.targetRoles,
          degree: profile.degree,
        });

        if (match.isMatch) {
          matchedCount++;

          // Save in-app notification scoped to user
          const notification = await prisma.notification.create({
            data: {
              userId: profile.userId,
              type: listing.isUrgentFresh ? 'CLOSING_SOON' : 'JOB_ALERT',
              title: `New Opening: ${listing.company} - ${listing.title}`,
              message: match.reason,
              company: listing.company,
              role: listing.title,
              url: listing.url,
              batch: profile.targetBatch || 2028,
              matchScore: match.score,
              isRead: false,
              emailSent: false,
            },
          });

          // Send email alert if email is available
          if (profile.email) {
            try {
              const html = generateJobAlertHtml(
                listing,
                profile.fullName.split(' ')[0] || 'Candidate',
                match.reason,
                match.score
              );

              await sendHtmlEmail({
                to: profile.email,
                subject: `⚡ [Job Alert] ${listing.company} is hiring for ${listing.title} (${listing.eligibleBatchesLabel})`,
                html,
                gmailUser: profile.gmailUser || undefined,
                gmailAppPassword: profile.gmailAppPassword || undefined,
              });

              await prisma.notification.update({
                where: { id: notification.id },
                data: { emailSent: true },
              });

              emailsSent++;
              console.log(`[JobAlertEngine] Dispatched instant job alert email for ${listing.company} (${listing.title}) to ${profile.email}`);
            } catch (emailErr: any) {
              console.warn(`[JobAlertEngine] Email dispatch notice for ${listing.company}: ${emailErr.message}`);
            }
          }
        }
      }
    }

    return { matchedCount, emailsSent };
  } catch (err: any) {
    console.error('[JobAlertEngine] Error in processAndNotifyListings:', err);
    return { matchedCount: 0, emailsSent: 0 };
  }
}

/**
 * Send a sample/test alert email immediately to candidate's email
 */
export async function sendTestJobAlert(customEmail?: string, userId?: string): Promise<{ success: boolean; message: string }> {
  try {
    const profile = userId
      ? await prisma.candidateProfile.findUnique({ where: { userId } })
      : await prisma.candidateProfile.findFirst();

    const recipient = customEmail || profile?.email || 'enoshkumar2006@gmail.com';
    const candidateName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Enosh';

    const sampleListing: LiveListingItem = {
      id: 'test-juspay-001',
      company: 'Juspay',
      companySlug: 'juspay',
      title: 'Software Development Engineer Intern',
      category: 'swe',
      categoryLabel: 'Software Engineering',
      roleType: 'Summer Intern',
      locations: ['Bangalore, India'],
      datePosted: new Date().toISOString().split('T')[0],
      postedAgoLabel: 'Just now',
      hoursOld: 0,
      daysOld: 0,
      isUrgentFresh: true,
      deadline: 'Rolling (Closes in 48 hours once application cap is reached)',
      eligibleBatches: [2026, 2027, 2028],
      eligibleBatchesLabel: 'Batch 2026, 2027, 2028',
      degreeRequired: 'B.Tech / B.E. in Computer Science or related',
      durationMonths: 3,
      stipend: '₹40,000 / month + Full-Time PPO (₹21–27 LPA)',
      url: 'https://joinus.juspay.in/careers',
      source: 'direct_ats',
      status: 'open',
    };

    const matchReason = 'Eligible for Batch 2028 • Matches target role "SDE" • Verified NIT-Agartala match';
    const html = generateJobAlertHtml(sampleListing, candidateName, matchReason, 98);

    await sendHtmlEmail({
      to: recipient,
      subject: `⚡ [Test Alert] Juspay is hiring for Software Development Engineer Intern (Batch 2026–2028)`,
      html,
      gmailUser: profile?.gmailUser || undefined,
      gmailAppPassword: profile?.gmailAppPassword || undefined,
    });

    // Also record test in-app notification scoped to user
    await prisma.notification.create({
      data: {
        userId: profile?.userId || null,
        type: 'JOB_ALERT',
        title: 'Test Alert: Juspay - Software Development Engineer Intern',
        message: matchReason,
        company: 'Juspay',
        role: 'Software Development Engineer Intern',
        url: 'https://joinus.juspay.in/careers',
        batch: 2028,
        matchScore: 98,
        isRead: false,
        emailSent: true,
      },
    });

    return {
      success: true,
      message: `Test job alert successfully delivered to ${recipient}. Please check your inbox!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to send test email alert.',
    };
  }
}

/**
 * Send Daily Morning Digest Email to Candidate
 */
export async function sendDailyDigestAlert(
  customEmail?: string,
  userId?: string
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const profile = userId
      ? await prisma.candidateProfile.findUnique({ where: { userId } })
      : await prisma.candidateProfile.findFirst();

    const recipient = customEmail || profile?.email || 'enoshkumar2006@gmail.com';
    const candidateName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Enosh';
    const targetBatch = profile?.targetBatch || 2028;

    // Import syncLiveListings to get fresh data
    const { syncLiveListings } = await import('./liveTracker.js');
    const allListings = await syncLiveListings(false);

    // Filter and score matching open listings
    const matched = allListings
      .filter((l) => l.status === 'open')
      .map((l) => ({
        listing: l,
        match: matchJobWithProfile(l, {
          targetBatch,
          targetRoles: profile?.targetRoles,
          degree: profile?.degree,
        }),
      }))
      .filter((item) => item.match.isMatch)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 6); // Top 6 matches

    if (matched.length === 0) {
      return { success: false, message: 'No open listings currently match your profile criteria.' };
    }

    const todayDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const listingsCardsHtml = matched
      .map(({ listing, match }) => `
        <div style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 18px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <!-- Top Row: Company & Batch Pill -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 6px;">
            <tr>
              <td align="left" style="vertical-align: middle;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">
                  ${listing.company}
                </span>
              </td>
              <td align="right" style="vertical-align: middle;">
                <span style="font-size: 11px; font-weight: 700; color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px; white-space: nowrap;">
                  ${listing.eligibleBatchesLabel || `Batch ${targetBatch}`}
                </span>
              </td>
            </tr>
          </table>

          <!-- Job Title (Full Width) -->
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0c0a09; line-height: 1.3;">
            ${listing.title}
          </h3>

          <!-- Details & Clean Stipend -->
          <div style="font-size: 12px; color: #57534e; margin-bottom: 12px; line-height: 1.5;">
            <span>📍 ${listing.locations[0] || 'India'}</span>
            <span style="color: #d6d3d1; margin: 0 6px;">•</span>
            <span>💼 ${listing.roleType}</span>
            <span style="color: #d6d3d1; margin: 0 6px;">•</span>
            <span style="font-weight: 600; color: #047857;">💰 ${cleanStipend(listing.stipend)}</span>
          </div>

          <!-- Bottom Action Row: Match reason + Spacious Apply Button -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #f5f5f4; padding-top: 12px;">
            <tr>
              <td align="left" style="vertical-align: middle; padding-right: 12px; font-size: 11px; color: #78716c; line-height: 1.4;">
                ${match.reason}
              </td>
              <td align="right" style="vertical-align: middle; width: 120px; white-space: nowrap;">
                <a href="${listing.url || 'https://autoreach-crgv.onrender.com'}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 8px; text-align: center; white-space: nowrap;">
                  Apply &rarr;
                </a>
              </td>
            </tr>
          </table>
        </div>
      `)
      .join('');

    const digestHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AutoReach Morning Career Digest</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f6f7f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c1917;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #09090b 0%, #1c1917 100%); padding: 24px 28px;">
                  <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #fbbf24; letter-spacing: 1px;">
                    ☀️ Morning Placement Digest • ${todayDate}
                  </span>
                  <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                    ${matched.length} Top Verified Tech Roles for Batch ${targetBatch}
                  </h1>
                </td>
              </tr>

              <!-- Intro -->
              <tr>
                <td style="padding: 20px 28px 10px 28px; font-size: 14px; color: #44403c; line-height: 1.5;">
                  Good morning <strong>${candidateName}</strong>! AutoReach scanned 100+ company career portals overnight. Here are the top active engineering opportunities verified and accepting applications for your graduation year today:
                </td>
              </tr>

              <!-- Listings -->
              <tr>
                <td style="padding: 10px 28px 20px 28px;">
                  ${listingsCardsHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f5f5f4; border-top: 1px solid #e7e5e4; padding: 16px 28px; text-align: center; font-size: 11px; color: #78716c;">
                  AutoReach Autonomous Placement Radar • Powered by verified direct ATS adapters.<br/>
                  Sent daily to ${recipient} for Batch ${targetBatch} engineering opportunities.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await sendHtmlEmail({
      to: recipient,
      subject: `☀️ [Morning Digest] ${matched.length} Verified Tech Roles for Batch ${targetBatch} (${todayDate})`,
      html: digestHtml,
      gmailUser: profile?.gmailUser || undefined,
      gmailAppPassword: profile?.gmailAppPassword || undefined,
    });

    return {
      success: true,
      message: `Morning digest successfully delivered to ${recipient} (${matched.length} matched roles)!`,
      count: matched.length,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to dispatch daily digest email.',
    };
  }
}
