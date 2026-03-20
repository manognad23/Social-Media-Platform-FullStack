# Enhanced Moderation System - Implementation Guide

## Overview
This document describes the complete moderation workflow implementation for flagging toxic/abusive content and notifying users when their posts/comments are removed.

---

## 📋 Complete File Changes

### 1. **backend/src/lib/moderation.js** (UPDATED)
**What Changed:** Enhanced with custom toxic content detection

**Key Additions:**
- New `detectCustomToxicity(text)` function using regex patterns to catch obvious abusive content
- Runs custom detection FIRST (fast, no API cost) before OpenAI
- Catches phrases like: "you're useless", "kill yourself", "get lost", etc.
- Returns consistent moderation object with `provider: "custom_rules"` when custom detection flags content
- Already had FORCE_FLAGGED env support for testing

**Flow:**
```
1. Check custom toxic patterns → if flagged, return immediately
2. Check if FORCE_FLAGGED=true → flag all (for testing)
3. Try OpenAI moderation API → use its result
4. If OpenAI fails → graceful fallback (return flagged: false)
```

---

### 2. **backend/src/lib/mailer.js** (NEW FILE)
**Purpose:** Send email notifications when admins remove content

**Key Functions:**
- `initTransporter()` - Creates nodemailer SMTP connection (lazy loaded)
- `sendModerationRemovalEmail({ to, username, targetType, reason })` - Sends HTML+text email

**Features:**
- Graceful degradation: if SMTP not configured, skips silently (doesn't break removal)
- HTML email with professional template
- Reads config from env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
- Error handling: logs errors but doesn't throw (email failure won't block moderation)

**Email Template:**
- Subject: "Content Moderation Notice"
- Mentions: username, post/comment, reason, link to guidelines
- Professional, respectful tone

---

### 3. **backend/src/routes/admin.js** (UPDATED)
**What Changed:** Added email notifications when removing content

**Key Changes:**
- Imported `sendModerationRemovalEmail` from mailer.js
- In `/api/admin/moderate` POST endpoint:
  - When action is "remove" for a POST:
    1. Fetch the post
    2. Fetch the post author from User collection
    3. Send email if author has email address
  - When action is "remove" for a COMMENT:
    1. Fetch the comment
    2. Fetch the comment author from User collection
    3. Send email if author has email address

**Old Behavior Preserved:**
- All moderation logs still created
- Status still set to "removed" or "visible"
- Restore functionality unchanged

**New Behavior:**
- User gets emailed when their post/comment is removed
- Email contains professional notice about removal

---

### 4. **backend/package.json** (UPDATED)
**Addition:**
```json
"nodemailer": "^6.9.7",
```

**Installation:**
When deployed or `npm install` runs, nodemailer will be installed automatically.

---

### 5. **backend/.env** (UPDATED)
**Added:** SMTP configuration for email sending

```env
# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@spotmies.com

# Force flagging for testing
# FORCE_FLAGGED=true
```

**Notes on Gmail:**
- Use [App Passwords](https://support.google.com/accounts/answer/185833) instead of regular password
- App password is 16 characters, generated in Google Account Security settings
- Enable 2-Step Verification first

**For Other SMTP:**
- Replace host/port/user/pass with your email provider
- Port 587 = STARTTLS, Port 465 = TLS

---

### 6. **backend/env.example** (UPDATED)
Documentation updated with SMTP config example for new developers.

---

## 🔄 Complete Flow Example

### Scenario: User posts toxic comment "You are so stupid"

**Step 1: Comment Creation**
- POST `/api/posts/{postId}/comments` with `{ text: "You are so stupid" }`

**Step 2: Backend Moderation Check**
- `runModeration()` called with the text
- Custom detection: regex finds "stupid" → **FLAGGED**
- Returns `{ flagged: true, provider: "custom_rules", ... }`

**Step 3: Comment Saved**
- Comment saved to MongoDB with `status: "flagged"`
- Comment hidden from feed (not returned in feed queries)
- Appears in admin dashboard

**Step 4: Admin Review**
- Admin logs into dashboard
- Sees comment in "Flagged Comments" section
- Clicks "Remove" button

**Step 5: Removal & Email Sent**
- POST `/api/admin/moderate` with `{ targetType: "comment", targetId: "...", action: "remove" }`
- Comment status changed to "removed"
- User's email fetched from database
- `sendModerationRemovalEmail()` called
- User receives professional email about removal
- Moderation log created for audit trail

---

## 🧪 Testing the System

### Test 1: Force Flagging
```env
# In backend/.env
FORCE_FLAGGED=true
```
- All posts/comments will be flagged automatically
- No API calls needed
- Good for testing UI without OpenAI

### Test 2: Custom Toxic Detection
1. Create post with text: `"You are useless and stupid"`
2. Backend will flag it immediately via custom patterns
3. Post appears as flagged in admin dashboard
4. No OPENAI_API_KEY needed

### Test 3: Admin Removal Email
1. Create/flag a post
2. Admin removes it via dashboard
3. Check terminal logs: should see `✅ Moderation removal email sent to user@email.com`
4. If SMTP configured, user gets actual email

### Test 4: Check Email (Gmail Setup)
1. Enable 2-Step Verification in Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a 16-char app password
4. Use as SMTP_PASS in .env
5. Set `SMTP_USER=your-gmail@gmail.com`

---

## 📊 Database Impact

**No schema changes needed!** Everything works with existing models:

- `Post` model: already has `status`, `moderation` fields ✓
- `Comment` model: already has `status`, `moderation` fields ✓
- `User` model: already has `email` field ✓
- `ModerationLog` model: already exists ✓

---

## 🔐 Production Considerations

1. **SMTP Credentials:** Store in environment variables, never in code
2. **Email Rate Limits:** No built-in limits; add rate limiting if needed
3. **Error Handling:** Email failures don't block moderation (intentional)
4. **Logging:** All moderation actions logged to ModerationLog collection
5. **Audit Trail:** Admin username tracked in moderation logs

---

## 🚀 Deployment Steps

### On Render Backend:
1. Go to Environment Variables
2. Add:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   MAIL_FROM=noreply@spotmies.com
   OPENAI_API_KEY=sk-proj-...
   JWT_SECRET=...
   ```
3. Click Save (auto-redeploy)
4. Wait 2-3 minutes for deployment
5. Test by removing a flagged comment

---

## ✅ Backward Compatibility

All changes are **100% backward compatible**:
- Existing post/comment creation still works (status still set based on `flagged`)
- Existing admin APIs work unchanged
- Existing moderation logs still created
- Only new: email sending (gracefully skips if not configured)

---

## 📌 Code Quality Notes

- **Error Handling:** Comprehensive try/catch blocks
- **Graceful Degradation:** System works even if email SMTP not configured
- **Logging:** All important events logged to console and DB
- **Interview-Friendly:** Clean code, well-commented, easy to explain

---

## Git Commit
```
commit 667d648
Author: Team
Date: [timestamp]

    Add enhanced moderation system with custom toxic detection and email notifications
    
    - Enhanced moderation.js with custom regex-based toxic pattern detection
    - Added new mailer.js for SMTP email notifications
    - Updated admin routes to send emails when removing content
    - Added nodemailer to dependencies
    - Updated .env configuration examples
    - All changes backward compatible, graceful fallbacks in place
```

---

## 💡 Future Enhancements

1. Add email templates (custom HTML per violation type)
2. Add user appeal mechanism (user can contest removal)
3. Add batch email notifications (daily digest of moderation actions)
4. Add SMS notifications (requires Twilio integration)
5. Add webhook notifications (to external systems)

---

EOF
