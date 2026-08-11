-- Clear ASP.NET Identity lockout for a user email.
-- Placeholders: @Username  (usually the email)

UPDATE aspnetusers
SET LockoutEndDateUtc = NULL
WHERE email = '@Username';
