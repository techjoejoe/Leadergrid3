# **App Name**: LeaderGrid3

## Core Features:

- Tenant Creation & Clever Integration: Auto-create tenant linked to Clever.com school account. Use school Clever ID as `tenantId` for data separation.
- Admin & Group Management: Admins create/manage groups and invite other admins via secure, time-limited email links. Co-managers share access to QR codes within the tenant. Group codes unique within an admin’s group but can be reused across admins without conflict.
- QR Code Management: Admins create, edit, delete QR codes with name, description, and point values. Auto-generate daily check-in QR code at 6 AM EST and store in Firebase Storage. QR codes may be universal or group-specific. Hidden links inside QR codes track visits/scans.
- User Authentication & Roles: Firebase Authentication with email verification. Separate login flows for admins and users. Admin registration requires secret code or Super Admin approval. Persistent sessions until logout. Role-based access with separate Firebase collections for admins and users.
- Points & Leaderboards: Users earn points scanning QR codes. Real-time leaderboard updates. Detailed point history viewable by users and admins. No push notifications for leaderboard changes.
- Badge System & AI Recommendations: Admins can create/upload badges, set award criteria, and use an existing badge library/API. AI tool recommends badges to students based on points and activity history. Badges displayed in user’s trophy/badge page. Notify users when new badges are earned.
- Buzzer Functionality: Admins activate buzzer in live sessions. Users receive visual/audio feedback. Admins can award points for correct answers.
- Profile Management & Privacy: Users can update name and profile image. Show only first name + last initial on public leaderboards. Emails visible to admins only.
- Offline QR Scanning: Users can scan without internet; sync data automatically when online.
- Admin Portal & Reporting: Portal restricted to admins and super admins. Super Admin can approve/create new admins. Generate reports: engagement, ROI, badge counts, etc.
- Security & Compliance: Audit logs for major actions (QR creation, data edits, point changes). Firebase role-based access control (RBAC) for data security.
- Scalability & Integrations: Google Analytics integration for behavior tracking. Future: Twilio/SendGrid for SMS/email notifications.
- Onboarding: Optional tutorial or guided onboarding flow.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to convey trust, authority, and knowledge.
- Background color: Light Lavender (#E6E6FA), a soft and calming tone that promotes a harmonious feel.
- Accent color: Electric Violet (#8F00FF) as an attention-grabbing signal for calls to action and highlights.
- Headline font: 'Space Grotesk', a sans-serif font with a modern, slightly techy feel for headlines; Body font: 'Inter' for body text. These sans-serifs balance aesthetics with ease of reading on various devices.
- Use minimalist icons to represent actions and categories, maintaining a clean, modern aesthetic.
- Employ a card-based layout for information display. Ensure readability with generous spacing and clear hierarchy.
- Implement subtle animations for QR code scanning feedback, leaderboard updates, and badge achievements, enhancing user engagement.