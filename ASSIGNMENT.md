# 🏥 Full-Stack Developer — Take-Home Assignment

**Position:** Mid-Level Full-Stack Developer  
**Estimated Time:** 4-6 hours  
**Focus:** Backend API Design, Code Quality, Bug Detection

---

## Overview

You've been given a **starter codebase** for a clinic appointment management API. The project is functional — it runs, connects to a database, and handles basic requests.

However, it was written by a junior developer and has **multiple bugs, design flaws, and missing features**. Your job is to:

1. **Review & Document** — Find the issues
2. **Fix & Improve** — Make the code production-ready
3. **Extend** — Add missing business logic

---

## Your Tasks

### Task 1: Code Review (Write-up)

Create a file called `REVIEW.md` in the project root. For each issue you find, document:
- **What** the issue is
- **Why** it's a problem
- **How** you fixed it (or would fix it)

We're looking for both obvious bugs and subtle design concerns. Think about what would break under real-world usage.

### Task 2: Fix the Schema

The Prisma schema has several design problems. Fix them and explain your changes in `REVIEW.md`. Think about:
- Data types and constraints
- Indexes for performance
- Preventing invalid data at the database level

### Task 3: Fix the API Bugs

The route handlers have logic bugs, missing error handling, and incorrect HTTP semantics. Fix them. Priority areas:
- Input validation (add Zod or your preferred library)
- Proper HTTP status codes
- Error handling that doesn't swallow information

### Task 4: Implement Missing Business Logic

These features are referenced in the code but not actually implemented:

1. **Slot Availability** — The `/doctors/:id/slots` endpoint returns all slots without checking existing bookings. Fix it to return only *available* slots.

2. **Appointment Status Machine** — The status update endpoint accepts any value. Implement proper state transitions:
   ```
   BOOKED → COMPLETED ✅
   BOOKED → CANCELLED ✅
   COMPLETED → (anything) ❌
   CANCELLED → (anything) ❌
   ```

3. **Daily Token Reset** — Token numbers should reset to 1 each day and be unique per day. Handle concurrent bookings safely.

---

## Evaluation Criteria

| Criteria | Weight | What We're Looking For |
|---|---|---|
| **Bug Detection** | 30% | How many issues did you find? Did you catch subtle ones? |
| **Schema Fixes** | 25% | Proper constraints, types, indexes |
| **Code Quality** | 25% | Clean fixes, good validation, proper error handling |
| **Business Logic** | 20% | Correct slot filtering, state machine, safe token generation |

---

## Submission

1. Fork this repo and work on your fork
2. Make **clean, atomic commits** — we review your commit history
3. Ensure the project runs with the setup instructions in `README.md`
4. Include your `REVIEW.md` with documented findings
5. Share your fork's URL via email

**Deadline:** 24 hours from receiving this assignment

> **Tip:** We value *thoroughness of your code review* as much as the fixes themselves. Finding a subtle issue and explaining why it matters is more impressive than fixing 10 obvious ones without explanation.

*Good luck! Reach out if you have questions about the setup.*
