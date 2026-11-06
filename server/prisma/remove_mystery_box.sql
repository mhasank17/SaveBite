-- Remove obsolete Mystery Box field from listings table
ALTER TABLE "listings" DROP COLUMN IF EXISTS "is_mystery_box";

-- Update demo records to remove Mystery/Surprise references
UPDATE "listings" 
SET "title" = '[Demo] Evening Bakery & Sourdough Assortment' 
WHERE "title" = '[Demo] Evening Bakery & Sourdough Surprise Pack';

UPDATE "listings" 
SET "title" = '[Demo] Chef’s Midnight Surplus Rice & Curry Banquet',
    "description" = '[DEMO RECORD - NOT A REAL OFFER] Generous evening assortment of today’s finest kitchen surplus dishes and specialties.'
WHERE "id" = 'demo-deal-mystery-crate' OR "title" LIKE '%Mystery Rescue Crate%';
