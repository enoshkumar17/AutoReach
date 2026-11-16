import { prisma } from '../prisma.js';
import { sendHtmlEmail } from './mailer.js';
import type { LiveListingItem } from './liveTracker.js';

// Cache of already notified listing keys to prevent duplicate emails
const notifiedUrls = new Set<string>();

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
  const portalUrl = listing.url;

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
                      <span style="font-size: 13px; font-weight: 700; color: #10b981; background-color: rgba(16, 185, 129, 0.12); padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                        ${matchScore}% Profile Match
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
                  Hi <strong>${candidateName}</strong>, a new high-priority engineering role matching your target profile just dropped on official career portals.
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

                      <!-- Job Details Pills -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
                        <tr>
                          <td style="padding: 4px 0;">
                            <span style="font-size: 12px; font-weight: 600; color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-bottom: 6px;">
                              🎯 ${batchLabel}
                            </span>
                            <span style="font-size: 12px; font-weight: 600; color: #1e40af; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-bottom: 6px;">
                              📍 ${listing.locations.join(', ')}
                            </span>
                            <span style="font-size: 12px; font-weight: 600; color: #b45309; background-color: #fffbeb; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px;">
                              💼 ${listing.roleType}
                            </span>
                          </td>
                        </tr>
                      </table>

                      <!-- Compensation & Deadline -->
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e7e5e4; font-size: 13px; color: #57534e;">
                        <p style="margin: 0 0 4px 0;">
                          <strong style="color: #1c1917;">Expected Stipend:</strong> ${listing.stipend || 'Competitive Industry Standard'}
                        </p>
                        <p style="margin: 0;">
                          <strong style="color: #1c1917;">Deadline / Churn:</strong> ${listing.deadline}
                        </p>
                      </div>

                      <!-- Match Reason -->
                      <div style="margin-top: 14px; background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #44403c;">
                        <strong style="color: #0c0a09;">Why this matched your profile:</strong><br/>
                        ${matchReason}
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
                    <td align="center">
                      <a href="${portalUrl}" target="_blank" style="display: inline-block; width: 100%; box-sizing: border-box; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-align: center;">
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
                You are receiving this because instant notifications are enabled for Batch ${listing.eligibleBatches.join('/')} SDE roles.
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
 * Process a batch of live listings and dispatch alerts to the candidate
 */
export async function processAndNotifyListings(listings: LiveListingItem[]): Promise<{
  matchedCount: number;
  emailsSent: number;
}> {
  try {
    const profile = await prisma.candidateProfile.findFirst();
    if (!profile) return { matchedCount: 0, emailsSent: 0 };

    let matchedCount = 0;
    let emailsSent = 0;

    for (const listing of listings) {
      // Must be open
      if (listing.status !== 'open') continue;

      const listingKey = listing.url || `${listing.company}:${listing.title}`;
      if (notifiedUrls.has(listingKey)) continue;

      const match = matchJobWithProfile(listing, {
        targetBatch: profile.targetBatch,
        targetRoles: profile.targetRoles,
        degree: profile.degree,
      });

      if (match.isMatch) {
        matchedCount++;
        notifiedUrls.add(listingKey);

        // Save in-app notification
        const notification = await prisma.notification.create({
          data: {
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

        // Send email alert if enabled and credentials configured
        if (profile.emailAlertsEnabled && profile.email) {
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

    return { matchedCount, emailsSent };
  } catch (err: any) {
    console.error('[JobAlertEngine] Error in processAndNotifyListings:', err);
    return { matchedCount: 0, emailsSent: 0 };
  }
}

/**
 * Send a sample/test alert email immediately to candidate's email
 */
export async function sendTestJobAlert(customEmail?: string): Promise<{ success: boolean; message: string }> {
  try {
    const profile = await prisma.candidateProfile.findFirst();
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
    });

    // Also record test in-app notification
    await prisma.notification.create({
      data: {
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
  customEmail?: string
): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const profile = await prisma.candidateProfile.findFirst();
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
        <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin-bottom: 12px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #78716c; letter-spacing: 0.5px;">
                  ${listing.company}
                </span>
                <h3 style="margin: 2px 0 6px 0; font-size: 16px; font-weight: 700; color: #0c0a09;">
                  ${listing.title}
                </h3>
                <div style="font-size: 12px; color: #57534e; margin-bottom: 8px;">
                  <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin-right: 6px;">
                    🎯 ${listing.eligibleBatchesLabel || `Batch ${targetBatch}`}
                  </span>
                  <span>📍 ${listing.locations.join(', ')}</span> • 
                  <span>💰 ${listing.stipend || 'Competitive'}</span>
                </div>
                <div style="font-size: 11px; color: #78716c;">
                  ${match.reason}
                </div>
              </td>
              <td width="120" align="right" style="vertical-align: middle;">
                <a href="${listing.url}" target="_blank" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 8px; white-space: nowrap;">
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
