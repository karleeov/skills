-- TEST ONLY: disable OTP for a known test account.
-- Do not use on production end-user accounts.
-- Placeholders: @Username

UPDATE SIS_USERS
SET disableOTP = 'Y'
WHERE username = '@Username';
