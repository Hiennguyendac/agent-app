-- Adds password hash support for Sprint 6.
--
-- Passwords are never stored in plain text. The API stores a scrypt-based
-- hash string in password_hash, and login now requires username + password.

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;
