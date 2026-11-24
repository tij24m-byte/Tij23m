# Security Specification: CBOS Bank (بنك السودان المركزي)

## 1. Data Invariants
1. **One Face = One Account**: A `faceRegistry/{faceKey}` document cannot be overwritten once created, preventing duplicate registrations for the same encrypted face vector.
2. **PII Isolation**: `accounts/{accountId}` contains PII (`phone`, `email`, `nationalId`, `iban`). Only the owning `request.auth.uid` or a verified CBOS admin (`isAdmin()`) may `get` or `list` that account.
3. **No Raw Biometrics**: Only encrypted 512-number vector hashes (`faceVectorHash`) and `faceVectorLength == 512` are permitted; no photo blobs or URLs are stored.
4. **Strict Immutability & Server Timestamps**: `uid`, `createdAt`, `nationalId` cannot change after account creation, and `createdAt`/`updatedAt`/`issuedAt` must match `request.time`.
5. **No Self-Assigned Admin**: Users cannot write to `/admins/{uid}` or set admin roles on their profile.
6. **Action-Based Updates**: Account updates only permit explicit whitelisted field sets (`balance` + `updatedAt`, `status` + `updatedAt`, or `boundDeviceId` + `boundDeviceName` + `updatedAt`).

## 2. Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read on `/accounts/user1`
2. Unauthenticated write on `/transfers/tx1`
3. User A creating `/accounts/userB` with `uid: "userB"` (Identity Spoofing)
4. User A reading `/accounts/userB` (PII Blanket Leak)
5. User A injecting ghost field `isAdmin: true` into `/accounts/userA` (Shadow Update)
6. User A modifying `nationalId` on `/accounts/userA` (Immortal Field Violation)
7. User A faking `createdAt` to a past date (Temporal Integrity Violation)
8. User A overwriting `/faceRegistry/vec1` owned by User B (Duplicate Face Override)
9. User A listing `/transfers` without `where('senderUid', '==', uid)` (Unscoped Query Scrape)
10. User A writing a 2000-char string into `accountId` or `fullName` (Resource Poisoning)
11. User A deleting `/transfers/tx1` or `/statements/st1` (Audit Ledger Tampering)
12. Unverified admin email spoof (`email == "tij24m@gmail.com"` with `email_verified: false`)
