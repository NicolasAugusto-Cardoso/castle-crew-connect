-- Add is_edited column to contact_replies table
ALTER TABLE contact_replies ADD COLUMN is_edited BOOLEAN DEFAULT false NOT NULL;