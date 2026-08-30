# Product specification

## Product
Creative Ape Merch Network is a multi-tenant merchandise storefront platform owned and operated by Creative Ape Branding.

Creative Ape creates branded micro-stores for organizations. Customers buy merchandise through those stores. Creative Ape handles merchandise, artwork, printing, production, fulfillment, payment processing, reporting, and revenue sharing.

## Organization types
Business, school, sports team, club, nonprofit, event, and other.

## Roles
### Creative Ape super admin
Full platform control, including organizations, stores, products, prices, costs, revenue-share rules, orders, fulfillment, reports, and settings.

### Organization admin
Restricted to their organization. Can view their storefront, sales, eligible order information, revenue share, reports, and payouts. Cannot access other organizations or Creative Ape confidential production costs/margins.

### Customer
Browses published storefronts and purchases merchandise.

## Store branding
Logo, primary/secondary/accent/background/text colors, hero image, title, description, social links, published state. Manual color overrides are mandatory. Automatic palette extraction may be added later.

## Store builder
Use constrained merch-oriented sections rather than a generic drag-and-drop website builder. Initial sections: hero, featured products, product grid, text + image. Later: video, organization story, sponsors, announcements, socials, FAQ.

## Products
Name, slug, description, status, SKU, category, retail price, production cost, markup, revenue share, featured state, variants, multiple images, video metadata.

Variants support size, color, SKU, price override, production-cost override, inventory/availability.

## Product templates
Creative Ape maintains reusable master products, such as a Premium Hoodie. Templates can later be cloned into organization stores with organization-specific artwork, prices, colors, descriptions, and media.

## Revenue sharing
Future rule types: percentage of gross, percentage of net profit, fixed amount per item, custom. MVP begins percentage-based.

Track gross sale, production cost, discounts, processing fees, shipping, refunds, net, organization share, and Creative Ape share.

## Fulfillment
Paid -> Processing -> Production -> Ready -> Shipped -> Complete. Also support Cancelled and Refunded. Keep fulfillment event history.

## Payments
Start with a centralized Creative Ape Stripe account in test mode. Stripe Connect is a later milestone. Other wallet/payment rails may be added when supported by the selected processor and business account configuration.

## Reporting
Gross sales, orders, units, organization share, Creative Ape share, paid/outstanding amounts, fulfillment status, and later CSV/PDF/Excel export.
