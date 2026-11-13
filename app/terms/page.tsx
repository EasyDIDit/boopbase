import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms · BOOP', robots: { index: false, follow: true } };

/**
 * STARTER DRAFT (2026-11-12) — needs lawyer review before launch.
 * Only real facts are stated: operator Easy Did It, LLC; contact heyeasy@easydidit.com;
 * card returns as already published on easydidit.com/boop/returns (EASY approved Oct 17 2026).
 * Not included on purpose (lawyer/EASY to decide): governing law, dispute process, liability caps, age minimum.
 */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="November 12, 2026 (draft)">
      <p>
        BOOP pages at boopbase.com are run by Easy Did It, LLC (&quot;we&quot;). By creating a BOOP page or using a BOOP card,
        you agree to these terms. Questions: <a href="mailto:heyeasy@easydidit.com">heyeasy@easydidit.com</a>.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give a real email you can get messages at. We use it to sign you in and to reset your password.</li>
        <li>Keep your password private. You are responsible for what happens on your account.</li>
        <li>Pick a username that isn&apos;t pretending to be someone else or a brand you don&apos;t represent.</li>
      </ul>

      <h2>Your page and content</h2>
      <ul>
        <li>Your public page shows what you choose to put on it: name, photo, bio, links, socials and any contact details you add.</li>
        <li>You keep ownership of your content. You let us store and show it so your page and card work.</li>
        <li>Only post content you have the right to share.</li>
      </ul>

      <h2>Not allowed</h2>
      <ul>
        <li>Illegal content, scams, phishing or malware links.</li>
        <li>Harassment, threats, or hateful content.</li>
        <li>Sharing someone else&apos;s private information without their OK.</li>
        <li>Trying to break into accounts, overload the site, or get around its security.</li>
      </ul>
      <p>
        We may hide or remove a page or link that breaks these rules. Anyone can report a page with the
        &quot;Report&quot; link at the bottom of it, or by emailing <a href="mailto:heyeasy@easydidit.com">heyeasy@easydidit.com</a>.
      </p>

      <h2>BOOP cards</h2>
      <p>
        Card orders, shipping and replacements follow the published policy at{' '}
        <a href="https://easydidit.com/boop/returns">easydidit.com/boop/returns</a>: logo and custom cards are final sale; once a card has been
        booped and claimed to a profile it can&apos;t be refunded; damaged or non-working cards are replaced free.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version.</p>
    </LegalPage>
  );
}
