import Link from 'next/link';
import SamiatiLogo from '@/components/SamiatiLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — Samiati',
  description:
    'Samiati Terms of Service — a community platform for African language preservation, AI chat, and crowdsourced data collection.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <SamiatiLogo size={36} variant="primary" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="text-sm text-stone-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-display">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground/70">
          <section>
            <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-3">
              These Terms of Service (â€œTermsâ€) govern your access to and use of the Samiati
              platform, including the website at samiati.com, the mobile application, and all
              related features, content, and services (collectively, the â€œServiceâ€ or â€œAppâ€).
              Samiati, Inc. (â€œSamiatiâ€, â€œweâ€, â€œusâ€, or â€œourâ€) is a community-driven
              platform for the preservation, revitalization, and study of African languages and
              cultural heritage.
            </p>
            <p className="mt-3">
              By creating an account, browsing, posting, contributing, or otherwise using the
              Service, you agree to be bound by these Terms and our Privacy Policy, which is
              incorporated by reference. If you do not agree to all of these Terms, you must not use
              the Service. You also agree that you will use the Service only in accordance with
              these Terms and all applicable laws.
            </p>
            <p className="mt-3">
              We may update these Terms from time to time. Material changes will be communicated
              through the Service or by email at least thirty (30) days before they take effect, and
              the revised Terms will be posted with a new â€œLast updatedâ€ date. Continued use of
              the Service after any change constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              2. Account Registration and Eligibility
            </h2>
            <p className="mt-3">
              To access certain features of the Service you must register for an account. When you
              register you must provide accurate, current, and complete information. You are
              responsible for maintaining the confidentiality of your account credentials and for
              all activity that occurs under your account.
            </p>
            <p className="mt-3">
              You represent and warrant that you are at least thirteen (13) years of age (or the
              minimum age of digital consent in your jurisdiction, if higher) and that you have the
              legal capacity to enter into these Terms. The Service is not directed to children
              under that age. You further represent that you are a natural person and not an
              automated system, bot, or script.
            </p>
            <p className="mt-3">
              Authentication is handled by our third-party identity provider. You agree that we may
              rely on the identity information provided by that provider to create and manage your
              account, and you agree to comply with that providerâ€™s terms as well.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">3. Guest Access and Demo Mode</h2>
            <p className="mt-3">
              You may use certain features of the Service without registering by creating a guest
              profile with a display name and avatar. Guest conversations, drafts, and settings are
              stored only in your browserâ€™s local storage. They are not synced to our servers and
              are not retrievable if you clear your browser data, switch devices, or delete your
              account.
            </p>
            <p className="mt-3">
              The Service may operate in a â€œdemo modeâ€ using mock providers when certain
              configuration is absent. Demo mode is provided for development and evaluation only and
              does not constitute a guarantee of production availability, accuracy, or performance.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">
              4. User Responsibilities and Prohibited Conduct
            </h2>
            <p className="mt-3">
              You are responsible for your conduct on the Service and for any content you post,
              submit, or transmit. You agree to use the Service lawfully, respectfully, and in a
              manner that does not interfere with or impair the Service for others.
            </p>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>
                Post, submit, or transmit content that is unlawful, defamatory, harassing, hateful,
                sexually explicit, or infringing of third-party rights.
              </li>
              <li>
                Impersonate any person or entity, or misrepresent your identity, affiliation, or the
                origin of content.
              </li>
              <li>
                Upload or distribute malware, viruses, or any code designed to damage, disrupt, or
                exploit the Service or any third party.
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, its databases, or any underlying
                systems, including through scraping, probing, or automated means.
              </li>
              <li>
                Use automated tools, bots, scripts, or manual processes to extract, collect, or
                aggregate content from the Service for any purpose without our prior written
                consent.
              </li>
              <li>
                Interfere with, disrupt, or attempt to overload the Service, including by exceeding
                usage limits or exploiting rate-limit behavior.
              </li>
              <li>
                Submit false, low-quality, or deliberately misleading contributions to the
                crowdsourced data collection systems, including Changa.
              </li>
              <li>
                Manipulate or attempt to manipulate gamification systems such as XP, levels,
                streaks, badges, reputation, or validation outcomes.
              </li>
              <li>Solicit, collect, or harvest personal information of other users.</li>
              <li>
                Engage in any conduct that violates these Terms, our Privacy Policy, or applicable
                law.
              </li>
            </ul>
            <p className="mt-3">
              We reserve the right to investigate, review, and take actionâ€”including content
              removal, rate limiting, suspension, or account terminationâ€”against any user who
              violates these Terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">5. User-Generated Content and Licenses</h2>
            <p className="mt-3">
              â€œUser-Generated Contentâ€ means any content you post, submit, or transmit through
              the Service, including text, audio, images, video, translations, contributions, posts,
              comments, messages, and profile information. You retain ownership of your
              User-Generated Content.
            </p>
            <p className="mt-3">
              By posting or submitting User-Generated Content, you grant Samiati a worldwide,
              non-exclusive, royalty-free, sublicensable, and perpetual license to host, store,
              reproduce, display, distribute, prepare derivative works of, and otherwise use that
              content in connection with operating and improving the Service and fulfilling the
              purposes described in these Terms.
            </p>
            <p className="mt-3">
              You warrant that you have all necessary rights, licenses, and consents to grant the
              licenses described above and that your User-Generated Content does not infringe any
              third-party intellectual property or privacy rights. You further warrant that your
              User-Generated Content is accurate to the best of your knowledge.
            </p>
            <p className="mt-3">
              Nothing in these Terms transfers ownership of your User-Generated Content to Samiati.
              You remain the owner, and Samiatiâ€™s rights are limited to the license granted above.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">
              6. Changa: Crowdsourced Data Collection and Consent
            </h2>
            <p className="mt-3">
              Changa is Samiatiâ€™s community contribution program through which users help build
              language datasets. It involves task templates, task claiming, submission, blind
              community validation, curation, and dataset releases. By participating in Changa you
              agree to the additional rules in this section.
            </p>
            <h3 className="mt-5 text-md font-semibold text-white">
              6.1 Task Contracts and Submissions
            </h3>
            <p className="mt-3">
              Each Changa task is governed by a versioned task template that defines its input
              schema, output schema, required consent scopes, risk tier, and destination data
              product. When you claim a task you agree to produce a submission that conforms to the
              versioned contract in effect at the time of claiming.
            </p>
            <p className="mt-3">
              Submissions are subject to automated quality checks, including duplicate detection,
              language identification, transcription confidence, audio quality, PII risk, and
              profanity risk. Submissions that fail checks may be flagged for revision or rejected.
            </p>
            <h3 className="mt-5 text-md font-semibold text-white">
              6.2 Explicit Consent and Scope Management
            </h3>
            <p className="mt-3">
              Before submitting a Changa contribution you must grant explicit, granular consent for
              specific, versioned scopes. Consent is recorded per submission with the policy version
              and scopes you actually chose; consent is never inferred from a checkbox or inferred
              from a prior submission. The available scopes include collection and storage, AI
              training, research, commercial use, public release, and voice use.
            </p>
            <p className="mt-3">
              You may also maintain global toggles for voice data and cultural data. When disabled,
              we will not use your voice recordings or cultural and linguistic content for training,
              research, or public release, even if you have otherwise contributed content.
            </p>
            <h3 className="mt-5 text-md font-semibold text-white">6.3 Attribution Preferences</h3>
            <p className="mt-3">
              At the time of submission you select an attribution preference: public, private, or
              pseudonymous. This preference governs how your identity is associated with your
              contribution in public dataset releases and curated examples. You may revoke consent
              for any submission at any time, which withdraws it from future allocations and public
              releases.
            </p>
            <h3 className="mt-5 text-md font-semibold text-white">6.4 Licenses</h3>
            <p className="mt-3">
              Each Changa submission is associated with a license such as community, Creative
              Commons Attribution 4.0, Creative Commons Attribution-ShareAlike 4.0, or internal. The
              license you select governs how your contribution may be redistributed and built upon
              by third parties.
            </p>
            <h3 className="mt-5 text-md font-semibold text-white">
              6.5 Validation, Curation, and Dataset Releases
            </h3>
            <p className="mt-3">
              Submissions enter a blind review queue where trusted contributors and moderators vote.
              Submissions that pass validation may be promoted to curated examples and included in
              dataset releases with train, dev, test, or holdout split recommendations. By
              participating you agree that your validated contributions may be used in these
              releases in accordance with your consent scopes, attribution preference, and license.
            </p>
            <h3 className="mt-5 text-md font-semibold text-white">
              6.6 Reputation and Gamification
            </h3>
            <p className="mt-3">
              Changa awards experience points, levels, streaks, badges, and language-scoped roles.
              These are internal metrics of engagement and contribution quality. They do not confer
              any property or monetary right and may be modified, suspended, or reset at any time,
              including to correct abuse or manipulation.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">7. AI Features and Model Training</h2>
            <p className="mt-3">
              The Service includes AI-powered features such as chat, translation, speech-to-text,
              text-to-speech, and search. These features are provided by third-party inference
              providers and may use models that we operate or that are provided to us.
            </p>
            <p className="mt-3">
              AI-generated content is provided for informational, educational, and conversational
              purposes only. It may contain errors, inaccuracies, or hallucinations and should not
              be relied upon as a sole source of truth. You use AI features at your own risk.
            </p>
            <p className="mt-3">
              Contributions for which you have granted explicit training or research consent may be
              used to train, evaluate, or improve our AI systems and the datasets we release. We
              will not use your content for training or research without your explicit consent.
              Withdrawing consent stops future use and withdraws previously releasable content,
              subject to the retention rules in our Privacy Policy.
            </p>
            <p className="mt-3">
              We collect usage and cost data for AI callsâ€”including service type, model and
              provider, token counts, and estimated costâ€”to manage quotas and prevent abuse. This
              data is used internally and may be aggregated and anonymized for product improvement
              and reporting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              8. Social Features, Communities, and Interactions
            </h2>
            <p className="mt-3">
              The Service includes social features such as posts, comments, likes, reposts,
              validations, follows, direct messages, groups, communities, live audio rooms, and
              polls. By using these features you agree that the content you share may be visible to
              other users and, where you have chosen public visibility settings, to the public.
            </p>
            <p className="mt-3">
              Communities may be public or private. Private communities restrict membership and
              visibility to approved members. Community administrators and moderators may enforce
              community-specific rules in addition to these Terms.
            </p>
            <p className="mt-3">
              Direct messages and live audio rooms are provided as-is. We do not guarantee privacy,
              security, or persistence of communications. You should not share sensitive personal
              information through these features.
            </p>
            <p className="mt-3">
              You may block or mute other users and specific words. Blocking and muting are
              user-controlled filters and do not prevent the blocked user from creating a new
              account or from accessing the Service through other means.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              9. Moderation, Reporting, and Enforcement
            </h2>
            <p className="mt-3">
              You may report content that you believe violates these Terms. Reports are reviewed by
              our moderation team or by community moderators with appropriate roles. We may take
              action including hiding, removing, or rejecting content, warning users, or suspending
              or terminating accounts.
            </p>
            <p className="mt-3">
              Moderation decisions are made in good faith using automated checks, community
              validation, and human review. We reserve the right to make final enforcement decisions
              and to apply graduated responses based on severity and repeat history.
            </p>
            <p className="mt-3">
              Moderators and administrators are granted additional powers by us to enforce these
              Terms within their scope. They must act in accordance with our moderation policies and
              applicable law. Users who believe a moderation decision was erroneous may appeal
              through the channels we provide.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              10. Paid Plans, Subscriptions, and Billing
            </h2>
            <p className="mt-3">
              The Service offers paid subscription plans with different usage allowances, features,
              and support levels. By subscribing you agree to pay the applicable fees and to provide
              accurate billing information.
            </p>
            <p className="mt-3">
              Payment processing is handled by our third-party payment provider. We do not receive
              or store your full payment card details. We store only a subscription record
              referencing your payment customer code, billing events, and plan status.
            </p>
            <p className="mt-3">
              Subscriptions generally renew automatically at the end of each billing period unless
              canceled. You may cancel at any time from your billing settings; cancellation takes
              effect at the end of the current period and you will retain access until that time.
              Refunds are provided only as required by law or at our sole discretion.
            </p>
            <p className="mt-3">
              Unless otherwise stated, fees are quoted exclusive of taxes, levies, duties, and
              similar governmental charges. You are responsible for all applicable taxes arising
              from your purchase, except for taxes on our own income. Where required by law, we or
              our payment provider will collect and remit applicable taxes at checkout.
            </p>
            <p className="mt-3">
              Usage allowances are measured per billing period. Exceeding your planâ€™s limits may
              result in reduced functionality, rate limiting, or an upgrade prompt. We may change
              plan features, pricing, or availability with notice.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">11. Intellectual Property Rights</h2>
            <p className="mt-3">
              The Service, including its software, design, text, graphics, logos, icons, images,
              audio, video, datasets, curated examples, and documentation, is owned by Samiati, Inc.
              and its licensors and is protected by copyright, trademark, patent, trade secret, and
              other intellectual property laws.
            </p>
            <p className="mt-3">
              You grant Samiati the licenses described in Section 5 with respect to your
              User-Generated Content. Subject to those licenses, you retain ownership of your
              content and Samiati retains ownership of the Service itself.
            </p>
            <p className="mt-3">
              Datasets and curated examples released through Changa are made available under the
              licenses selected by contributors and are subject to the consent scopes and
              attribution preferences recorded at the time of contribution. Third parties may use
              released datasets in accordance with those licenses and scopes.
            </p>
            <p className="mt-3">
              Samiatiâ€™s name, logos, and branding may not be used without our prior written
              consent. You may not copy, modify, create derivative works of, decompile, reverse
              engineer, or attempt to extract the source code of the Service except as expressly
              permitted by these Terms or by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">12. Privacy and Data Processing</h2>
            <p className="mt-3">
              Our collection, use, sharing, retention, and security of personal information are
              described in our Privacy Policy, which is incorporated into these Terms by reference.
              By using the Service you consent to the processing of your information as described in
              the Privacy Policy.
            </p>
            <p className="mt-3">
              The Privacy Policy describes how we collect account and identity data, profile data,
              contribution and Changa submission data, social content, payment information,
              conversation and usage data, voice and audio data, AI usage and cost data, technical
              and device information, analytics, and error and security data.
            </p>
            <p className="mt-3">
              You have rights over your personal data including access, rectification, erasure,
              restriction, objection, portability, and withdrawal of consent, as described in the
              Privacy Policy. You may exercise these rights through the settings in the Service or
              by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">13. Childrenâ€™s Privacy</h2>
            <p className="mt-3">
              The Service is not directed to children under the age of thirteen (13) or the minimum
              age of digital consent in your jurisdiction, if higher. We do not knowingly collect
              personal information from children. If you believe we have inadvertently collected
              information from a child, please contact us so we can delete it.
            </p>
            <p className="mt-3">
              Users between the age of thirteen and the age of majority should review these Terms
              and our Privacy Policy with a parent or guardian before using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              14. Disclaimers and Limitation of Liability
            </h2>
            <p className="mt-3">
              THE SERVICE IS PROVIDED â€œAS ISâ€ AND â€œAS AVAILABLE,â€ WITHOUT WARRANTIES OF ANY
              KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, TIMELINESS,
              NON-INFRINGEMENT, AND QUIET ENJOYMENT.
            </p>
            <p className="mt-3">
              WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE
              OF VIRUSES OR OTHER HARMFUL COMPONENTS, OR THAT ANY CONTENT OR DATA WILL BE PRESERVED
              OR RETRIEVABLE.
            </p>
            <p className="mt-3">
              AI-generated content is provided for informational and educational purposes only and
              is not a substitute for professional advice. NEITHER SAMIATI NOR ITS AFFILIATES,
              OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR SERVICE PROVIDERS SHALL BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES, OR
              ANY LOSS OF PROFITS, DATA, CONTENT, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH
              THESE TERMS OR THE SERVICE, WHETHER IN CONTRACT, TORT, OR OTHERWISE, EVEN IF ADVISED
              OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              IN NO EVENT SHALL SAMIATIâ€™S TOTAL LIABILITY TO YOU FOR ALL CLAIMS IN CONNECTION WITH
              THE SERVICE EXCEED THE AMOUNT YOU PAID TO SAMIATI IN THE TWELVE (12) MONTHS PRECEDING
              THE CLAIM, OR ONE HUNDRED DOLLARS (USD 100) IF YOU HAVE NOT PAID SAMIATI ANY FEES.
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so
              these limitations may not apply to you.
            </p>
            <p className="mt-3">
              You acknowledge and agree that third-party providers, including our authentication,
              database, AI inference, payment, hosting, analytics, and error monitoring providers,
              are intended third-party beneficiaries of these Terms with respect to the disclaimers
              and limitations applicable to their services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-white">15. Account Suspension and Termination</h2>
            <p className="mt-3">
              We may suspend or terminate your account and access to the Service, with or without
              notice, for any reason, including but not limited to violation of these Terms,
              prolonged inactivity, conduct that we determine to be harmful to the Service or other
              users, or as required by law.
            </p>
            <p className="mt-3">
              Upon termination, your access to the Service will be disabled and your account data
              will be subject to the deletion process described in our Privacy Policy. You may
              export your data before termination through the settings in the Service.
            </p>
            <p className="mt-3">
              You may terminate your account at any time by deleting it in Settings. Termination
              does not entitle you to a refund of any fees paid, except as required by law.
            </p>
            <p className="mt-3">
              Provisions of these Terms that by their nature should survive terminationâ€”including
              ownership of content, licenses granted, disclaimers, limitations of liability,
              indemnification, and governing lawâ€”will survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">16. Indemnification</h2>
            <p className="mt-3">
              You agree to defend, indemnify, and hold harmless Samiati, Inc., its affiliates,
              officers, directors, employees, agents, and service providers from and against any
              claims, demands, lawsuits, losses, damages, liabilities, costs, and expenses
              (including reasonable attorneysâ€™ fees) arising out of or in connection with your
              access to or use of the Service, your User-Generated Content, your violation of these
              Terms, your violation of applicable law, or your infringement of any third-party
              rights.
            </p>
            <p className="mt-3">
              This indemnification obligation does not extend to claims arising solely from
              Samiatiâ€™s own negligence or willful misconduct.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">17. Changes to the Service</h2>
            <p className="mt-3">
              We may modify, suspend, discontinue, or restrict access to the Service or any feature
              at any time, with or without notice. We are not liable to you or any third party for
              any modification, suspension, or discontinuation of the Service.
            </p>
            <p className="mt-3">
              We may change pricing, features, and plan availability. Existing subscribers will
              generally be notified of material changes affecting their plan before they take
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              18. Copyright and Intellectual Property Complaints
            </h2>
            <p className="mt-3">
              We respect the intellectual property rights of others and expect users to do the same.
              If you believe that any content available through the Service infringes your copyright
              or other intellectual property rights, you may submit a notice to us at{' '}
              <a href="mailto:ip@samiati.com" className="text-primary">
                ip@samiati.com
              </a>
              .
            </p>
            <p className="mt-3">Your notice must include:</p>
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>Identification of the copyrighted work or right claimed to be infringed.</li>
              <li>
                Identification of the material you claim is infringing, including its location (URL
                or path) within the Service.
              </li>
              <li>Your name, address, telephone number, and email address.</li>
              <li>
                A statement that you have a good-faith belief that the disputed use is not
                authorized by the right owner, its agent, or the law.
              </li>
              <li>
                A statement, made under penalty of perjury, that the information in your notice is
                accurate and that you are the right owner or authorized to act on their behalf.
              </li>
              <li>Your physical or electronic signature.</li>
            </ul>
            <p className="mt-3">
              If we remove or disable access to allegedly infringing content, we will make a
              good-faith attempt to notify the affected user, who may submit a counter-notice under
              the same standards. We may restore the removed content if we receive a valid
              counter-notice.
            </p>
            <p className="mt-3">
              We reserve the right to remove content without prior notice where we believe
              infringement is clear, and to terminate, in appropriate circumstances, the accounts of
              users who are repeat infringers. Submitting a knowingly false notice or counter-notice
              may expose you to liability for damages, including costs and attorneys&apos; fees.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">19. Force Majeure</h2>
            <p className="mt-3">
              We will not be liable for any failure or delay in the performance of the Service to
              the extent caused by events beyond our reasonable control, including acts of God,
              natural disasters, epidemics or pandemics, war, terrorism, civil unrest, labor
              disputes, failures or interruptions of the Internet, power, or telecommunications
              infrastructure, cyberattacks or denial-of-service events, actions or failures of
              third-party providers (including our hosting, identity, database, AI inference, and
              payment providers), and governmental actions, orders, or regulations. Our obligations
              will be suspended to the extent, and for the period, that such events prevent
              performance, and we will make reasonable efforts to restore the Service where
              practicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              20. Notices and Electronic Communications
            </h2>
            <p className="mt-3">
              You consent to receive communications from us electronically, including by email to
              your registered address and through notices posted within the Service, and you agree
              that all agreements, notices, disclosures, and other communications we provide to you
              electronically satisfy any legal requirement that such communications be in writing.
            </p>
            <p className="mt-3">
              Notices we provide to you are deemed given: when posted within the Service; when sent
              to your registered email address; or, where required by these Terms, at least thirty
              (30) days before material changes to these Terms take effect. You may give legal
              notice to us at{' '}
              <a href="mailto:terms@samiati.com" className="text-primary">
                terms@samiati.com
              </a>{' '}
              with &ldquo;Legal Notice&rdquo; in the subject line, or by mail to the postal address
              in Section 25.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">21. Assignment and Transfer</h2>
            <p className="mt-3">
              You may not assign, transfer, or delegate these Terms or any of your rights or
              obligations under them, whether by operation of law or otherwise, without our prior
              written consent, and any attempt to do so without that consent is void. We may assign
              or transfer these Terms, in whole or in part, without restriction, including in
              connection with a merger, acquisition, corporate restructuring, financing, or sale of
              assets, and we will provide notice where reasonably practicable. Subject to the
              foregoing, these Terms bind and benefit the parties and their respective successors
              and permitted assigns.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">
              22. Governing Law and Dispute Resolution
            </h2>
            <p className="mt-3">
              These Terms and any dispute or claim arising out of or in connection with them shall
              be governed by and construed in accordance with the laws of Kenya, without regard to
              its conflict of law provisions.
            </p>
            <p className="mt-3">
              You agree that the courts of Nairobi, Kenya shall have exclusive jurisdiction to
              resolve any dispute, claim, or controversy arising out of or in connection with these
              Terms or the Service, except where mandatory law grants exclusive jurisdiction to a
              different forum.
            </p>
            <p className="mt-3">
              If any provision of these Terms is held to be invalid, illegal, or unenforceable, the
              remaining provisions shall remain in full force and effect. Our failure to enforce any
              provision of these Terms shall not constitute a waiver of that provision.
            </p>
            <p className="mt-3">
              You agree to attempt to resolve any dispute informally by contacting us at the address
              below before initiating formal proceedings. We will make a good-faith effort to
              resolve the dispute.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">23. Export Compliance and Sanctions</h2>
            <p className="mt-3">
              You represent and warrant that you are not located in, a citizen or resident of, or
              acting on behalf of a government or entity subject to any applicable sanctions or
              export control laws. You agree not to use the Service in violation of applicable
              export control or economic sanctions laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">24. Entire Agreement</h2>
            <p className="mt-3">
              These Terms, together with our Privacy Policy and any additional policies or rules
              published in the Service, constitute the entire agreement between you and Samiati
              concerning the Service and supersedes all prior or contemporaneous understandings,
              agreements, or representations of any kind.
            </p>
            <p className="mt-3">
              These Terms may be executed in counterparts, including electronic signatures, each of
              which shall be deemed an original and all of which together constitute one agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">25. Contact Us</h2>
            <p className="mt-3">
              If you have any questions about these Terms, to report a violation, or to exercise
              your rights, please contact us at:
            </p>
            <p className="mt-3">
              Email:{' '}
              <a href="mailto:terms@samiati.com" className="text-primary">
                terms@samiati.com
              </a>
              <br />
              Support:{' '}
              <a href="mailto:support@samiati.com" className="text-primary">
                support@samiati.com
              </a>
              <br />
              Mail: Legal Counsel, Samiati, Inc., PO Box, Nairobi, Kenya
            </p>
            <p className="mt-3 text-xs text-stone-400">
              For legal notices, please include â€œLegal Noticeâ€ in the subject line and your
              Samiati account email so we can identify and respond appropriately.
            </p>
          </section>

          <p className="mt-8 text-xs text-stone-500">
            By using the Samiati Service, you acknowledge that you have read, understood, and agreed
            to these Terms of Service.
          </p>
        </div>
      </main>
    </div>
  );
}
