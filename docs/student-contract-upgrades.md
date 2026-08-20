# Student contract upgrades and Paystack reconciliation

Falowen keeps a student's already-paid contract separate from the next-level payment process.

## Rules

- A fully paid contract uses a 6-month term.
- A student may prepare only the next CEFR level (A1 → A2 → B1 → B2 → C1).
- The current paid contract must still be active and its current-level balance must be zero before a next-level upgrade can be prepared.
- Preparing an upgrade does **not** change the student's level, class, balance, payment status, or contract dates. It only creates the payable next-level upgrade record.
- If the student pays the **full new-level fee**, Falowen completes the upgrade immediately and adds 6 calendar months to the existing active `contractEnd`. If the old contract has already expired by the time full payment is completed, the six months start from the payment date.
- If the student pays **less than the full new-level fee**, that successful partial payment starts one calendar month of temporary access to the new level.
- The one-month grace period starts from the date of the first successful partial new-level payment, not from the date the admin prepared the upgrade.
- During the partial-payment grace month, `level`, `balanceDue`, and `paymentReminderLevel` point to the new level so reminders identify the correct level and remaining balance.
- Additional partial payments reduce `upgradeBalanceDue` but do not restart or extend the one-month grace period.
- If the remaining balance becomes zero during the grace month, the upgrade becomes fully paid immediately and 6 months are added to the contract.
- If the balance is still outstanding when `upgradeGraceEnd` is reached, Falowen restores the previous paid level and previous payment-status fields while keeping the original paid contract end date unchanged.
- An expired upgrade remains auditable. Later partial payments reduce the recorded upgrade balance but do not grant another grace month. Full payment can still complete the upgrade.

## Upgrade statuses

- `awaiting_payment`: the admin prepared the next-level upgrade, but no successful new-level payment has changed access yet.
- `pending`: at least one successful partial payment was received and the one-month temporary-access period is active.
- `expired`: the partial-payment grace month ended with a balance still outstanding; the previous paid level was restored.
- `completed`: the full new-level fee has been paid and the next level is now the paid level.

## Payment reconciliation

Paystack webhooks remain the primary source of successful-payment updates. Falowen also verifies pending Paystack references directly as a fallback:

- the Student Directory checks pending payments while the student page is open;
- admins can manually run **Recheck pending Paystack payments**;
- the scheduled `maintainStudentPaymentContracts` job runs every 30 minutes, reconciles recent pending references, expires stale unpaid checkout links, and processes expired partial-payment grace periods.

The payment reference remains idempotent: once a `payments/{reference}` document is marked `paid`, the same reference cannot be credited twice.

## Student upgrade fields

The student document may contain:

- `paidLevel`
- `upgradeId`
- `upgradeStatus`: `awaiting_payment`, `pending`, `expired`, or `completed`
- `upgradeFromLevel`
- `upgradeToLevel`
- `upgradeCreatedAt`
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
