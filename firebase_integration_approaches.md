# Firebase Auth Integration Approaches

Integrating Firebase Auth into your current system while maintaining control over your server can be achieved through several patterns. Each has different implications for your architecture and required modifications.

## Summary of Current System
- **Mechanism**: Local JWT signing and verification using `jsonwebtoken`.
- **Database**: Prisma handles `User` and [RefreshToken](file:///c:/Users/Yash/Desktop/AGCL/CompailanceOS/backend/src/services/auth.service.ts#6-16) storage.
- **Identity**: Your server manages passwords (hashed) and user creation.

---

## 1. Minimal Change: Hybrid Approach (Recommended)
In this approach, Firebase is used only for the initial **Login/Identity Provider** (especially useful for Social Logins or Phone Auth). Once Firebase verifies the user, your server issues its own JWT (the current system).

- **Flow**:
  1. Frontend authenticates with Firebase.
  2. Frontend sends Firebase `ID Token` to your `/google` or a new `/firebase-login` endpoint.
  3. Your server verifies the `ID Token` once using `firebase-admin`.
  4. If valid, your server finds/creates the user in the local DB and issues a **local Access/Refresh Token** (current logic).
- **Modifications**:
  - Add `firebase-admin` dependency.
  - Update `authService.googleAuth` (or create a new service method) to verify the token.
  - No changes needed to existing `authMiddleware` or other routes.
- **Server Control**: **High.** Your server still controls session duration and permissions via its own tokens.

## 2. Direct Backend Verification (ID Tokens)
In this approach, you replace your local JWTs entirely with Firebase ID Tokens. The frontend sends the Firebase-issued token with every request.

- **Flow**:
  1. Frontend authenticates with Firebase.
  2. Frontend sends Firebase `ID Token` in the `Authorization` header.
  3. Your middleware verifies this token on every request using `firebase-admin`.
- **Modifications**:
  - Replace [utils/jwt.ts](file:///c:/Users/Yash/Desktop/AGCL/CompailanceOS/backend/src/utils/jwt.ts) verification logic with `admin.auth().verifyIdToken()`.
  - Update `authMiddleware` to use Firebase's verification.
  - Remove local password storage and [RefreshToken](file:///c:/Users/Yash/Desktop/AGCL/CompailanceOS/backend/src/services/auth.service.ts#6-16) table (Firebase handles refreshes).
- **Server Control**: **Medium.** You rely on Firebase for token validity, but you still control authorization (claims) and database access.

## 3. Secure Web: Firebase Session Cookies
This is the most secure approach for web applications as it uses HTTP-only, Secure cookies instead of storing tokens in local storage.

- **Flow**:
  1. Frontend authenticates with Firebase.
  2. Frontend sends ID Token to server.
  3. Server verifies and creates a **Firebase Session Cookie** (typically 1-14 days).
  4. Server sets the cookie; subsequent requests verify the cookie.
- **Modifications**:
  - Significant changes to how tokens are handled (Cookie-based vs Header-based).
  - Update all middleware to read from cookies.
- **Server Control**: **High.** You control the session cookie's lifetime and can revoke it.

---

## Comparison Table

| Feature | Hybrid (Current + Firebase) | Direct ID Tokens | Session Cookies |
| :--- | :--- | :--- | :--- |
| **Effort** | Low | Medium | High |
| **Security** | Good | Good | Excellent (XSS resistant) |
| **Server Control** | Maximum | Moderate | Maximum |
| **DB Sync** | Manual (on login) | Manual (on every request/cache) | Manual (on login) |

## Necessary Modifications (Common to all)
1. **Initialize Firebase Admin**: You'll need to add a service account JSON to your `backend/src/config`.
2. **User Synchronization**: Since you need control over your server, you will still need a `User` table in your local DB. On every successful Firebase login, you should ensure the user exists in your DB (using Firebase `uid` as a key).
3. **Middleware API**: Your `authenticate` middleware will likely need to be updated to extract either the Firebase Token or your custom token.

> [!IMPORTANT]
> **Maintaining Control**: Even with Firebase, your server remains the "Source of Truth" for application-specific data (roles, profile info, compliance status). Firebase only manages the **Identity** (who the user is).
