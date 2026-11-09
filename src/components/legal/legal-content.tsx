import Link from 'next/link';
import type { LegalDocumentData } from './types';

const support = <a href="mailto:hasb8882@gmail.com">hasb8882@gmail.com</a>;

// Keep these dates tied to a reviewed policy revision, rather than the build date.
const policyDates = { updatedAt: '2026-11-08', effectiveDate: '2026-11-08' };

export const privacyPolicy: LegalDocumentData = {
  kind: 'privacy',
  title: 'Privacy Policy',
  description:
    'How Samiati handles your information when you learn, connect, and contribute to African languages.',
  ...policyDates,
  highlights: [
    {
      title: 'AI requests leave your device',
      description:
        'Saved chats use browser storage, but the text, context, or audio needed to answer a request is sent to our AI service providers.',
    },
    {
      title: 'Contributions have separate consent',
      description:
        'Changa training permissions are recorded with your submission. Reading this policy does not grant permission for every possible use.',
    },
    {
      title: 'You can make a privacy request',
      description:
        'Use your settings for available controls, or contact support for access, correction, deletion, and contribution withdrawal requests.',
    },
  ],
  sections: [
    {
      id: 'scope',
      title: 'Who we are and what this policy covers',
      content: (
        <>
          <p>
            Samiati (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is the operator of this
            service, based in Kenya. We provide tools for African language learning, AI assistance,
            translation, speech, community participation, and language contributions through Changa.
            This policy covers personal information handled through Samiati pages and features that
            link to it, including guest access and our waitlist.
          </p>
          <p>
            For questions about how Samiati handles your information, contact {support}. Our{' '}
            <Link href="/terms-of-service">Terms of Service</Link> explain the rules for using
            Samiati. This notice explains processing; it does not replace a separate consent request
            where consent is needed.
          </p>
          <p>
            Our handling of personal information is subject to Kenya&apos;s Data Protection Act,
            2019 and applicable regulations. We determine how information is used to run Samiati and
            act as its data controller for those purposes. Additional protections may apply where
            you live.
          </p>
        </>
      ),
    },
    {
      id: 'information-you-provide',
      title: 'Information you provide',
      content: (
        <>
          <p>Depending on the features you use, we handle:</p>
          <ul>
            <li>
              <strong>Account information:</strong> your sign-in identifier, name, username, email
              address, verification status, and profile image. Clerk manages authentication and
              account credentials.
            </li>
            <li>
              <strong>Profile information:</strong> your biography, self-reported location, cultural
              background, languages, fluency, and preferences. Language and cultural details can
              reveal sensitive information about your background; only provide what you are
              comfortable sharing.
            </li>
            <li>
              <strong>Community content:</strong> posts, words, proverbs, stories, questions,
              comments, images, follows, likes, reposts, bookmarks, community participation, and
              challenges.
            </li>
            <li>
              <strong>Messages:</strong> direct-message content, participants, timestamps, read
              status, and related messaging activity.
            </li>
            <li>
              <strong>AI inputs:</strong> prompts, conversation context, search queries, selected
              languages, translation text, attached document text, and audio or text submitted to
              speech tools.
            </li>
            <li>
              <strong>Changa contributions:</strong> entries, translations, voice recordings,
              language or dialect details, any optional speaker information you supply, reviews, and
              consent and attribution choices.
            </li>
            <li>
              <strong>Feedback and support:</strong> ratings, response excerpts, correction
              suggestions, report reasons, correspondence, and details you provide when asking for
              help.
            </li>
          </ul>
          <p>
            Avoid submitting passwords, payment credentials, identity documents, health records, or
            another person&apos;s private information in chat, community posts, recordings, or
            contribution tasks.
          </p>
        </>
      ),
    },
    {
      id: 'automatic-and-payment-data',
      title: 'Information from use, payments, and other sources',
      content: (
        <>
          <p>
            Our infrastructure and service providers process technical information such as IP
            address, browser and device details, page requests, timestamps, errors, and performance
            information. We also record usage counts, quota and rate-limit activity, contribution
            quality and review results, moderation history, and participation statistics such as XP
            and badges.
          </p>
          <p>
            For paid services, we keep plan and subscription status, billing periods, payment
            amounts and currencies, transaction references, and payment-provider customer or
            subscription identifiers. Paystack collects payment details on its checkout.
            Samiati&apos;s billing records do not include your full card number or card security
            code.
          </p>
          <p>
            We receive account details from your authentication provider, payment confirmations from
            Paystack, and information other users provide when they interact with or report content
            involving you. Our waitlist records a signed-in account identifier or generated browser
            visitor identifier, join time, and position; the current join form does not request an
            email address.
          </p>
        </>
      ),
    },
    {
      id: 'purposes-and-bases',
      title: 'Why we use information',
      content: (
        <>
          <ul>
            <li>
              <strong>Deliver the service:</strong> create and authenticate accounts, answer
              requests, store submitted material, enable interactions, process payments, and provide
              support.
            </li>
            <li>
              <strong>Keep the service usable and safe:</strong> enforce quotas, investigate abuse,
              review reports, prevent fraud, diagnose faults, and protect accounts and
              infrastructure.
            </li>
            <li>
              <strong>Improve language tools:</strong> assess feedback and quality, understand
              feature use, and develop language resources. Changa training and research uses depend
              on the applicable contribution permissions described below.
            </li>
            <li>
              <strong>Communicate and meet obligations:</strong> respond to requests, provide
              account or billing notices, keep required records, comply with law, and resolve
              disputes.
            </li>
          </ul>
          <p>
            Where the law requires a legal basis, we rely on performing our agreement with you,
            legal obligations, legitimate interests in operating and protecting Samiati where
            permitted and balanced against your rights, or consent for the specific activity. You
            may withdraw consent for future processing without making earlier lawful processing
            unlawful. We seek additional permission when required for sensitive information or a new
            purpose.
          </p>
        </>
      ),
    },
    {
      id: 'ai-and-voice',
      title: 'AI conversations, translation, and voice',
      content: (
        <>
          <p>
            Saved AI conversations currently use local storage in your browser. This does not mean
            that AI processing happens only on your device. To answer a request, Samiati sends
            relevant text, recent conversation context, language choices, document text, or audio
            through its backend to Hugging Face inference services and the model infrastructure used
            for that request. Speech recognition processes your recording; speech synthesis
            processes the text you ask to hear.
          </p>
          <p>
            Browser microphone permission lets you record audio for a feature. Permission to use the
            microphone is separate from permission to use a submitted recording for Changa model
            training. A voice recording may identify you or reveal characteristics about you even
            without a name.
          </p>
          <p>
            Sending an ordinary AI request does not itself enroll it as a Changa training
            contribution. Provider processing and retention depend on the service used and its
            applicable terms; we do not promise that inference requests have zero retention. Avoid
            sending information you cannot authorize us and the provider to process for the
            requested feature.
          </p>
        </>
      ),
    },
    {
      id: 'changa-consent',
      title: 'Changa contributions, training, and withdrawal',
      content: (
        <>
          <p>
            Changa collects language examples and recordings for review and the development of
            language resources and models. The current contribution flow requires an affirmative
            training-consent choice. We record the policy version, time, permitted purposes, and
            attribution preference associated with a submission. Signed-in peer reviewers and
            moderators may access contribution text or audio for validation and quality review.
          </p>
          <p>
            The standard Changa permission covers collecting and storing your submission, peer
            validation, and internal language-model training and evaluation. It does not authorize
            separate research studies, commercial use or licensing of contribution data, public
            dataset release, or public attribution of your name. Those purposes require a separate,
            specific opt-in describing the intended use and recipients. Internal training permission
            alone is not permission to deploy your contribution in a commercial model or paid tool;
            that use needs an additional commercial-use grant.
          </p>
          <p>
            Training consent starts unchecked. You can decline to contribute and continue using
            other available Samiati features without granting it. A task designed to collect
            training examples cannot accept a submission without its stated training permission.
            Feedback corrections also need a separate opt-in before promotion to Changa. We do not
            infer a public dataset license or wider permissions from ordinary app use or general
            acceptance of these policies. New permissions do not expand consent given for an earlier
            submission.
          </p>
          <p>
            To withdraw consent or ask about a contribution&apos;s use, email {support} with the
            task or submission identifier if available. General voice and cultural-data settings do
            not, by themselves, withdraw consent already recorded for a particular submission.
            Please make a specific withdrawal request so we can review related submissions, assets,
            and dataset copies.
          </p>
          <p>
            Withdrawal applies to future processing that relies on that consent, subject to
            applicable law. We may retain a limited consent history to document the request.
            Removing an original submission does not automatically retract copies previously
            released to others or reverse an already trained model. We will explain the action
            available in your case; these technical limits do not remove your legal rights.
          </p>
        </>
      ),
    },
    {
      id: 'visibility',
      title: 'Public content, profiles, and messages',
      content: (
        <>
          <p>
            Content you publish to community areas, together with associated profile and activity
            details, may be visible to other users and may be copied or shared by them.
            Public-profile and Changa-activity visibility are enabled by default. Review{' '}
            <Link href="/dashboard/settings/privacy">Privacy &amp; Safety settings</Link> before
            sharing material you consider private. Profile visibility is separate from the
            visibility of posts you publish and from contribution consent.
          </p>
          <p>
            Direct messages are intended for their recipients and are stored on our backend. They
            are not described or offered as end-to-end encrypted. Authorized access may be needed to
            operate the service, address a support or safety issue, or comply with law. Recipients
            can retain copies of messages you send them.
          </p>
        </>
      ),
    },
    {
      id: 'providers',
      title: 'Service providers and external services',
      content: (
        <>
          <p>
            We disclose information needed for the services you use to providers that support
            Samiati. Our current integrations include:
          </p>
          <ul>
            <li>
              <a href="https://clerk.com/legal/privacy">Clerk</a> for sign-in, account identity, and
              authentication.
            </li>
            <li>
              Convex for backend processing, database records, real-time features, and uploaded file
              storage.
            </li>
            <li>
              <a href="https://huggingface.co/privacy">Hugging Face</a> and the inference
              infrastructure serving the selected models for AI, translation, and speech requests.
            </li>
            <li>Paystack for checkout, payment verification, and billing.</li>
            <li>
              <a href="https://vercel.com/docs/analytics/privacy-policy">Vercel Web Analytics</a>{' '}
              for website usage measurement. Where configured, Sentry supports error and performance
              diagnostics.
            </li>
            <li>
              <a href="https://policies.google.com/privacy">Google Fonts</a> for fonts loaded by the
              website. External image hosts receive ordinary browser requests when their images are
              displayed.
            </li>
            <li>
              Where SMS is available, Twilio and mobile carriers for phone numbers, message
              delivery, and message content. Wikimedia services receive search requests when you use
              encyclopedia lookup features.
            </li>
          </ul>
          <p>
            Some providers act on our instructions; others also have independent obligations, such
            as a payment provider&apos;s fraud and compliance duties. Their notices and our
            agreements explain their processing. External links lead to services with their own
            privacy practices.
          </p>
        </>
      ),
    },
    {
      id: 'other-disclosures',
      title: 'Other disclosures and sale of information',
      content: (
        <>
          <p>
            We may disclose relevant information to comply with a lawful request, investigate fraud
            or abuse, protect a person&apos;s safety or rights, or establish or defend legal claims.
            If Samiati undergoes a merger, acquisition, financing, or transfer of assets,
            information may be reviewed or transferred as part of that process, subject to
            applicable protections and required notice.
          </p>
          <p>
            We do not sell your personal information or provide it to advertisers for cross-service
            targeted advertising. We may also share information when you request it or give specific
            permission, including an authorized contribution release under its separate terms.
          </p>
        </>
      ),
    },
    {
      id: 'browser-storage',
      title: 'Cookies, browser storage, and analytics',
      content: (
        <>
          <p>
            Authentication uses cookies or comparable session technologies. Samiati also uses
            browser local storage for saved AI conversations, the active chat, device preferences,
            cached account settings, muted words, blocked accounts, Changa drafts, and a waitlist
            visitor identifier. Local Changa activity events record task, language, event type, and
            time, rather than the raw answer text; the local log is capped at 500 events.
          </p>
          <p>
            Vercel Web Analytics measures visits and page use. Operational hosting logs and
            configured diagnostic tools may process technical request and error data separately. Do
            not put private information in page URLs.
          </p>
          <p>
            You can manage cookies and site data in your browser and revoke microphone access in its
            permissions settings. Clearing site data can permanently remove local chats and drafts,
            reset preferences, or sign you out. It does not delete server records or withdraw
            contribution consent. Account deletion likewise does not automatically clear data stored
            in each browser you have used.
          </p>
        </>
      ),
    },
    {
      id: 'retention',
      title: 'How long information is kept',
      content: (
        <>
          <p>
            Retention depends on the information and purpose: whether your account or contribution
            is still active, whether a request remains unresolved, and whether records are needed
            for billing, fraud prevention, consent evidence, legal obligations, or a dispute. We aim
            to delete or de-identify information when it is no longer needed for an authorized
            purpose. A single fixed retention period does not apply to every type of information.
          </p>
          <p>
            Local chats and drafts remain in the browser until removed or cleared. Server records,
            uploads, provider records, backup copies, and previously released contribution copies
            have separate lifecycles. We cannot promise immediate erasure from every system. Contact
            us for the retention information relevant to your data or request.
          </p>
        </>
      ),
    },
    {
      id: 'rights-and-controls',
      title: 'Your rights, exports, and deletion requests',
      content: (
        <>
          <p>
            Depending on the law that applies, you may have rights to learn how your data is used,
            access it, correct it, request deletion or a portable copy, object to or restrict
            processing, withdraw consent, and challenge a decision affecting you. These rights may
            have legal exceptions.
          </p>
          <ul>
            <li>
              Update available profile details through your account and use{' '}
              <Link href="/dashboard/settings/privacy">Privacy &amp; Safety</Link> to review
              visibility and preference controls.
            </li>
            <li>
              <Link href="/dashboard/settings/data">Data &amp; Storage</Link> provides a JSON export
              of selected account and social data. It is not a complete copy of every record:
              browser-local conversations, messages, Changa, feedback, and billing data may need a
              separate request or local export.
            </li>
            <li>
              The account-deletion control opens the authentication provider&apos;s account panel.
              Deleting your sign-in identity does not by itself confirm deletion of every Samiati
              database record or uploaded file. For a full Samiati deletion request, also contact{' '}
              {support}.
            </li>
          </ul>
          <p>
            Include your account identifier and the request&apos;s scope, but never send your
            password or full payment details. We may ask for proportionate identity verification or
            proof of authority before releasing or deleting information. We respond within the time
            required by applicable law and explain any lawful reason for retaining information or
            declining part of a request.
          </p>
          <p>
            You may complain to your local data protection authority. If Kenyan data protection law
            applies, you can contact the{' '}
            <a href="https://www.odpc.go.ke/">Office of the Data Protection Commissioner (ODPC)</a>.
            You do not need to contact us first to exercise a statutory complaint right.
          </p>
        </>
      ),
    },
    {
      id: 'international-processing',
      title: 'International processing',
      content: (
        <>
          <p>
            Samiati uses cloud and AI providers whose systems and personnel may be outside the
            country where you live. Consequently, account information, content, and requests may be
            processed internationally. We do not promise that all information is hosted in Kenya or
            in any single country.
          </p>
          <p>
            Where cross-border transfer rules apply, transfers must use an appropriate legal basis
            and the safeguards those rules require. Contact {support} to ask about the providers,
            destinations, and safeguards relevant to a particular feature. Using Samiati is not a
            blanket waiver of transfer protections or a substitute for any legally required consent.
          </p>
        </>
      ),
    },
    {
      id: 'security',
      title: 'Security and account protection',
      content: (
        <>
          <p>
            Samiati uses provider-managed authentication, access checks, request validation, and
            usage controls to help protect the service. No online service, browser storage, or
            transmission method can be guaranteed secure. Use a trusted device, protect your sign-in
            account, and avoid saving private conversations on a shared browser.
          </p>
          <p>
            Report suspected unauthorized access or an exposure to {support}. Where an incident
            requires notification, we will notify affected people and authorities as required by the
            law that applies.
          </p>
        </>
      ),
    },
    {
      id: 'children',
      title: 'Minimum age: 18 and over',
      content: (
        <>
          <p>
            Samiati is currently for adults aged 18 or older. People under 18 may not create an
            account, join the waitlist, use interactive features, or submit personal information,
            messages, or voice recordings. Parental permission does not create an exception under
            this launch policy. We do not currently offer a child or school account program.
          </p>
          <p>
            This is Samiati&apos;s eligibility rule, rather than a claim that Kenyan law prohibits
            every service for children. If you believe we hold a child&apos;s information, contact{' '}
            {support}. We will assess the report, restrict the affected account or processing as
            appropriate, and delete information not lawfully required to be retained.
          </p>
        </>
      ),
    },
    {
      id: 'updates-and-contact',
      title: 'Policy updates and contact',
      content: (
        <>
          <p>
            We may revise this policy when features, providers, or legal requirements change. The
            dates above identify this revision. For material changes, we will provide notice through
            an appropriate channel and request fresh consent where the law requires it. New
            contribution permissions are not applied retroactively merely by updating this page.
          </p>
          <p>
            Send privacy questions or requests to {support} with the subject &quot;Privacy
            request&quot; and enough detail to identify the feature or information involved.
          </p>
        </>
      ),
    },
  ],
};

export const termsOfService: LegalDocumentData = {
  kind: 'terms',
  title: 'Terms of Service',
  description:
    'The rules and responsibilities for using Samiati, its AI tools, community spaces, and Changa.',
  ...policyDates,
  highlights: [
    {
      title: 'Use language tools thoughtfully',
      description:
        'AI answers, translations, and speech can be wrong. Check important meanings, cultural context, and decisions with a qualified person.',
    },
    {
      title: 'Your content remains yours',
      description:
        'You give us the permissions needed to run the service. Changa training and dataset uses have separate contribution permissions.',
    },
    {
      title: 'Plans have limits and conditions',
      description:
        'Your first paid subscription payment has a seven-day full-refund guarantee. Review billing conditions and contact us for cancellation or payment problems.',
    },
  ],
  sections: [
    {
      id: 'agreement',
      title: 'Your agreement with Samiati',
      content: (
        <>
          <p>
            These Terms govern your access to Samiati (&quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;), including its website, AI assistance, translation and speech tools,
            community features, Changa contributions, and other services that link to these Terms
            (the &quot;Services&quot;). By using the Services, you agree to these Terms. If you do
            not agree, do not use the Services.
          </p>
          <p>
            The operator and party to these Terms is Samiati, based in Kenya. Legal notices, privacy
            requests, subscription cancellations, and refund requests can be sent to {support}.
          </p>
          <p>
            Our <Link href="/privacy-policy">Privacy Policy</Link> explains how information is
            handled. Feature-specific contribution permissions and purchase conditions apply to
            their stated subject. A separately signed organizational agreement controls where it
            expressly conflicts with these Terms for the services it covers. Questions can be sent
            to {support}.
          </p>
        </>
      ),
    },
    {
      id: 'eligibility',
      title: 'Eligibility and authority',
      content: (
        <>
          <p>
            You must be at least 18 years old, legally permitted to use the Services, and able to
            enter this agreement. This age rule applies to accounts, guest interactive features, the
            waitlist, purchases, and Changa contributions. If you are under 18, do not register or
            submit personal information or recordings. Parental permission does not override this
            launch policy. By registering or using an interactive feature, you confirm that you meet
            these requirements.
          </p>
          <p>
            If you use Samiati for an organization, you confirm that you are authorized to act for
            it. You must also comply with applicable law and the permissions or restrictions
            applying to the material you submit.
          </p>
        </>
      ),
    },
    {
      id: 'accounts',
      title: 'Accounts, guests, and account security',
      content: (
        <>
          <p>
            Some features are available to guests; others require a signed-in account or a paid
            plan. Give accurate registration information, keep it current, and protect your
            authentication credentials. Do not impersonate another person, use an account without
            permission, or create accounts to evade restrictions. Notify {support} if you suspect
            unauthorized use.
          </p>
          <p>
            You are responsible for activity you authorize through your account. Guest and
            browser-local data may be lost if browser storage is cleared, the device is changed, or
            a session ends. A sign-in or paid plan does not, by itself, guarantee that browser-local
            chat history is backed up or synchronized between devices.
          </p>
        </>
      ),
    },
    {
      id: 'service-and-ai',
      title: 'Service scope and AI limitations',
      content: (
        <>
          <p>
            Samiati helps people explore African languages and cultural knowledge. Features,
            language coverage, models, and integrations may vary by availability, account type, and
            plan. Generated text, translations, transcriptions, pronunciations, search summaries,
            and community entries may be inaccurate, incomplete, biased, or inappropriate for a
            particular dialect or cultural setting.
          </p>
          <p>
            Review important output before relying on, publishing, or acting on it. Use a qualified
            human for legal, medical, financial, safety-critical, official, or other consequential
            decisions and translations. Samiati does not provide a certified translation or
            professional advisory relationship merely by answering a request. Do not present
            generated material as independently verified when it has not been checked.
          </p>
        </>
      ),
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable use',
      content: (
        <>
          <p>You must not use the Services to:</p>
          <ul>
            <li>
              Break the law, defraud people, impersonate others, or infringe intellectual property,
              privacy, or other legal rights.
            </li>
            <li>
              Threaten, harass, exploit, or abuse people; promote violence or hatred; distribute
              sexual exploitation material; or endanger children.
            </li>
            <li>
              Upload malware, attempt unauthorized access, expose another person&apos;s private
              information, or interfere with the service or its security.
            </li>
            <li>
              Evade charges, quotas, moderation actions, or access restrictions through account
              rotation, automation, or other means.
            </li>
            <li>
              Flood the service with spam, manipulate reviews or rankings, submit fabricated
              language examples, or misrepresent copied or synthetic recordings as your own
              authentic contributions.
            </li>
            <li>
              Scrape or redistribute private content, collect personal information without
              authorization, or carry out bulk automated access that is not permitted by an
              applicable license or written agreement.
            </li>
          </ul>
          <p>
            Respect speakers, dialects, and communities. Do not submit confidential, sacred,
            restricted, or community-held cultural material without the authority and permissions
            needed for the proposed use.
          </p>
        </>
      ),
    },
    {
      id: 'your-content',
      title: 'Your content and the permissions you give us',
      content: (
        <>
          <p>
            You retain the ownership rights you have in material you submit, including text, images,
            messages, recordings, and language entries (&quot;Your Content&quot;). You confirm you
            have the rights and permissions necessary to submit it, including permission from anyone
            whose voice, image, or private information it contains.
          </p>
          <p>
            You give Samiati a non-exclusive, worldwide, royalty-free permission to host, store,
            copy, process, format, and transmit Your Content as needed to provide, secure, and
            maintain the features you use. For material you choose to publish, this includes
            displaying and distributing it to the intended audience. We may use service providers
            for these purposes. This permission does not transfer ownership to Samiati or grant a
            general right to sell your private content.
          </p>
          <p>
            This operational permission lasts while needed to provide the relevant service and for
            lawful retention, backups, or dispute resolution after removal. Copies already received
            by others may remain outside our control. Model training and dataset release through
            Changa are governed by the separate permissions below, rather than inferred from this
            general content license.
          </p>
        </>
      ),
    },
    {
      id: 'generated-output',
      title: 'AI output and third-party material',
      content: (
        <>
          <p>
            To the extent we hold transferable rights in output generated for you, we assign those
            rights to you, subject to applicable law and the rights and terms of relevant model or
            content providers. We cannot guarantee that an output is copyrightable, unique, or free
            of third-party rights. Other users may receive similar output.
          </p>
          <p>
            You are responsible for reviewing the output&apos;s suitability and the permissions
            needed for your intended use. Source text, encyclopedia content, linked articles,
            community submissions, and other third-party materials retain their own licenses and
            attribution requirements.
          </p>
        </>
      ),
    },
    {
      id: 'changa',
      title: 'Changa participation and contribution consent',
      content: (
        <>
          <p>
            Changa offers language contribution and validation tasks such as vocabulary entries,
            phrase or sentence translations, and voice reading. Follow the task instructions,
            contribute material you are entitled to provide, and review others&apos; work honestly.
            A task submission is not a guarantee of acceptance, publication, payment, or inclusion
            in a model.
          </p>
          <p>
            You must be at least 18 to contribute, and you may submit only your own voice or
            material you have authority to provide. Do not include another person&apos;s private
            information or a child&apos;s recording. The contribution flow requires a separate
            affirmative permission for collection, storage, peer validation, and internal
            language-model training and evaluation, recorded against a consent-policy version.
            Declining it does not prevent you using other available Samiati tools.
          </p>
          <p>
            Standard training consent does not authorize separate research studies, commercial use
            or licensing, public raw-data releases, or public attribution of your name. These
            require an additional, specific opt-in. This includes an additional commercial-use grant
            before using your contribution in a commercial model or paid tool. No public dataset or
            open-source license is implied, and later policy changes do not expand previously
            recorded consent.
          </p>
          <p>
            Peer reviewers and moderators may inspect submitted text and recordings to assess
            quality. Do not reuse private review material for an unrelated purpose. You may request
            withdrawal by contacting {support}. Future consent-based use and any retained or
            previously distributed copies will be assessed as described in the{' '}
            <Link href="/privacy-policy#changa-consent">Privacy Policy</Link> and applicable law. A
            settings toggle alone does not withdraw an existing submission&apos;s recorded consent.
          </p>
          <p>
            XP, streaks, badges, titles, and rankings indicate participation. They have no cash
            value and do not create an employment relationship or an entitlement to compensation.
            Any paid campaign requires separate, express payment terms.
          </p>
        </>
      ),
    },
    {
      id: 'community-and-moderation',
      title: 'Community visibility, moderation, and appeals',
      content: (
        <>
          <p>
            Think carefully before posting in public spaces. Other people may access, quote, or
            retain published material. Profile settings do not guarantee removal of public posts or
            copies made by others. We do not endorse every community contribution and cannot
            guarantee that every entry or interaction is reviewed.
          </p>
          <p>
            We may review reports, request corrections, restrict distribution, remove content,
            suspend contributions, or limit accounts when reasonably needed to enforce these Terms,
            protect people, or comply with law. Action may be immediate for urgent safety, fraud, or
            legal reasons. Where appropriate and permitted, we will explain the reason and allow you
            to respond.
          </p>
          <p>
            Use the available report controls or email {support} to report abuse, dispute a
            moderation decision, or request a review. Include the content or account identifier and
            relevant context. We do not promise a particular outcome or immediate removal solely
            because a report was made.
          </p>
        </>
      ),
    },
    {
      id: 'plans-and-payments',
      title: 'Plans, payment, and usage limits',
      content: (
        <>
          <p>
            Free and paid plans provide different access and usage allowances. Review the{' '}
            <Link href="/pricing">pricing page</Link>, your checkout, and any written offer for the
            price, currency, billing interval, included features, and applicable limits before
            purchasing. Do not purchase based on an expectation that an announced or planned feature
            will become available.
          </p>
          <p>
            Paystack processes payments. You authorize the payment you confirm and, only where
            expressly disclosed and agreed at checkout, recurring charges for the subscription
            selected. Applicable taxes, payment-method charges, and currency conversion costs may
            affect the amount charged; your payment provider may impose its own fees.
          </p>
          <p>
            Usage allowances may have different reset windows. Request-size limits, rate limits, and
            abuse controls can apply in addition to a plan&apos;s displayed allowance. Unused
            allowance is not money and does not carry forward unless your offer says it does. We may
            restrict access following failed or fraudulent payment, subject to any notice and
            remedies required by law. Future price or material plan changes will be disclosed before
            they apply to a new purchase or renewal where required.
          </p>
        </>
      ),
    },
    {
      id: 'cancellations-and-refunds',
      title: 'Cancellation, plan changes, and refunds',
      content: (
        <>
          <p>
            You can request cancellation or a plan change through{' '}
            <Link href="/settings/billing">Billing &amp; Subscription</Link> or by contacting{' '}
            {support}. You may request cancellation at any time. We will confirm its effective date,
            the effect on paid access, and that future renewal charges have been stopped. If the
            billing screen does not provide that confirmation, email us. Signing out, clearing
            browser data, or deleting a sign-in account does not itself cancel a subscription.
          </p>
          <p>
            <strong>Seven-day first-payment guarantee.</strong> If you request a refund within seven
            calendar days of your first successful paid subscription charge, we will refund that
            payment in full. No reason or usage threshold is required. This voluntary guarantee is
            available once per customer and does not restart when you change plans or create another
            account. Paid access associated with that payment ends when it is refunded.
          </p>
          <p>
            <strong>Other payments and problems.</strong> Renewals, upgrades, and later purchases do
            not automatically qualify for that voluntary guarantee, and ordinary cancellation after
            the window does not automatically earn a prorated refund. We will review duplicate,
            incorrect, or unauthorized charges, charges after confirmed cancellation, and material
            failures to provide a paid service for the correction or refund due, even outside the
            seven-day window.
          </p>
          <p>
            To request a refund, email {support} from your account email where possible and include
            the transaction reference and payment date. For the first-payment guarantee, simply say
            you want the seven-day refund; for a payment problem, describe what happened. Do not
            send full card details. Approved refunds go to the original payment method where
            possible; we will confirm processing, and the time to appear depends on Paystack and
            your bank or payment provider. Any alternative method must be agreed with you securely.
          </p>
          <p>
            This guarantee adds to your rights under Kenya&apos;s Consumer Protection Act and any
            other applicable mandatory consumer law. A longer statutory cancellation or refund
            entitlement takes priority. Nothing here removes rights arising from missing purchase
            disclosures, an agreement copy, misrepresentation, or an unprovided service. Starting to
            use the Services does not by itself waive a statutory right that requires a separate
            express agreement to waive.
          </p>
        </>
      ),
    },
    {
      id: 'third-party-services',
      title: 'Third-party services and SMS',
      content: (
        <>
          <p>
            Authentication, hosting, AI inference, payments, and some content sources depend on
            other providers. Their availability, technical restrictions, and applicable terms may
            affect a feature. Links to external sites do not make their content or practices part of
            Samiati.
          </p>
          <p>
            Where SMS features are available, you authorize delivery of the reply or message you
            request to the number you provide or use. Use only a number you are entitled to use.
            Carrier message or data charges may apply, and delivery can be delayed or fail. SMS is
            not a confidential channel for sensitive material and must not be relied on for
            emergency communication. Requesting an SMS reply is not blanket permission for unrelated
            promotional messages.
          </p>
        </>
      ),
    },
    {
      id: 'samiati-rights',
      title: 'Samiati intellectual property',
      content: (
        <p>
          Samiati and its licensors retain rights in the Services&apos; software, branding, design,
          and materials, apart from rights belonging to you or other content owners. We give you
          permission to access the Services for their intended use while you comply with these
          Terms. Do not misrepresent affiliation with Samiati or use its branding in a way that
          implies an endorsement without permission. Open-source components and separately licensed
          materials remain governed by their respective licenses; nothing here limits rights that
          cannot lawfully be restricted.
        </p>
      ),
    },
    {
      id: 'copyright-and-cultural-rights',
      title: 'Copyright, privacy, and cultural-rights complaints',
      content: (
        <>
          <p>
            If you believe material violates your rights, email {support} with a description of the
            work or right involved, the exact location of the disputed material, your contact
            information, and an explanation of your authority to complain. Include a good-faith
            statement that the disputed use is unauthorized and that the information you supply is
            accurate. Provide a signature or further legal notice details when required by the law
            that applies.
          </p>
          <p>
            We may ask for clarification, restrict the material while assessing the complaint, and
            contact the contributor where appropriate. Do not submit knowingly false claims. This
            process does not replace any statutory notice or court procedure available to you.
          </p>
        </>
      ),
    },
    {
      id: 'availability-and-termination',
      title: 'Changes, availability, and ending use',
      content: (
        <>
          <p>
            Services may be interrupted by maintenance, provider outages, security issues, or other
            events. Preview and pilot features may change, contain errors, or be withdrawn. We may
            update or discontinue features, with appropriate notice and any remedy required for a
            materially affected paid service. We do not guarantee uninterrupted availability or
            permanent storage of your content.
          </p>
          <p>
            You may stop using Samiati at any time. Address subscription cancellation separately and
            export material you need before closing your account. We may suspend or end access for
            material violations, unlawful conduct, security risks, nonpayment, or discontinuation of
            the Services, subject to applicable law. Where reasonably possible, we will give notice
            and an opportunity to address the issue or retrieve content.
          </p>
          <p>
            Account closure does not erase amounts already due or override separate contribution
            permissions, statutory data rights, or justified retention. Ownership, accrued payment
            obligations, dispute provisions, and other terms intended to survive will continue as
            applicable.
          </p>
        </>
      ),
    },
    {
      id: 'warranties-and-liability',
      title: 'Warranties and responsibility for loss',
      content: (
        <>
          <p>
            To the extent permitted by applicable law, the Services are provided &quot;as is&quot;
            and &quot;as available&quot; without additional promises that they will meet every
            requirement, be error-free, or produce accurate or unique results. You remain
            responsible for your submitted material and your decisions about using the output.
          </p>
          <p>
            To the extent the law permits, Samiati is not responsible for indirect or consequential
            losses, lost profits, or loss caused by reliance on unchecked output or events outside
            its reasonable control. Responsibility for other losses is determined under applicable
            law. Nothing in these Terms limits liability for fraud, willful misconduct, or any
            liability or consumer protection that the law does not allow us to exclude.
          </p>
        </>
      ),
    },
    {
      id: 'disputes',
      title: 'Complaints and disputes',
      content: (
        <>
          <p>
            Contact {support} with a description of a dispute, relevant account or transaction
            references, and the outcome you seek. We encourage a good-faith attempt to resolve it
            directly. This does not prevent you from using a regulator, a court, or another remedy
            available by law, including urgent relief.
          </p>
          <p>
            These Terms are governed by the laws of Kenya, and disputes may be brought before a
            competent court in Kenya. This does not remove mandatory consumer protections or a right
            to use a court or regulator where you live when the law gives you that right. These
            Terms do not require private arbitration, waive class-action rights where available, or
            shorten a statutory claim period.
          </p>
        </>
      ),
    },
    {
      id: 'updates-and-general',
      title: 'Updates and general provisions',
      content: (
        <>
          <p>
            We may update these Terms as the Services or legal requirements change. We will update
            the dates on this page and give appropriate notice of material changes before they apply
            where required. Continuing to use the Services after a validly notified change takes
            effect constitutes acceptance to the extent permitted by law. If a change requires your
            express agreement or new contribution consent, continued use alone does not replace it.
          </p>
          <p>
            If a provision is unenforceable, the remaining provisions continue to apply so far as
            the law permits. A delay in enforcing a provision does not waive it. These Terms,
            applicable feature and purchase conditions, and any separate signed agreement describe
            the agreement for the Services they cover. They do not displace rights provided by law.
          </p>
        </>
      ),
    },
    {
      id: 'contact',
      title: 'Contact Samiati',
      content: (
        <p>
          For questions about these Terms, billing, content rights, or a complaint, contact{' '}
          {support}. Include the relevant feature, content location, or transaction reference so we
          can investigate. For information requests and contribution withdrawal, see our{' '}
          <Link href="/privacy-policy#rights-and-controls">Privacy Policy</Link>.
        </p>
      ),
    },
  ],
};
