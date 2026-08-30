# Architecture

## Overview
One Next.js application serves many organization storefronts.

Organizations -> Stores -> Products -> Variants -> Media
Organizations -> Members
Customers -> Orders -> Order Items -> Payments
Orders -> Ledger Entries -> Revenue Shares/Payouts
Orders -> Fulfillment Events

## Frontend
Next.js App Router, React, TypeScript, Tailwind CSS.

## Backend
Supabase Postgres/Auth/Storage with Row Level Security. Stripe for payments. Vercel for deployment.

## Tenant isolation
Every tenant-owned record carries `organization_id` or derives ownership through a secure foreign-key chain. Organization members access only organizations where they have membership. Public visitors only read published storefront/product data. Super-admin access is explicit and server validated.

## Supabase SSR
Use `@supabase/ssr` with separate browser/server clients and `proxy.ts` for cookie refresh. Service-role access is server-only and reserved for trusted backend work such as verified payment webhooks.

## Storage
Buckets: `brand-assets` and `product-media`. Use tenant-prefixed object paths such as `organization/{organization_id}/store/{store_id}/...`.

## Financial integrity
Order items snapshot retail price, production cost, discounts, payment-fee allocations, shipping allocation, organization share, and Creative Ape share. Historical results are never recalculated from mutable product data.

## Stripe
Server-side secret only. Verify webhook signatures. Persist Stripe event IDs for idempotency. Browser-submitted totals are never authoritative.
