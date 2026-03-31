import { Link } from 'react-router-dom'

export default function TermsPage() {
  const s = {
    page:    { minHeight: '100vh', background: '#f8f9fc', fontFamily: "'DM Sans', sans-serif" },
    header:  { background: '#002868', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: 'white', letterSpacing: 2, textDecoration: 'none' },
    backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: 'white', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif', textDecoration: 'none", display: 'inline-block' },
    body:    { maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' },
    tabs:    { display: 'flex', gap: 8, marginBottom: 40 },
    tab:     { padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    h1:      { fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#002868', marginBottom: 8 },
    updated: { fontSize: 13, color: '#8892a4', marginBottom: 40 },
    h2:      { fontSize: 18, fontWeight: 700, color: '#1a202c', marginTop: 36, marginBottom: 12 },
    p:       { fontSize: 15, color: '#4a5568', lineHeight: 1.75, marginBottom: 16 },
    ul:      { paddingLeft: 20, marginBottom: 16 },
    li:      { fontSize: 15, color: '#4a5568', lineHeight: 1.75, marginBottom: 6 },
    divider: { border: 'none', borderTop: '1px solid #e2e6ee', margin: '40px 0' },
    contact: { background: '#e6eaf5', borderRadius: 12, padding: '20px 24px', marginTop: 40 },
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <Link to="/" style={s.logo}>WASSCEPrep</Link>
        <Link to="/" style={{ ...s.backBtn, textDecoration: 'none', color: 'white' }}>← Back to Home</Link>
      </div>

      <div style={s.body}>

        {/* ── TERMS OF SERVICE ─────────────────────────────────── */}
        <div id="terms">
          <h1 style={s.h1}>Terms of Service</h1>
          <p style={s.updated}>Last updated: March 2026</p>

          <p style={s.p}>
            Welcome to <strong>WASSCEPrep</strong> ("the Service"), an online exam preparation platform
            for students sitting the West African Senior School Certificate Examination (WASSCE) in Liberia.
            By creating an account or using the Service you agree to these Terms. Please read them carefully.
          </p>

          <h2 style={s.h2}>1. Who May Use WASSCEPrep</h2>
          <p style={s.p}>
            The Service is intended for students aged 14 and above preparing for the WASSCE. By registering,
            you confirm that you are at least 14 years old or that a parent or guardian has reviewed and
            agreed to these Terms on your behalf.
          </p>

          <h2 style={s.h2}>2. Your Account</h2>
          <p style={s.p}>
            You are responsible for keeping your login credentials secure and for all activity that occurs
            under your account. You agree to provide accurate information when registering (including your
            real name and a valid email address) and to keep that information up to date.
          </p>
          <p style={s.p}>
            We reserve the right to suspend or delete accounts that are used for fraudulent purposes,
            that share login credentials with other users, or that otherwise violate these Terms.
          </p>

          <h2 style={s.h2}>3. Free and Paid Plans</h2>
          <p style={s.p}>
            WASSCEPrep offers a permanently free tier that includes access to three subjects, unlimited
            practice questions, and the AI tutor. Paid subscriptions unlock all eight subjects, timed
            mock examinations, full explanations, and essay feedback.
          </p>
          <p style={s.p}>
            Subscription fees are charged in advance and are <strong>non-refundable</strong> except where
            required by applicable law. If you believe you were charged in error, contact us within 7 days
            of the transaction.
          </p>

          <h2 style={s.h2}>4. Acceptable Use</h2>
          <p style={s.p}>You agree not to:</p>
          <ul style={s.ul}>
            <li style={s.li}>Copy, redistribute, or resell any questions, explanations, or other content from the platform.</li>
            <li style={s.li}>Use automated tools, bots, or scripts to access or scrape the Service.</li>
            <li style={s.li}>Attempt to circumvent access controls, payment systems, or usage limits.</li>
            <li style={s.li}>Share your account with others or allow multiple people to use one subscription.</li>
            <li style={s.li}>Upload, post, or transmit any content that is unlawful, harmful, or abusive.</li>
          </ul>

          <h2 style={s.h2}>5. Content and Accuracy</h2>
          <p style={s.p}>
            WASSCEPrep strives to provide accurate, WAEC-aligned content for Liberian students. However,
            we do not guarantee that all questions, answers, explanations, or AI-generated feedback are
            error-free or reflect the exact format of any specific WASSCE sitting.
            <strong> Use the platform as a study aid, not as a replacement for official syllabuses or past papers.</strong>
          </p>
          <p style={s.p}>
            AI Tutor responses and essay feedback are generated automatically and should be treated as
            a learning guide. They are not a substitute for a qualified teacher or official WAEC marking.
          </p>

          <h2 style={s.h2}>6. Intellectual Property</h2>
          <p style={s.p}>
            All original content on WASSCEPrep — including questions written by our team, explanations,
            platform design, and software code — is the property of WASSCEPrep and is protected by
            copyright. WAEC past papers reproduced on the platform are used for educational purposes.
          </p>

          <h2 style={s.h2}>7. Limitation of Liability</h2>
          <p style={s.p}>
            WASSCEPrep is provided "as is." We are not liable for any loss of data, interruption of
            service, or examination results arising from your use of the platform. Our total liability
            to you for any claim shall not exceed the amount you paid in the 30 days before the claim arose.
          </p>

          <h2 style={s.h2}>8. Changes to These Terms</h2>
          <p style={s.p}>
            We may update these Terms from time to time. We will notify you by email or by posting a
            notice on the platform. Continued use of the Service after changes take effect constitutes
            acceptance of the new Terms.
          </p>

          <h2 style={s.h2}>9. Governing Law</h2>
          <p style={s.p}>
            These Terms are governed by the laws of the Republic of Liberia.
          </p>
        </div>

        <hr style={s.divider} />

        {/* ── PRIVACY POLICY ──────────────────────────────────── */}
        <div id="privacy">
          <h1 style={s.h1}>Privacy Policy</h1>
          <p style={s.updated}>Last updated: March 2026</p>

          <p style={s.p}>
            Your privacy matters to us. This policy explains what information WASSCEPrep collects,
            how we use it, and your rights as a user.
          </p>

          <h2 style={s.h2}>1. Information We Collect</h2>
          <p style={s.p}>When you register and use WASSCEPrep, we collect:</p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Account information</strong> — your name, email address, and county (provided at registration).</li>
            <li style={s.li}><strong>Usage data</strong> — quiz scores, subjects studied, mock exam attempts, and AI tutor interactions. This helps us personalise your progress dashboard.</li>
            <li style={s.li}><strong>Payment information</strong> — if you subscribe, your payment is processed via <strong>MTN Mobile Money</strong>. WASSCEPrep never stores your mobile money PIN or full account details.</li>
            <li style={s.li}><strong>Technical data</strong> — device type, browser, and general usage analytics used to improve the platform. We do not use advertising trackers.</li>
          </ul>

          <h2 style={s.h2}>2. How We Use Your Information</h2>
          <ul style={s.ul}>
            <li style={s.li}>To create and manage your account and study progress.</li>
            <li style={s.li}>To process subscription payments and confirm access.</li>
            <li style={s.li}>To send you important account emails (confirmation, password reset, payment receipt).</li>
            <li style={s.li}>To improve question quality and platform features using anonymised, aggregated data.</li>
          </ul>
          <p style={s.p}>
            We do <strong>not</strong> sell your personal data to third parties or use it for
            advertising purposes.
          </p>

          <h2 style={s.h2}>3. Third-Party Services</h2>
          <p style={s.p}>WASSCEPrep uses the following trusted third-party services:</p>
          <ul style={s.ul}>
            <li style={s.li}><strong>Supabase</strong> — secure cloud database and authentication. Your data is stored on servers that comply with GDPR standards.</li>
            <li style={s.li}><strong>Anthropic Claude AI</strong> — powers the AI Tutor and essay feedback. Your questions are sent to Anthropic's API but are not used to train AI models.</li>
            <li style={s.li}><strong>MTN Mobile Money</strong> — processes subscription payments. Subject to MTN's own privacy policy.</li>
            <li style={s.li}><strong>Netlify</strong> — hosts the platform. Subject to Netlify's privacy policy.</li>
          </ul>

          <h2 style={s.h2}>4. Data Retention</h2>
          <p style={s.p}>
            We retain your account and study data for as long as your account is active.
            If you request account deletion, we will delete your personal data within 30 days,
            except where retention is required by law.
          </p>

          <h2 style={s.h2}>5. Your Rights</h2>
          <p style={s.p}>You have the right to:</p>
          <ul style={s.ul}>
            <li style={s.li}>Request a copy of the personal data we hold about you.</li>
            <li style={s.li}>Request correction of inaccurate data.</li>
            <li style={s.li}>Request deletion of your account and associated data.</li>
          </ul>
          <p style={s.p}>
            To exercise these rights, contact us at the email address below.
          </p>

          <h2 style={s.h2}>6. Cookies</h2>
          <p style={s.p}>
            WASSCEPrep uses browser storage (localStorage and IndexedDB) to save your study progress
            offline and keep you logged in. We do not use advertising cookies. You can clear this
            data at any time through your browser settings.
          </p>

          <h2 style={s.h2}>7. Children's Privacy</h2>
          <p style={s.p}>
            WASSCEPrep is designed for students aged 14 and above. We do not knowingly collect data
            from children under 14. If you believe a child under 14 has registered, please contact us
            and we will delete the account promptly.
          </p>

          <h2 style={s.h2}>8. Changes to This Policy</h2>
          <p style={s.p}>
            We may update this Privacy Policy as the platform evolves. We will notify registered users
            by email of any material changes.
          </p>
        </div>

        {/* ── CONTACT ──────────────────────────────────────────── */}
        <div style={s.contact}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#002868', marginBottom: 6 }}>Questions or Concerns?</div>
          <p style={{ ...s.p, marginBottom: 0 }}>
            Contact us at <strong>support@wassceprep.com</strong>. We aim to respond within 2 business days.
          </p>
        </div>

      </div>
    </div>
  )
}
