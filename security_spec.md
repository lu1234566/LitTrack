# Readora Security Specification

## Data Invariants
1. **Books** must belong to the authenticated user (`userId == request.auth.uid`).
2. **UserGoals** are identified by `{userId}_{year}` and must belong to the user.
3. **Communities** have an `ownerId` that must match the creator's ID.
4. **CommunityMembers** must reference a valid user and community.
5. **CommunityFeedItems** can be public or linked to a community.
6. **Likes/Comments** must reference a valid `feedItemId`.
7. **Follows** must have a `followerId` matching the current user.
8. **UserStats** (in `users` collection) can only be updated by the owner through specific fields.

## The "Dirty Dozen" Payloads (Attacks)
1. **Identity Spoofing**: Attempt to create a book for another user.
2. **Goal Hijacking**: Attempt to update another user's annual goal.
3. **Shadow Field Injection**: Attempt to add `isAdmin: true` to a user profile update.
4. **Community Hostile Takeover**: Attempt to update a community's `ownerId` as a member.
5. **Relational Orphan**: Create a comment for a non-existent `feedItemId`.
6. **Denial of Wallet**: Attempt to write a 1MB string into a `name` field.
7. **ID Poisoning**: Use a 2KB long string as a document ID.
8. **PII Leak**: Attempt to list all users and their private `email` if it's there.
9. **State Locking Bypass**: Update a "completed" challenge status back to false.
10. **Membership Escalation**: Update `communityRole` to `owner` as a standard member.
11. **Follower Inversion**: Create a follow where the `followingId` is the attacker and `followerId` is someone else.
12. **System Field Corruption**: Update `booksRead` directly instead of letting the app handle increments.

## The Test Runner (firestore.rules.test.ts)
(To be implemented if testing utilities are available, otherwise verified via logic).
