# Security Policy

## 🔒 Overview

MagikTools takes security seriously. This document outlines our security practices and how to report vulnerabilities.

## 🛡️ Security Architecture

### **Frontend Security**
- **Authentication:** Clerk handles all user authentication
- **Public Keys:** Only publishable keys (`pk_*`) are exposed in frontend code
- **Environment Variables:** All `VITE_*` variables are safe for client-side exposure

### **Backend Security**
- **Secret Management:** All sensitive keys managed via Encore Secrets
  - `ClerkSecretKey` - Never exposed to frontend
  - `OpenAIKey` - Stored securely in Encore
  - `KiwifySecret` - Webhook signature verification
- **Database:** Managed by Encore with automatic credential handling
- **API Authentication:** Protected endpoints use Clerk token verification

### **What's Safe to Expose**

✅ **Safe (Public by Design):**
- Clerk Publishable Keys (`pk_test_*`, `pk_live_*`)
- Clerk Frontend API URLs
- Feature flags (`VITE_FEATURE_*`)
- Admin email whitelist
- Public URLs (payment links, documentation)

❌ **Never Expose:**
- Clerk Secret Keys (`sk_*`)
- OpenAI API Keys
- Kiwify Webhook Secret
- Database credentials
- Private API tokens

## 🔐 Current Security Status

| Component | Status | Implementation |
|-----------|--------|----------------|
| Secret Keys | ✅ Secure | Managed via Encore `secret()` |
| Database Credentials | ✅ Secure | Auto-managed by Encore |
| API Authentication | ✅ Secure | Clerk token verification |
| Webhook Signatures | ✅ Secure | HMAC SHA-1 validation |
| Frontend Keys | ✅ Secure | Only public keys exposed |
| Git History | ✅ Clean | No secrets in commits |

## 📋 Security Checklist

### **For Contributors**

Before submitting a PR, ensure:

- [ ] No secret keys (`sk_*`, API keys) in code
- [ ] No passwords or tokens hardcoded
- [ ] All sensitive config uses Encore `secret()`
- [ ] `.env.local` used for local secrets (not committed)
- [ ] No database credentials in code
- [ ] Webhook signatures validated
- [ ] User input sanitized
- [ ] SQL queries use parameterized statements

### **For Maintainers**

Before merging:

- [ ] Review all new environment variables
- [ ] Check for accidental secret exposure
- [ ] Verify Encore Secrets are configured
- [ ] Test authentication flows
- [ ] Review database migrations

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### **DO:**

1. **Email the maintainer directly:**
   - Email: guuh2358@gmail.com
   - Subject: `[SECURITY] Vulnerability in MagikTools`

2. **Include in your report:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. **Give us time to respond:**
   - We will acknowledge within 48 hours
   - We aim to fix critical issues within 7 days

### **DON'T:**

- ❌ Open a public GitHub issue for security vulnerabilities
- ❌ Discuss the vulnerability publicly before it's fixed
- ❌ Exploit the vulnerability beyond proof-of-concept

## 🎯 Vulnerability Severity

We classify vulnerabilities using this scale:

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Secrets exposed, RCE, authentication bypass | 24-48 hours |
| **High** | SQL injection, XSS, unauthorized data access | 3-7 days |
| **Medium** | CSRF, information disclosure, DoS | 7-14 days |
| **Low** | Minor issues with limited impact | 14-30 days |

## 🔄 Security Updates

Security updates are released as:

- **Patch releases** (x.x.X) - Security fixes
- **Minor releases** (x.X.0) - Security improvements
- **Documented** in `CHANGELOG.md` with `[SECURITY]` prefix

## 🛠️ Secure Development Practices

### **Environment Variables**

```bash
# ✅ GOOD - Public keys in .env (committed)
VITE_CLERK_PUBLISHABLE_KEY_TEST=pk_test_...

# ❌ BAD - Secret keys should NEVER be in .env files
# CLERK_SECRET_KEY=sk_test_...  # NEVER DO THIS!

# ✅ GOOD - Secrets managed via Encore CLI
encore secret set --type dev ClerkSecretKey
```

### **Clerk Keys**

```typescript
// ✅ GOOD - Public key in frontend
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY_TEST;

// ❌ BAD - Secret key should NEVER be in frontend
// const SECRET_KEY = import.meta.env.VITE_CLERK_SECRET_KEY;

// ✅ GOOD - Secret key in backend via Encore
import { secret } from "encore.dev/config";
const clerkSecretKey = secret("ClerkSecretKey");
```

### **Database Queries**

```typescript
// ✅ GOOD - Parameterized query
await db.queryRow`
  SELECT * FROM users WHERE email = ${email}
`;

// ❌ BAD - SQL injection vulnerable
// await db.queryRow(`SELECT * FROM users WHERE email = '${email}'`);
```

## 📚 Additional Resources

- [Clerk Security Best Practices](https://clerk.com/docs/security)
- [Encore Security Guide](https://encore.dev/docs/develop/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## 📝 Security Audit Log

| Date | Type | Description | Status |
|------|------|-------------|--------|
| 2025-11-06 | Audit | Full security review before making repo public | ✅ Passed |
| 2025-10-23 | Audit | Clerk authentication implementation review | ✅ Passed |

---

**Last Updated:** 2025-11-06
**Next Review:** 2025-12-06 (Monthly reviews)
