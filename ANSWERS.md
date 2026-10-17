# Part 2 — Billing Widget: Written Answers

**Under test:** an "Account Information" credit-card payment form used by a **global SaaS company**.
The mock-up shows: *Card Type* (dropdown, defaults to VISA, required) · *Payment Amount* as static
text `30.00` (no currency) · *Card Number (No dashes or spaces)* (required) · *Expiration* = *Month* +
*Year* dropdowns (required) · *Cardholder Name* = *First Name* (required) + *MI* + *Last Name*
(required) · *Credit Card Billing Street Address* (line 1 required, line 2 optional) · *City* (required)
· *State or Province* = "Select a state" dropdown (required) · *Postal Code (no dashes)* (required) ·
`* indicates required information` · **Continue** (blue) and **Cancel** (greyed) buttons.

Severity scale used below: **Critical / High / Medium / Low**.

---

## a. Testing the UI mock-up — problems found

### Functional
- **No CVV / security code field — Critical.** Most issuers and processors expect the CVV/CVC on a
  one-off card-not-present payment, and many decline or flag charges without it. Without it, a large
  share of genuine payments fail, the ones that succeed skip a key fraud check, and chargeback risk
  rises. This is the most severe defect (see part c).
- **Expiration allows past/expired dates — High.** Month and Year are independent selects seeded to
  "Select month" / "Select year". Nothing visibly prevents choosing a month in the current year that has
  already passed (or a past year), so an already-expired card can be submitted. Needs cross-field
  validation against "today".
- **Card Type is manual and defaults to VISA — Medium.** The type should be derived from the card number
  (IIN/BIN). A manual dropdown can be left on VISA while a Mastercard/Amex number is typed, causing
  avoidable declines; it's also unclear whether the number is validated (Luhn) or checked against the
  chosen type.
- **Payment Amount is static, context-free text — Medium.** `30.00` with no plan name, period, tax, or
  editability. The user can't tell what they're paying for. (If it's server-controlled that's good for
  integrity, but it still needs context in the UI.)
- **No visible inline validation / submit feedback — High.** There are no error affordances shown, and no
  apparent disabled/loading state on **Continue** to prevent a double-click → **double charge**.
- **Cancel button state is ambiguous — Medium.** It looks greyed/disabled; if truly disabled the user
  can't abort, and its action (discard + navigate where?) is undefined.

### Security
- **App appears to collect the raw PAN itself — Critical/High.** If the full card number is captured and
  transmitted by Acme's own front-/back-end, the application is in **PCI-DSS scope (SAQ D)** — heavy
  compliance and breach liability. Best practice is to never let raw card data touch your servers.
- **Transport security — High.** Must be HTTPS/TLS end-to-end with no mixed content; the form must post to
  a secure endpoint. To verify at test time.
- **Card-number masking & logging — Medium.** Is the PAN masked on screen and kept out of logs/analytics?
- **Autocomplete/autofill handling — Medium.** Card fields should use correct `autocomplete` tokens
  (`cc-number`, `cc-exp`, `cc-csc`) — or deliberately disable them per policy — and must not be cached in
  a way that exposes card data.
- **No 3-D Secure / SCA path — High (EU/UK).** A global seller into the EU/UK needs Strong Customer
  Authentication (3-DS2); nothing here supports a challenge flow.

### Usability / UX
- **"No dashes or spaces" / "Postal Code (no dashes)" push formatting onto the user — Medium.** Cards are
  printed in groups of four; pasting "4111 1111 1111 1111" would error. The form should auto-format/strip
  separators, not reject them.
- **Two separate Month/Year dropdowns — Low/Medium.** More clicks than a single `MM / YY`, and easy to
  leave one unselected.
- **Tiny "MI" field — Low.** Cramped, easily missed, and rarely necessary; adds friction.
- **Address labeling — Low.** Two street-address lines but only the first is labeled; line 2's purpose
  (apt/suite) is unstated.
- **Amount not tied to an order summary — Low.** No plan/period next to `30.00`.

### Internationalization (High overall — the brief stresses "global SaaS")
- **No Country field — High.** A global company must capture country; it drives address format,
  state/province requirements, postal rules, currency and tax. Its absence is a systemic i18n failure.
- **US-centric "State or Province" / "Select a state" (required) — High.** Many countries have no
  states/provinces or use different subdivisions; forcing a US state list blocks non-US customers.
- **"Postal Code (no dashes)" assumes US ZIP — High.** Postal codes are alphanumeric and often contain
  spaces/dashes elsewhere (UK `SW1A 1AA`, Canada `K1A 0B1`, Brazil `12345-678`); some countries have
  none. "No dashes" is simply wrong globally.
- **Payment Amount has no currency — High.** `30.00` is ambiguous (USD? EUR?); amount and number/decimal
  formatting must be localized.
- **No label/date localization — Medium.** Language and month/year ordering aren't localized.

### Accessibility
- **Required state is visual only — Medium.** The red `*` and its legend work for sighted users, but a
  screen reader may skip the asterisk. Each required field needs `required` / `aria-required` so the
  requirement is announced (WCAG 1.3.1, 3.3.2).
- **Greyed "Cancel" — Medium.** If Cancel is active, its grey text likely fails WCAG 1.4.3 contrast. If
  it is disabled, it is exempt from contrast rules, but then the user has no way to abort, and the
  disabled state must be announced to assistive tech.
- **Programmatic labels & grouping — Medium.** Verify every input (esp. `MI`, `Month`, `Year`) has a
  correctly associated label, that the amount is announced, and that Expiration / Cardholder Name use
  `fieldset`/`legend`.
- **Keyboard & screen-reader support — Medium.** Logical tab order, visible focus, keyboard-operable
  dropdowns, and errors announced via `aria-live`.

### Performance
A static mock-up can't be timed, but its design points to these risks:
- **Slow card authorization with no feedback.** Authorizing a card (a gateway round trip, possibly a 3-D
  Secure challenge) can take several seconds. With no spinner or disabled Continue button, a slow response
  looks like nothing happened, so users click again. This is the performance side of the High
  "no submit feedback → double charge" finding under Functional.
- **Where validation runs — Medium.** If the checks run only on the server, every typo (card number,
  expiry, postal code) costs a round trip to discover. Checking formats inline, in the browser, avoids it.
- **Long, static dropdowns — Low.** "Select a state" (and a future country list with per-country regions)
  should load only the regions for the selected country, not one large list; the Year list should cover
  only the next ~15 years.
- **Third-party scripts — Low/Medium.** Payment SDKs and fraud/analytics scripts can block rendering; they
  should load asynchronously so the form is usable quickly.

What I would measure: time from Continue to a visible response (feedback within ~300 ms) and to the final
result, inline-validation latency, time-to-interactive on a slow mobile connection, and the weight of
third-party scripts.

---

## b. Sample test cases

Format: **ID · Title · Preconditions · Steps · Test Data · Expected Result · Priority/Type**

### TC-01 — Successful payment (happy path)
- **Preconditions:** On the Account Information page; payment gateway in sandbox/test mode.
- **Steps:**
  1. Select Card Type = VISA.
  2. Enter a valid card number.
  3. Select a future Expiration Month and Year.
  4. Enter First Name and Last Name.
  5. Enter billing street address, City, State/Province, Postal Code.
  6. (Once present) enter a valid CVV.
  7. Click **Continue**.
- **Test Data:** Card `4111111111111111`, Exp `12 / 2030`, Name `Jane Tester`, Address `500 Test Ave`,
  City `Austin`, State `Texas`, Postal `78701`, CVV `123`, Amount `30.00`.
- **Expected Result:** All validations pass; payment is authorized in the sandbox; the user advances to
  the confirmation/next step; the correct amount and currency are charged.
- **Priority/Type:** High · Positive / Functional.

### TC-02 — Required field left empty
- **Preconditions:** On the form.
- **Steps:** Complete every field with valid data **except leave Card Number blank**, then click
  **Continue**.
- **Test Data:** As TC-01 but Card Number = *(empty)*.
- **Expected Result:** Submission is blocked; a clear inline error appears on Card Number (e.g.
  "required"); focus moves to the field; **no** authorization/charge is attempted; previously entered
  data is preserved.
- **Priority/Type:** High · Negative / Validation.

### TC-03 — Invalid card details are rejected (format, checksum, expiry)
- **Preconditions:** On the form, with the valid data from TC-01.
- **Steps:** For each row below, start from the TC-01 data, change only that one input, click
  **Continue**, and check the result. Each row has a single cause, so the result shows which check fired.
- **Test Data and Expected Result:**

| Input changed | Expected result |
| --- | --- |
| Card `4111 1111 1111 1111` (valid, with spaces) | Accepted: the spaces are stripped automatically (part a: the form should not reject them) |
| Card `4111111111111112` (digits only, fails the Luhn checksum) | Rejected inline with "Card number is not valid"; no authorization is attempted |
| Card `4111abcd11111111` (contains letters) | Rejected inline: letters are not allowed; no authorization is attempted |
| Expiration = the month before the current one | Rejected inline with "This card has expired"; no authorization is attempted |

- **Priority/Type:** High · Negative / Validation-Security.

---

## c. Product solution for the most severe bug

**Most severe bug: the missing CVV field, compounded by the app collecting the raw PAN itself.**

**Why it's most severe (impact × likelihood).** *Likelihood: very high.* It affects every payment:
most issuers and processors decline or flag card-not-present charges that arrive without a CVV, and
the ones that go through skip a key fraud check. *Impact: high.* Lost revenue from declined payments,
more fraud and chargebacks, and because the app appears to handle the raw card number directly it
drags Acme into **full PCI-DSS scope (SAQ D)** with the corresponding breach liability. A billing form
that weakens every payment *and* enlarges compliance risk is the top priority.

**Solution — don't just "add a CVV input"; replace the hand-built card form with a PCI-compliant
hosted / tokenized payment element** such as **Stripe Elements / Payment Element, Braintree Hosted
Fields, or Adyen Components.** The card number, expiry, and CVV are entered inside the provider's iframe;
the browser exchanges them for a **single-use token**; Acme's servers only ever see the token — never the
raw PAN.

**One change fixes many findings at once:**
- **Adds the CVV field** (built in) → resolves the Critical functional gap.
- **Tokenizes the PAN** so raw card data never touches Acme's servers → shrinks PCI scope from SAQ D
  toward **SAQ A**, cutting compliance cost and breach liability.
- **Auto-detects card type** from the number → removes the manual, error-prone Card Type dropdown.
- **Auto-formats/strips** spaces and dashes and validates via **Luhn** in real time → eliminates the
  "No dashes or spaces" friction and a lot of custom validation.
- **Enforces expiry validation** and can trigger **3-D Secure / SCA** for EU/UK.
- Ships **accessible, localized, well-tested** inputs out of the box.

**Pair it with the top internationalization fix:** add a **Country** selector that drives address format,
makes **State/Province** conditional, applies country-correct **postal-code** validation, and displays the
amount with an explicit **currency**. Together, one architectural change turns an unusable, high-liability
form into a secure, global-ready checkout.
