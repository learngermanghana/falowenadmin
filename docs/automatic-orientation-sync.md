# Automatic orientation sync after payment

Falowen now syncs an eligible student to the Orientation Sheet after the student record changes from unpaid to partially paid or paid.

The trigger reads the selected class from the student record, matches it to the existing class in Firestore, and uses that class's level and start date. A1, A2, and B1 are supported.

The student record receives an `orientationAutoSync` object with `pending`, `success`, or `failed` status. Its sync key combines the student, level, class, and start date so repeated payment events do not create another successful sync for the same target.

Deploy with:

```bash
npm run deploy:falowenadmin
```

After a test payment, confirm that `orientationAutoSync.status` becomes `success` and that one matching row appears in the Orientation Sheet. The manual `/orientation` page remains available for old records and incomplete class data.
