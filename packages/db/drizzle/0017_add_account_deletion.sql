-- Public profile deletion (the Google Play requirement): the emailed 6-digit
-- code rides in `customer_auth_tokens` like every other one-shot credential.
-- One enum value, purely additive. `IF NOT EXISTS` keeps it re-runnable.
ALTER TYPE "public"."customer_auth_purpose" ADD VALUE IF NOT EXISTS 'account_deletion';
