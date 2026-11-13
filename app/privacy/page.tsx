import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy · BOOP', robots: { index: false, follow: true } };

/**
 * STARTER DRAFT (2026-11-12) — needs lawyer review before launch.
 * Describes what the code actually does today. Items marked for EASY are commitments he must confirm.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="November 12, 2026 (draft)">
      <p>
        This explains what BOOP pages at boopbase.com (run by Easy Did It, LLC) keep about you and why.
        Questions or requests: <a href="mailto:heyeasy@easydidit.com">heyeasy@easydidit.com</a>.
      </p>

      <h2>What&apos;s public</h2>
      <ul>
        <li>Only what you put on your page: name, username, photo, bio, background, links, socials and skin.</li>
        <li>Phone, company, job title, city and an optional public contact email go into the Add to Contacts file, only if you fill them in.</li>
        <li>Your login email is never shown on your page or in the contact file.</li>
      </ul>

      <h2>What we keep privately</h2>
      <ul>
        <li>Account: login email, username, and your password stored only as a secure hash (we can&apos;t read it).</li>
        <li>Card details: which card codes are linked to your page and, for cards bought on easydidit.com, the checkout email and order number.</li>
        <li>Simple counts for your Insights: page views, link taps, social taps and contact saves. These are totals, not a list of who visited.</li>
        <li>Security records: to stop spam and password guessing we keep short-lived counters tied to a scrambled (hashed) form of an IP address or email. They delete themselves within about an hour.</li>
      </ul>

      <h2>Photos</h2>
      <p>Photos you upload are resized and re-saved, which removes hidden photo data such as camera details and location.</p>

      <h2>Cookies</h2>
      <p>We use one sign-in cookie to keep you logged in. No advertising cookies.</p>

      <h2>Email</h2>
      <p>
        We email you about your account (confirming your email, password resets) and your card setup. Boop news only goes out if you joined the
        mailing list, and you can unsubscribe anytime.
      </p>

      <h2>Who helps us run it</h2>
      <p>
        The site is hosted on Vercel and data is stored in a MongoDB database. Account emails are sent through an email delivery service.
        Card payments happen on easydidit.com through Stripe; BOOPbase never sees card numbers.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit or clear anything on your page at any time from your dashboard.</li>
        <li>To ask for a copy of your data or to have your account removed, email <a href="mailto:heyeasy@easydidit.com">heyeasy@easydidit.com</a>.</li>
      </ul>

      <h2>Changes</h2>
      <p>We may update this page. The date at the top shows the latest version.</p>
    </LegalPage>
  );
}
