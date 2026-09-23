import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { CookieSettingsLink } from '@/components/cookie-consent';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Samiati',
  description: 'Samiati Privacy Policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <SamiatiLogo size={36} variant="primary" />
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-display">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/70">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Introduction &amp; Scope</h2>
            <p className="mt-3">
              Samiati, Inc. (“Samiati”, “we”, “us”, or “our”) operates the samiati.com website,
              mobile application, and related services (collectively, the “Service” or “App”).
              Samiati is a platform for the preservation and revitalization of African languages and
              cultural heritage, offering AI-powered chat, translation, voice messaging, and a
              community-driven contribution experience.
            </p>
            <p className="mt-3">
              This Privacy Policy explains what personal information we collect about you, how we
              use it, with whom we share it, and the rights you have over your data. It applies to
              all users of the Service, whether you are a registered account holder, a social
              authentication user, or a guest using limited features without an account.
            </p>
            <p className="mt-3">
              For the purposes of the General Data Protection Regulation (“GDPR”), the data
              controller is Samiati, Inc. If you are a California resident, this policy also serves
              as a “notice” under the California Consumer Privacy Act (“CCPA/CPRA”) and describes
              your rights under California law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
            <p className="mt-3">
              We collect information in several ways. The categories below describe what is
              collected and examples of specific data points.
            </p>

            <h3 className="mt-5 text-md font-semibold text-foreground">
              A. Information You Provide Directly
            </h3>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Account &amp; identity data:</strong> When you sign up or authenticate, we
                collect your name, email address, email verification status, and avatar image.
                Authentication is handled by our third-party provider (see Section 6), which shares
                this information with us to create and maintain your account.
              </li>
              <li>
                <strong>Profile data:</strong> You may voluntarily provide a bio, cultural
                background, location, spoken languages (with proficiency levels), and preferred
                content language. You control what you share in your profile; only fields you fill
                in are stored.
              </li>
              <li>
                <strong>Contribution data:</strong> When you contribute language content (words,
                phrases, translations, stories, songs, riddles, proverbs, historical entries), you
                provide the text you submit along with optional metadata such as language, dialect,
                part of speech, phonetic spelling, usage examples, and any accompanying audio or
                image attachments.
              </li>
              <li>
                <strong>Changa submissions:</strong> Through our collaborative dataset-building
                tasks, you may submit source and target text, transcripts, context notes, glosses,
                speaker profile information, and audio/image files, along with an explicit consent
                record for how that contribution may be used (training, research, or public
                release).
              </li>
              <li>
                <strong>Social &amp; community content:</strong> You may create posts (text, images,
                polls, content warnings), write comments, cast likes/reposts/validations, send
                direct messages, create or join communities, and follow or unfollow other users.
              </li>
              <li>
                <strong>Payment information:</strong> If you subscribe to a paid plan, we collect
                your billing email and the plan/tier you select. All payment processing is performed
                by Paystack (see Section 6), and we store only a subscription record referencing
                your Paystack customer code, billing events (amount, currency, reference), and plan
                status. We do not receive or store your full card details.
              </li>
              <li>
                <strong>Support &amp; feedback:</strong> When you contact support or submit feedback
                on an AI response, we collect the content of your message, the reason (for ratings),
                and any suggested correction you provide.
              </li>
              <li>
                <strong>Reports:</strong> When you report content, we collect the reported material,
                the reason(s) for the report, and the context in which it was reported.
              </li>
              <li>
                <strong>Guest usage:</strong> If you use the App without signing in, you may choose
                a display name and avatar. Guest conversations and drafts are stored only in your
                browser&apos;s local storage until you sign in, at which point they are not
                automatically synced.
              </li>
            </ul>

            <h3 className="mt-5 text-md font-semibold text-foreground">
              B. Information Collected Automatically
            </h3>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Conversation &amp; usage data:</strong> As you use the chat and translation
                features, we collect your messages, the AI responses, chosen languages, and
                translation targets so the Service can function. For paid tiers we also count chat
                messages, translation requests, and voice messages against your monthly usage
                allowance.
              </li>
              <li>
                <strong>Voice &amp; audio data:</strong> If you record and send voice messages, the
                audio is processed (transcribed, translated) by our AI providers. Audio data is only
                retained when you have granted the explicit “voice data” contribution consent, and
                you may revoke that consent at any time.
              </li>
              <li>
                <strong>AI usage &amp; cost data:</strong> We log, for each AI call, the service
                type (chat, translate, voice, etc.), the model and provider used, input/output token
                counts, estimated cost, your account tier, and whether the call succeeded — to
                manage quotas and prevent abuse.
              </li>
              <li>
                <strong>Technical &amp; device information:</strong> We (and our service providers)
                automatically receive information about your device and connection, including IP
                address, browser type and settings, device characteristics, operating system, mobile
                network, and the pages or features you access and when you access them.
              </li>
              <li>
                <strong>Analytics &amp; performance:</strong> We use Vercel Analytics to understand
                how the Service is used and to monitor page views and feature engagement for product
                improvement.
              </li>
              <li>
                <strong>Error &amp; security data:</strong> We use Sentry to collect error, crash,
                and performance data when the App encounters problems. This may include stack
                traces, device context, and the content of the request that triggered the error
                (with personally sensitive fields redacted where possible).
              </li>
              <li>
                <strong>Changa telemetry (local):</strong> A lightweight, anonymous event log of the
                task lifecycle (e.g., task claimed, uploaded, submitted) is stored in your browser’s
                local storage, capped at 500 events. It contains no raw prompts or PII and is never
                transmitted to our servers.
              </li>
              <li>
                <strong>Offline queue:</strong> If a submission fails while offline, the text answer
                is cached locally in your browser so it can be retried automatically when
                connectivity returns. Audio cannot be cached offline and must be re-recorded.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">3. How We Use Your Information</h2>
            <p className="mt-3">We use the information we collect for the following purposes:</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>To provide &amp; maintain the Service:</strong> creating and securing your
                account, authenticating you, syncing your conversations across devices, storing your
                contributions and uploaded files, and serving your social feed.
              </li>
              <li>
                <strong>To power AI features:</strong> generating chat responses, translating text,
                converting speech to text and text to speech, and retrieving reference content from
                Wikipedia/Wikimedia.
              </li>
              <li>
                <strong>To build &amp; improve language models:</strong>
                training and evaluating our AI systems on contributions that you have given explicit
                training/research consent for, including the Changa dataset-building program.
              </li>
              <li>
                <strong>To enable gamification:</strong> calculating experience points (XP), level
                progression, streaks, badges, and challenge participation.
              </li>
              <li>
                <strong>To facilitate community &amp; collaboration:</strong>
                matching you with tasks, routing submissions to reviewers for community validation,
                and distributing curated examples to dataset releases.
              </li>
              <li>
                <strong>To moderate content &amp; enforce policies:</strong>
                reviewing reported content, logging moderation actions, and applying rate limits and
                quality checks to prevent spam and abuse.
              </li>
              <li>
                <strong>To personalize your experience:</strong> recommending tasks, languages, and
                communities, and remembering your language and appearance preferences.
              </li>
              <li>
                <strong>To communicate with you:</strong> sending receipts, subscription notices,
                security alerts, feature updates, and (if opted in) email digests.
              </li>
              <li>
                <strong>To process payments:</strong> setting up and managing your subscription,
                recording billing events, and handling payment failures or retries.
              </li>
              <li>
                <strong>To monitor &amp; improve the Service:</strong> analyzing usage, debugging
                errors, measuring AI costs and quota usage, and running A/B tests.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">4. Legal Basis for Processing (GDPR)</h2>
            <p className="mt-3">
              If you are located in the European Economic Area or United Kingdom, the legal bases
              for processing your personal data are as follows:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Performance of a contract:</strong> to provide the Service, authenticate
                you, sync your data, and process your contributions and payments.
              </li>
              <li>
                <strong>Legitimate interests:</strong> to secure the Service, prevent fraud and
                abuse, monitor performance and errors, analyze usage, and send you service-related
                notifications. We rely on legitimate interests only where not overridden by your
                interests or your fundamental rights.
              </li>
              <li>
                <strong>Legal obligation:</strong> to comply with applicable law, including tax,
                accounting, and payment regulations.
              </li>
              <li>
                <strong>Your consent:</strong> where we ask for your explicit permission — for
                example, using your voice recordings or contributions for AI training, research, or
                public dataset release, and for optional marketing communications. You may withdraw
                consent at any time (see Section 9).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">5. Data Sharing &amp; Disclosure</h2>
            <p className="mt-3">
              We do not sell your personal information to third parties. We share your information
              only in the following circumstances and with appropriate safeguards in place:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Service providers &amp; processors:</strong> We share data with trusted
                third parties who assist us in operating, analyzing, and improving the Service.
                These include:
              </li>
              <ul className="ml-6 list-outside list-disc mt-2 space-y-2">
                <li>
                  <strong>Clerk</strong> — for user authentication and identity management. Clerk
                  receives your name, email, and avatar to create and manage your login session.
                  Your Clerk ID is stored alongside your Samiati profile.
                </li>
                <li>
                  <strong>Convex</strong> — our backend platform that hosts the database, real-time
                  subscriptions, file storage, and server-side functions where your conversations,
                  contributions, social content, and profile data are stored and processed.
                </li>
                <li>
                  <strong>Hugging Face</strong> — our AI model provider used for chat, translation,
                  speech-to-text, and text-to-speech. User input and (where consented) training data
                  are sent to these services to generate responses.
                </li>
                <li>
                  <strong>Paystack</strong> — our payment processor. Paystack receives your payment
                  details and handles transaction authorization. We share only the information
                  necessary to set up and manage your subscription (email and plan reference).
                  Paystack is responsible for its own compliance with PCI-DSS.
                </li>
                <li>
                  <strong>Vercel</strong> — hosts the App and provides analytics and edge
                  infrastructure.
                </li>
                <li>
                  <strong>Sentry</strong> — collects error and performance data to help us monitor
                  and fix issues.
                </li>
                <li>
                  <strong>Wikipedia &amp; Wikimedia Commons</strong> — keyless public APIs that
                  provide reference links and images for search results. No personal data is sent to
                  these sources.
                </li>
                <li>
                  <strong>Dicebear</strong> — generates default avatar images for users and guests
                  who do not upload their own.
                </li>
              </ul>
              <li>
                <strong>With your consent:</strong> We share data as expressly authorized at the
                time you provide it, such as the public release of curated contributions under the
                license or attribution preference you select in Changa.
              </li>
              <li>
                <strong>Community &amp; public features:</strong> Information you choose to share
                publicly (your profile, contributions, posts, comments, followers, and validation
                votes) is visible to other users and, where applicable, on public dataset releases
                in accordance with your chosen attribution preference.
              </li>
              <li>
                <strong>Legal compliance:</strong> We may access, preserve, or disclose your
                information when required by law, to respond to subpoenas or court orders, to
                protect the rights, property, or safety of Samiati, our users, or others, or to
                detect and prevent fraud or security issues.
              </li>
              <li>
                <strong>Business transfers:</strong> In the event of a merger, acquisition,
                reorganization, or sale of assets, your information may be transferred to the
                acquiring entity, subject to the safeguards described in this policy.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">6. Cookies &amp; Tracking Technologies</h2>
            <p className="mt-3">The Service uses cookies and similar technologies. We use:</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Authentication cookies:</strong> Clerk sets cookies necessary to
                authenticate your session and keep you logged in across visits.
              </li>
              <li>
                <strong>Functional cookies:</strong> We store your theme preference (light/dark),
                language choice, notification and privacy settings, and onboarding state locally so
                your preferences persist between sessions.
              </li>
              <li>
                <strong>Analytics:</strong> Vercel Analytics and error monitoring (Sentry) use
                cookies or similar identifiers to understand how the Service is used and to report
                on errors.
              </li>
            </ul>
            <p className="mt-3">
              You can disable cookies through your browser settings, though this may cause parts of
              the Service (such as staying signed in) to malfunction. We do not use cookies for
              targeted advertising and we do not use cookies to track your behavior across other
              sites.
            </p>
            <p className="mt-3">
              You can manage your cookie preferences at any time via the cookie-consent banner or
              the{' '}
              <a
                href="#cookie-settings"
                className="text-primary underline-offset-2 hover:underline"
              >
                cookie settings
              </a>{' '}
              link in the footer. Withdrawing consent does not delete data already collected; it
              stops future collection.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">7. Data Retention</h2>
            <p className="mt-3">
              We retain information for as long as necessary to provide the Service and to fulfill
              the purposes described in this policy, unless a longer retention period is required by
              law. Specifically:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Account &amp; profile data:</strong> retained for as long as your account is
                active. When you delete your account, we initiate a batched deletion process that
                removes your profile, posts, comments, likes, followers, bookmarks, conversations,
                messages, and Changa submissions (see Section 10).
              </li>
              <li>
                <strong>Conversation data:</strong> retained to power your chat history.
                Authenticated users may delete individual conversations from the App at any time.
                Guest conversations are stored only in your browser’s local storage and are cleared
                when you clear your browser data.
              </li>
              <li>
                <strong>Contribution &amp; Changa submission data:</strong>
                retained under the license and consent you selected. If you revoke consent or delete
                your account, your submissions are withdrawn from public releases and removed from
                active allocations, though anonymized records may persist for auditing and quality
                control.
              </li>
              <li>
                <strong>Usage &amp; AI logs:</strong> retained for a reasonable period to manage
                quotas, prevent abuse, and analyze costs.
              </li>
              <li>
                <strong>Billing &amp; payment records:</strong> retained for as long as necessary
                for tax, accounting, and audit purposes, which is typically the life of the account
                plus seven years.
              </li>
              <li>
                <strong>Local storage data:</strong> conversations, drafts, settings, and local
                Changa telemetry are stored in your browser and you can clear them at any time via
                your browser settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">8. Data Storage &amp; Security</h2>
            <p className="mt-3">
              Your personal data is stored on secure servers operated by Convex (a division of
              Confluent, Inc.) in the United States, and is protected by industry-standard technical
              and organizational measures including:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                Encryption in transit using TLS for all connections between your device, our
                servers, and our service providers.
              </li>
              <li>
                Encryption at rest for stored data and files, including uploaded audio and images
                held in Convex storage.
              </li>
              <li>
                Regular application of input sanitization and length limits to guard against
                injection and oversized payloads.
              </li>
              <li>
                Rate limiting and authentication checks on mutations to prevent abuse, sybil
                attacks, and unauthorized data access.
              </li>
              <li>
                Role-based access controls so that moderation tools and internal data operations are
                restricted to verified moderators and admins.
              </li>
              <li>
                A Content Security Policy and secure middleware configuration, including automatic
                CSRF protection for authentication routes provided by Clerk.
              </li>
            </ul>
            <p className="mt-3">
              Where your data is processed by third-party AI providers (Hugging Face) or payment
              processors (Paystack), those providers are contractually obligated to protect your
              data and use it only as directed. We retain responsibility for data shared with them
              under our instructions.
            </p>
            <p className="mt-3">
              No method of transmission over the Internet or electronic storage is 100% secure.
              While we strive to protect your data, we cannot guarantee its absolute security and
              encourage you to use secure networks and strong, unique passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">9. Your Rights &amp; Choices</h2>
            <p className="mt-3">
              Depending on your location, you have the following rights regarding your personal
              data. To exercise any of these rights, contact us at the address in Section 13:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Right of access &amp; data portability:</strong> You can request a copy of
                the personal data we hold about you. You can also export a machine-readable (JSON)
                archive of your profile, posts, comments, likes, followers, following,
                notifications, bookmarks, and conversations at any time from Settings → Data →
                “Download my data.”
              </li>
              <li>
                <strong>Right to rectification:</strong> You can correct or update your profile,
                languages, and other personal details at any time from Settings → Edit profile.
              </li>
              <li>
                <strong>Right to erasure (deletion):</strong> You can delete your account and all
                associated personal data at any time from Settings → Data → “Delete account.”
                Deletion is processed in the background and removes your posts, comments, likes,
                followers, following, bookmarks, conversations, messages, and Changa submissions.
                Certain records needed for legal, accounting, or security purposes may be retained
                in anonymized form.
              </li>
              <li>
                <strong>Right to restrict processing:</strong> You may request that we limit the use
                of your data, including pausing your subscription or limiting AI usage to your
                remaining quota.
              </li>
              <li>
                <strong>Right to object:</strong> You may object to processing based on legitimate
                interests or direct marketing. You may opt out of email digests and non-essential
                notifications at any time in Settings → Notifications.
              </li>
              <li>
                <strong>Right to withdraw consent:</strong> You may revoke consent you previously
                gave for the use of your voice data, cultural data, or contributions for
                training/research/public release at any time via Settings → Privacy controls or the
                per- submission consent record. Withdrawing consent stops future use and withdraws
                previously-releasable content, subject to the retention rules in Section 7.
              </li>
              <li>
                <strong>Right to non-discrimination:</strong> You will not receive a discriminatory
                response for exercising your privacy rights.
              </li>
              <li>
                <strong>Right to lodge a complaint:</strong> If you believe your rights have been
                infringed, you may lodge a complaint with a supervisory data protection authority in
                your country of residence.
              </li>
              <li>
                <strong>California rights (CCPA/CPRA):</strong> California residents have the right
                to (a) know what personal information is collected, (b) know whether that
                information is sold or disclosed and to whom, (c) say no to the sale or sharing of
                personal information, (d) access and (e) request deletion of personal information.
                Samiati does not sell or share your personal information for monetary or other
                valuable consideration in a manner that would trigger a “Do Not Sell or Share My
                Information” right, but you may still exercise your rights by contacting us at the
                address below. You also have the right to limit use of your “sensitive personal
                information” (such as precise geolocation or racial/ethnic origin data like cultural
                background) — you can minimize this in your profile and privacy settings.
              </li>
            </ul>
            <p className="mt-3">
              We may need to verify your identity before fulfilling a request to access or delete
              data. Where legally required, we will respond to your request within 30 days (or as
              otherwise required by law), which may be extended where permitted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">10. Consent &amp; Your Contributions</h2>
            <p className="mt-3">
              Certain features rely on your explicit consent, particularly the Changa collaborative
              dataset program:
            </p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                <strong>Contribution consent:</strong> When you submit a contribution through
                Changa, you are asked to grant consent for specific, versioned scopes (e.g.,
                storage, training, research, commercial use, public release, voice use) and select
                an attribution preference (public, private, or pseudonymous). We record the policy
                version and scopes you chose so your consent is never inferred. You may revoke
                consent for any submission, which withdraws it from future allocation or release.
              </li>
              <li>
                <strong>Voice &amp; cultural data:</strong> Your “voice data” and “cultural data”
                consent toggles are respected globally. When disabled, we will not use your voice
                recordings or cultural and linguistic content for training, research, or public
                release even if you have otherwise contributed content. You can change these toggles
                at any time in Settings → Privacy controls.
              </li>
              <li>
                <strong>Curated examples:</strong> Contributions that pass community validation and
                are promoted to curated examples retain the attribution preference you selected at
                the time of contribution.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">11. Children’s Privacy</h2>
            <p className="mt-3">
              The Service is not directed to children under the age of 13 (or the equivalent minimum
              age in your jurisdiction), and we do not knowingly collect personal information from
              children. If you believe we have inadvertently collected information from a child,
              please contact us so we can delete it. Users between 13 and the age of majority should
              review this policy with a parent or guardian.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">12. International Data Transfers</h2>
            <p className="mt-3">
              The Service is operated in the United States, and your information will be transferred
              to and processed in the United States and possibly other countries where our service
              providers operate. By using the Service, you consent to this transfer. We use
              appropriate safeguards (such as standard contractual clauses and EU-approved transfer
              mechanisms) and rely on permitted bases under applicable law, such as the necessity
              for performance of a contract, when transferring data outside your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">13. Changes to This Privacy Policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. When we do, we will revise the
              “Last updated” date at the top of this page and, where appropriate, notify you through
              the App or via email. We encourage you to review this page periodically for any
              changes. Material changes will be communicated to you before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground">14. Contact Us</h2>
            <p className="mt-3">
              If you have any questions about this Privacy Policy, your personal data, or to
              exercise your rights, please contact our Data Protection Officer / Privacy Team:
            </p>
            <p className="mt-3">
              Email:{' '}
              <a href="mailto:privacy@samiati.com" className="text-primary">
                privacy@samiati.com
              </a>
              <br />
              Support:{' '}
              <a href="mailto:support@samiati.com" className="text-primary">
                support@samiati.com
              </a>
              <br />
              Mail: Data Protection Officer, Samiati, Inc., PO Box, Nairobi, Kenya
            </p>
            <p className="mt-3 text-xs text-stone-400">
              For data subject requests, please include &ldquo;Privacy Request&rdquo; in the subject
              line and your Samiati account email or Clerk ID so we can identify and respond.
            </p>
            <div className="mt-6">
              <CookieSettingsLink className="text-xs text-stone-400 hover:text-stone-200 transition-colors" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
