# Account emails

Copies of the templates in Supabase → Authentication → Emails (Oct 25).
Each file's first line is the subject; the rest is the message body.

Every link goes to `{{ .SiteURL }}/auth/confirm?token_hash=…&type=…` on our
own domain, where `web-next/src/components/ConfirmEmail.jsx` checks it.
Linking straight to the Supabase address (the default) doesn't match the
sender, hello@yourownuniverse.life, so Outlook and Hotmail hid the emails.

The app must be live with /auth/confirm before these are switched on.
