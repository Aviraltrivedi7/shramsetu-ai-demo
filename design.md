# ShramSetu AI — Mobile Interface Design

## Product Direction

ShramSetu AI is a Hindi-first digital companion for skilled construction workers. The experience should feel calm, trustworthy, and immediately useful: users verify a mobile number, see their work and money at a glance, learn a fair wage range, and manage their professional identity. The reference interface is recreated for a **portrait 9:16 mobile canvas**, with key controls placed within comfortable one-handed reach and a persistent five-item tab bar.

## Screen List and Layout

| Screen | Primary content | Functionality and mobile layout |
|---|---|---|
| Mobile number | Brand mark, Hindi/English switch, phone field, secure-OTP explanation, demo helper, primary CTA | The user enters a 10-digit Indian mobile number and advances to OTP verification. The CTA is full-width and sits in the lower thumb zone. |
| OTP verification | Back action, lock illustration, four code cells, demo-code helper, verify CTA, resend timer | Each code cell advances focus; entering `1234` verifies the local demo identity and opens the main app. |
| Home dashboard | Greeting, trust score card, earnings summary, pending-payment banner, best job match, quick actions | The overview is vertically scrollable above the tab bar. Cards can move users to a related tab or present short confirmation feedback. |
| Kaam | Job search, skill filters, verified-job count, job cards and apply buttons | Users can filter the local job list by Mason or Painter, search by title/skill, and apply to a listed job. |
| Fair Wage | AI estimate card, skill selector, experience stepper, fairness message | Changing skill or years of experience recalculates the displayed daily wage range locally. |
| Hisab | Savings headline, segment control, income/expense/savings data, recent activity, add action | The segmented control changes the displayed ledger summary. Add action opens a compact local-entry sheet. |
| Profile | Worker avatar, verified identity, digital ID card, verified skills, settings | Profile settings and logout remain local actions; logout returns to the mobile number screen. |

## Key User Flows

| Flow | Steps |
|---|---|
| Local identity verification | Mobile number → `Aage Badhein` → OTP cells → `Verify karein` / automatic completion → Home dashboard. |
| Find a job | Kaam tab → filter or search → job card → `Abhi apply karein` → local application confirmation and applied count update. |
| Check fair wage | Fair Wage tab → choose skill → adjust experience → live estimate and fairness message update. |
| Review finances | Hisab tab → choose Kamaai, Kharch, or Bachat → examine activity → `Add karein` → save local entry. |
| End session | Profile tab → Logout → confirmation → return to mobile-number entry. |

## Visual Language

The interface uses a bright, near-white background and deep navy surfaces to convey reliability, with a warm orange primary action color inspired by the reference. Cards have 16–20px rounded corners, thin cool-gray borders, compact line icons, and restrained shadows. Typography is bold and dark for headings, readable medium weight for monetary values, and soft gray for helper text. English navigation labels are retained to match the reference while all primary content remains in clear Romanized Hindi.

| Token | Value | Use |
|---|---:|---|
| Navy | `#182B4A` | Trust cards, digital ID, primary text |
| Orange | `#FF6B0A` | Primary CTAs, active states, key highlights |
| Amber | `#F5B44C` | Eyebrows, small brand accents, selected skill labels |
| Canvas | `#F8FAFC` | Screen background |
| Surface | `#FFFFFF` | Cards, text fields, bottom bar |
| Border | `#E6EAF0` | Card and input outlines |
| Success | `#25B96C` | Trust status, verified chips, match bars |
| Cream | `#FFF7EA` | Demo and pending-payment callouts |

## Interaction and Accessibility Notes

All primary touch targets are at least 44pt tall. The bottom navigation labels remain visible, and the primary CTA is always text-labelled rather than icon-only. Inputs use numeric keyboards where applicable. Presses receive a small opacity/scale response, successful OTP completion uses light haptic feedback on supported devices, and local status messages provide clear feedback without interrupting the flow.
