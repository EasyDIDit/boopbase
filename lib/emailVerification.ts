import User from '@/lib/models/User';
import { VERIFY_TTL_MS, authLinkBase, hashAuthToken, looksLikeAuthToken, newAuthToken } from '@/lib/authTokens';
import { sendAuthMail, verifyEmailMail, type MailResult } from '@/lib/mailer';

type UserLike = { _id: unknown; email?: string };

/** Store a fresh verify-token hash on the user and email the link (no-op mailer unless configured). */
export async function sendVerificationEmail(user: UserLike, requestOrigin: string): Promise<MailResult> {
  const email = String(user.email || '');
  if (!email) return { sent: false, reason: 'no email' };
  const { token, hash } = newAuthToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerifyTokenHash: hash, emailVerifyExpires: new Date(Date.now() + VERIFY_TTL_MS), emailVerified: false } }
  );
  const link = `${authLinkBase(requestOrigin)}/verify-email?token=${encodeURIComponent(token)}`;
  return sendAuthMail(verifyEmailMail(email, link));
}

/** Confirm a verify link. Single use. Returns the username on success. */
export async function confirmEmailToken(token: unknown): Promise<string | null> {
  if (!looksLikeAuthToken(token)) return null;
  const user = await User.findOneAndUpdate(
    { emailVerifyTokenHash: hashAuthToken(token), emailVerifyExpires: { $gt: new Date() } },
    { $set: { emailVerified: true }, $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 } },
    { new: true }
  ).select('username');
  return user ? String(user.username) : null;
}
