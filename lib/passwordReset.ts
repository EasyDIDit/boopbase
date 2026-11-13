import bcrypt from 'bcryptjs';
import User from '@/lib/models/User';
import { RESET_TTL_MS, authLinkBase, hashAuthToken, looksLikeAuthToken, newAuthToken, passwordProblem } from '@/lib/authTokens';
import { passwordResetMail, sendAuthMail } from '@/lib/mailer';

/** Same answer whether or not the email has an account (no account lookup by strangers). */
export const RESET_GENERIC = { message: 'If that email has a BOOP account, we sent a reset link. It expires in 1 hour.' };

export async function startPasswordReset(email: string, requestOrigin: string): Promise<void> {
  const user = await User.findOne({ email }).select('_id email');
  if (!user) return;
  const { token, hash } = newAuthToken();
  await User.updateOne({ _id: user._id }, { $set: { resetTokenHash: hash, resetTokenExpires: new Date(Date.now() + RESET_TTL_MS) } });
  const link = `${authLinkBase(requestOrigin)}/reset-password?token=${encodeURIComponent(token)}`;
  await sendAuthMail(passwordResetMail(String(user.email), link));
}

export type ResetOutcome = { ok: true } | { ok: false; status: number; error: string };

/** Single use: the token is cleared in the same update that sets the new password. */
export async function finishPasswordReset(token: unknown, password: unknown): Promise<ResetOutcome> {
  const problem = passwordProblem(password);
  if (problem) return { ok: false, status: 400, error: problem };
  if (!looksLikeAuthToken(token)) return { ok: false, status: 400, error: 'This reset link is not valid. Ask for a new one.' };
  const hashed = await bcrypt.hash(String(password), 10);
  const user = await User.findOneAndUpdate(
    { resetTokenHash: hashAuthToken(token), resetTokenExpires: { $gt: new Date() } },
    {
      // Getting the link proves the inbox is theirs, so the login email counts as confirmed.
      $set: { password: hashed, passwordChangedAt: new Date(), emailVerified: true },
      $unset: { resetTokenHash: 1, resetTokenExpires: 1 },
    },
    { new: true }
  ).select('_id');
  if (!user) return { ok: false, status: 400, error: 'This reset link is not valid or has expired. Ask for a new one.' };
  return { ok: true };
}
