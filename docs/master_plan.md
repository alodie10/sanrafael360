# MASTER PLAN: Discovery & UX Enrichment - San Rafael 360

## Objective
Enhance the San Rafael 360 directory with automated data enrichment (websites, booking links) and a premium, interactive user interface.

## Phases

### Phase 1: Infrastructure & Discovery Engine
- **Data Schema**: Added `reserva_url`, `google_maps_url`, `discovery_pending`, and `discovery_verified` to the `Negocio` collection in Strapi.
- **Scraper (Discovery Service)**: A Playwright-based engine that identifies business websites and reservation links from Google Maps. 
- **Resilience**: Use of AI-optimized selectors (aria-labels, specific roles) to survive Google UI variations.

### Phase 2: Automation & Hooking
- **Strapi Lifecycles**: Implementation of `afterCreate` and `afterUpdate` hooks to trigger auto-discovery for new businesses in real-time.
- **Bulk Update**: Scripts for mass enrichment of the existing database.
- **Manual Control**: Logic to prevent overwriting of manual data entry in Strapi.

### Phase 3: Premium UI Enrichment
- **WebsitePortlet**: A "Smart Browser" component for business detail pages.
- **BookingWidget**: A high-conversion widget for appointments (Web links or WhatsApp).
- **Mobile optimization**: Smart detection to swap heavy iframes for static preview cards on mobile devices.

## Status: ACTIVE
- **Phases 1-3**: Completed and verified via E2E tests.
