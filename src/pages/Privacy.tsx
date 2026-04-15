export default function Privacy() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'var(--font-body)', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Privacy Policy — InstaRatiba</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: April 15, 2026</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>1. Introduction</h2>
      <p>InstaRatiba is a CBC school timetable generation tool for Kenyan schools. This policy explains how we collect, use, and protect your information.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>2. Information We Collect</h2>
      <p>When you sign in with Google, we receive your name, email address, and profile photo (if available). We do not collect any other personal information.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>3. How We Use Your Information</h2>
      <p>Your information is used solely to authenticate your identity, personalise your experience, and associate timetables and school data with your account.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>4. Data Storage</h2>
      <p>Your data is stored securely using Google Firebase. We do not store passwords. Google Sign-In is handled entirely by Google's secure OAuth system.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>5. Data Sharing</h2>
      <p>We do not sell, trade, or share your personal information with any third parties.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>6. Data Retention</h2>
      <p>Your account data is retained as long as your account is active. You may request deletion at any time by contacting us.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>7. Children's Privacy</h2>
      <p>InstaRatiba is intended for school administrators and teachers. We do not knowingly collect data from children under 13.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>8. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal data at any time by contacting us.</p>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 24 }}>9. Contact</h2>
      <p>For any privacy concerns, contact us at <a href="mailto:angovnable@email.com" style={{ color: 'var(--primary)' }}>your@email.com</a>.</p>

      <div style={{ marginTop: 48 }}>
        <a href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>← Back to InstaRatiba</a>
      </div>
    </div>
  )
}