# Part 2: billing widget answers

The form under test is an "Account Information" credit-card payment form used by a global SaaS company.
The mock-up shows:

- Card Type: dropdown, defaults to VISA, required
- Payment Amount: static text `30.00`, no currency
- Card Number (No dashes or spaces): required
- Expiration: Month and Year dropdowns, required
- Cardholder Name: First Name (required), MI, Last Name (required)
- Credit Card Billing Street Address: line 1 required, line 2 optional
- City: required
- State or Province: "Select a state" dropdown, required
- Postal Code (no dashes): required
- The note `* indicates required information`, and two buttons: Continue (blue) and Cancel (greyed)

Severity levels: Critical, High, Medium, Low.

## a. Problems found in the UI mock-up

### Functional
- **No CVV / security code field (Critical).** Most issuers and processors expect the CVV/CVC on a
  one-off card-not-present payment, and many decline or flag charges without it. So a large share of
  genuine payments fail, the ones that succeed skip an important fraud check, and chargeback risk rises.
  This is the most severe defect (see part c).
- **Expiration allows past dates (High).** Month and Year are separate dropdowns that start at "Select
  month" and "Select year". Nothing visible stops the user from picking a month that has already passed
  this year, or a past year, so an expired card can be submitted. The two fields need to be validated
  together against today's date.
- **Card Type is chosen by hand and defaults to VISA (Medium).** The type should come from the card
  number (IIN/BIN). A manual dropdown can stay on VISA while the user types a Mastercard or Amex number,
  which causes avoidable declines. It's also unclear whether the number is checked with Luhn or against
  the chosen type.
- **Payment Amount is static text with no context (Medium).** `30.00` has no plan name, period or tax,
  and can't be edited, so the user can't tell what they're paying for. A server-controlled amount is good
  for integrity, but the UI still needs to explain it.
- **No visible inline validation or submit feedback (High).** The mock-up shows no error states and no
  disabled or loading state on Continue, so a double click could cause a double charge.
- **Cancel button state is unclear (Medium).** It looks greyed out. If it's disabled, the user can't
  abort, and either way its action (discard the data and go where?) is undefined.

### Security
- **The app appears to collect the raw card number (PAN) itself (Critical/High).** If Acme's own front
  end or back end captures and transmits the full card number, the application is in PCI-DSS scope
  (SAQ D), with heavy compliance work and breach liability. Best practice is to never let raw card data
  touch your servers.
- **Transport security (High).** The page and the endpoint the form posts to must use HTTPS/TLS end to
  end, with no mixed content. A mock-up can't show this, so it needs checking during testing.
- **Card-number masking and logging (Medium).** The card number should be masked on screen and kept out
  of logs and analytics; the mock-up shows neither.
- **Autocomplete and autofill (Medium).** Card fields should use the correct `autocomplete` tokens
  (`cc-number`, `cc-exp`, `cc-csc`), or turn autofill off on purpose if policy requires it, and must not
  be cached in a way that exposes card data.
- **No 3-D Secure / SCA path (High, EU/UK).** A global seller with EU or UK customers needs Strong
  Customer Authentication (3-DS2), and nothing here supports a challenge flow.

### Usability / UX
- **"No dashes or spaces" and "Postal Code (no dashes)" make the user do the formatting (Medium).**
  Cards are printed in groups of four, so pasting "4111 1111 1111 1111" would fail. The form should strip
  or format separators itself instead of rejecting them.
- **Two separate Month and Year dropdowns (Low/Medium).** They take more clicks than a single `MM / YY`
  field, and it's easy to leave one unselected.
- **Tiny "MI" field (Low).** It's cramped, easy to miss, and rarely needed.
- **Address labeling (Low).** There are two street-address lines, but only the first has a label, so the
  purpose of line 2 (apartment, suite) isn't stated.
- **Amount not tied to an order summary (Low).** Nothing next to `30.00` names the plan or period.

### Internationalization (High overall, since the brief says "global SaaS")
- **No Country field (High).** A global company needs the customer's country: it decides the address
  format, whether a state or province is required, the postal rules, the currency and the tax.
- **"State or Province" is a required US state list (High).** Many countries have no states or
  provinces, or use different subdivisions, so a required US state list blocks non-US customers.
- **"Postal Code (no dashes)" assumes a US ZIP code (High).** Postal codes elsewhere contain letters and
  often spaces or dashes (UK `SW1A 1AA`, Canada `K1A 0B1`, Brazil `12345-678`), and some countries have
  none.
- **Payment Amount has no currency (High).** `30.00` could be USD or EUR. The amount and its number
  formatting must follow the customer's locale.
- **No localization of labels or dates (Medium).** The language and the month/year order aren't
  localized.

### Accessibility
- **Required state is visual only (Medium).** The red `*` and its legend work for sighted users, but a
  screen reader may skip the asterisk. Each required field needs `required` / `aria-required` so the
  requirement is announced (WCAG 1.3.1, 3.3.2).
- **Greyed "Cancel" (Medium).** If Cancel is active, its grey text likely fails WCAG 1.4.3 contrast. If
  it is disabled, it is exempt from contrast rules, but then the user has no way to abort, and the
  disabled state must be announced to assistive tech.
- **Labels and grouping (Medium).** Check that every input, especially `MI`, `Month` and `Year`, has a
  correctly associated label, that the amount is announced, and that Expiration and Cardholder Name are
  grouped with `fieldset`/`legend`.
- **Keyboard and screen-reader support (Medium).** Check for a logical tab order, visible focus,
  dropdowns that work from the keyboard, and errors announced through `aria-live`.

### Performance
A static mock-up can't be timed, but its design points to these risks:
- **Slow card authorization with no feedback.** Authorizing a card (a gateway round trip, possibly a 3-D
  Secure challenge) can take several seconds. With no spinner or disabled Continue button, a slow response
  looks like nothing happened, so users click again. It's the High "no submit feedback" finding under
  Functional, seen from the performance side.
- **Where validation runs (Medium).** If the checks run only on the server, every typo (card number,
  expiry, postal code) costs a round trip to discover. Checking formats inline, in the browser, avoids it.
- **Long, static dropdowns (Low).** "Select a state" (and a future country list with per-country regions)
  should load only the regions for the selected country, not one large list. The Year list should cover
  only the next ~15 years.
- **Third-party scripts (Low/Medium).** Payment SDKs and fraud or analytics scripts can block rendering;
  they should load asynchronously so the form is usable quickly.

What I would measure: time from Continue to a visible response (feedback within ~300 ms) and to the final
result, inline-validation latency, time-to-interactive on a slow mobile connection, and the weight of
third-party scripts.

## b. Sample test cases

### TC-01: Successful payment (happy path)
- **Preconditions:** On the Account Information page, with the payment gateway in sandbox/test mode.
- **Steps:**
  1. Select Card Type = VISA.
  2. Enter a valid card number.
  3. Select a future Expiration Month and Year.
  4. Enter First Name and Last Name.
  5. Enter the billing street address, City, State/Province and Postal Code.
  6. (Once the field exists) enter a valid CVV.
  7. Click Continue.
- **Test Data:** Card `4111111111111111`, Exp `12 / 2030`, Name `Jane Tester`, Address `500 Test Ave`,
  City `Austin`, State `Texas`, Postal `78701`, CVV `123`, Amount `30.00`.
- **Expected Result:** All validations pass, the payment is authorized in the sandbox, the user moves on
  to the confirmation step, and the correct amount and currency are charged.
- **Priority/Type:** High · Positive / Functional.

### TC-02: Required field left empty
- **Preconditions:** On the form.
- **Steps:** Fill every field with valid data, leave Card Number blank, then click Continue.
- **Test Data:** As TC-01, but Card Number = *(empty)*.
- **Expected Result:** Submission is blocked, a clear inline error appears on Card Number (e.g.
  "required"), focus moves to that field, no authorization or charge is attempted, and the data already
  entered is kept.
- **Priority/Type:** High · Negative / Validation.

### TC-03: Invalid card details are rejected (format, checksum, expiry)
- **Preconditions:** On the form, with the valid data from TC-01.
- **Steps:** For each row below, start from the TC-01 data, change only that one input, click Continue,
  and check the result. Each row changes a single input, so the result shows which check fired.
- **Test Data and Expected Result:**

| Input changed | Expected result |
| --- | --- |
| Card `4111 1111 1111 1111` (valid, with spaces) | Accepted: the spaces are stripped automatically (part a: the form should not reject them) |
| Card `4111111111111112` (digits only, fails the Luhn checksum) | Rejected inline with "Card number is not valid"; no authorization is attempted |
| Card `4111abcd11111111` (contains letters) | Rejected inline: letters are not allowed; no authorization is attempted |
| Expiration = the month before the current one | Rejected inline with "This card has expired"; no authorization is attempted |

- **Priority/Type:** High · Negative / Validation-Security.

## c. Product solution for the most severe bug

The most severe bug is the missing CVV field, made worse by the app collecting the raw card number (PAN)
itself.

**Why it's the most severe (impact × likelihood).** The likelihood is very high because it affects every
payment: most issuers and processors decline or flag card-not-present charges that arrive without a CVV,
and the ones that go through skip an important fraud check. The impact is high: lost revenue from
declined payments, more fraud and chargebacks, and, because the app appears to handle the raw card number
directly, full PCI-DSS scope (SAQ D) for Acme, with the breach liability that comes with it.

**Solution.** Replace the hand-built card form with a PCI-compliant hosted, tokenized payment element,
such as Stripe Elements (Payment Element), Braintree Hosted Fields or Adyen Components. Adding a CVV
input alone would stop the declines but leave Acme handling raw card numbers. With a hosted element, the
customer types the card number, expiry and CVV inside the provider's iframe, the browser exchanges them
for a single-use token, and Acme's servers receive only that token.

The same change fixes several other findings:
- It adds the CVV field, which closes the Critical functional gap.
- It tokenizes the card number, so raw card data never reaches Acme's servers. That shrinks PCI scope
  from SAQ D toward SAQ A and cuts compliance cost and breach liability.
- It detects the card type from the number, which removes the manual, error-prone Card Type dropdown.
- It strips spaces and dashes and runs the Luhn check as the user types, which removes the "No dashes or
  spaces" friction and a lot of custom validation.
- It enforces expiry validation and can trigger 3-D Secure / SCA for the EU and UK.
- Its inputs already handle accessibility and localization.

Pair it with the most important internationalization fix: a Country selector that sets the address
format, makes State/Province conditional, applies the right postal-code validation for each country, and
shows the amount with an explicit currency.
