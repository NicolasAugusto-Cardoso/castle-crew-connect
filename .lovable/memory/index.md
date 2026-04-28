# Memory: index.md
Updated: today

# Project Memory

## Core
- **Platform**: "Castle App" uses mobile-first design, deployed via Capacitor (native) and PWA.
- **UI UX**: Interactive controls must ALWAYS be visible on mobile (no hover states). Use `pt-safe` / `pb-safe-nav` for safe areas.
- **Feedback**: Toasts appear top-right. Message success toasts disabled.
- **Data**: Real-time queries require dual invalidation (`invalidateQueries` + `refetchQueries`).
- **Security**: User deletion follows strict cascading order.

## Memories
- [Unified White Accent](mem://design/multicolored-accent-palette) — Todas as seções usam destaque branco/prata único sobre dark mode (sem cores por aba)
- [Splash Screen](mem://design/splash-screen-animation-and-effects) — Visual effects and pre-splash gradient
- [User Deletion Cascade](mem://architecture/user-deletion-cascade-pattern) — Strict cascade order to avoid FK errors
- [Contact Messaging](mem://features/contact-messaging-system) — Role-based message visibility
- [Brand Assets](mem://design/branding) — App name and logo guidelines
- [Query Invalidation](mem://features/query-invalidation-pattern) — Dual invalidation for real-time updates
- [Unread Badges](mem://features/unread-badges) — Role-aware badge computation
- [Posts Layout](mem://features/posts-layout) — Instagram-style multi-image posts
- [Discipleship Logic](mem://features/discipleship-logic) — Filtering and collaborator assignment
- [Bible System](mem://features/bible-system) — API caching and user annotations
- [Toast Notifications](mem://design/toast-notifications) — Sonner toast positioning and styling
- [Mobile Safe Areas](mem://constraints/mobile-safe-areas) — CSS utilities for mobile notches
- [Push Notifications](mem://features/push-notifications-messaging) — Delivery via Capacitor and Supabase edge functions
- [Volunteer Role](mem://features/user-role-volunteer) — Permissions for Volunteer user role
- [Anonymous Testimonials](mem://features/anonymous-testimonials) — Nullifying author_name when anonymous
- [Chat Header Name](mem://features/chat-header-role-aware-sender-name) — Role-aware sender name display
- [Contact List Layout](mem://features/contact-list-whatsapp-style-layout) — WhatsApp-style horizontal layout
- [Gallery Empty State](mem://features/gallery-empty-state-role-aware) — Role-specific messaging for empty states
- [Dual Deployment](mem://architecture/pwa-capacitor-dual-deployment) — Coexisting PWA and Capacitor native deployments
- [Mobile-First Constraint](mem://constraints/mobile-first-application) — Mobile responsiveness as primary use case
- [Capacitor Setup](mem://architecture/capacitor-app-store-deployment-configuration) — Configs for App Store and Play Store
- [Message Edited Flag](mem://features/contact-message-edited-flag-detection) — Explicit tracking via is_edited
- [Mobile Controls](mem://constraints/mobile-interaction-controls-always-visible) — Enforcing constant visibility of interactive elements
- [Event Calendar Roles](mem://features/event-calendar-role-based-management) — Event management restricted to admins
- [Events Navigation](mem://design/navigation-events-footer-menu) — Conditional visibility of Agenda
- [PWA Immediate Update](mem://architecture/pwa-immediate-update) — SkipWaiting and immediate reloads
- [Donations Toggle](mem://features/donations-admin-toggle) — Global feature flag controlled by admins
