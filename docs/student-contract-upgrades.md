# Student contract upgrades and Paystack reconciliation

Falowen keeps a student's paid contract separate from a temporary next-level upgrade.

## Rules

- A fully paid contract uses a 6-month term.
- A student with an active paid contract may start only the next CEFR level (A1 → A2 → B1 → B2 → C1).
- Starting an upgrade gives temporary access to the next level for one calendar month without changing the existing `contractEnd`.
- During the grace month, `level`, `balanceDue`, and `paymentReminderLevel` point to the upgrade so existing reminder flows identify the next level correctly.
- Partial upgrade payments reduce `upgradeBalanceDue` but do not extend the contract.
- If the upgrade is not fully paid by `upgradeGraceEnd`, Falowen restores the previous level and previous payment-status fields while keeping the original contract end date unchanged.
- An expired upgrade remains auditable and can still be paid. Full payment reactivates the target level.
- When an upgrade becomes fully paid, Falowen adds 6 calendar months to the existing active contract end. If the old contract has already expired, the 6 months start from the payment date.

## Payment reconciliation

Paystack webhooks remain the primary source of successful-payment updates. Falowen also verifies pending Paystack references directly as a fallback:

- the Student Directory checks pending payments while the student page is open;
- admins can manually run **Recheck pending Paystack payments**;
- the scheduled `maintainStudentPaymentContracts` job runs every 30 minutes, reconciles recent pending references, expires stale unpaid checkout links, and processes expired upgrade grace periods.

The payment reference remains idempotent: once a `payments/{reference}` document is marked `paid`, the same reference cannot be credited twice.

## Student upgrade fields

The student document may contain:

- `paidLevel`
- `upgradeId`
- `upgradeStatus`: `pending`, `expired`, or `completed`
- `upgradeFromLevel`
- `upgradeToLevel`
- `upgradeStartedAt`
- `upgradeGraceEnd`
- `upgradeTuitionFee`
- `upgradePaid`
- `upgradeBalanceDue`
- `upgradePreviousLevel`
- `upgradePreviousClassName`
- `upgradePreviousBalanceDue`
- `upgradePreviousPaymentStatus`
- `upgradePreviousStatus`
- `upgradeTargetClassName`
- `paymentReminderLevel`

Do not delete completed or expired upgrade fields merely to clean the student record; they provide useful operational history. Payment history remains authoritative in the `payments` collection.
