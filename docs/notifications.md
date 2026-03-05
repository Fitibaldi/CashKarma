# CashKarma — Notifications

All notifications are stored in the `notifications` table and delivered in real time via Supabase Realtime subscriptions. Each notification has a `type`, a `title`, a `body`, an optional `group_id`, and an optional `actor_id` (the user who triggered it).

---

## Notification Types

### `payment_added`
**Triggered by:** Any group member adds a new expense.
**Recipients:** All group members except the one who added it.
**Title:** `New expense in {group}`
**Body:** `{actor} added "{description}" — €{amount}`
**Navigates to:** Group details page.

---

### `payment_edited`
**Triggered by:** Any group member edits an existing expense.
**Recipients:** All group members except the one who edited it.
**Title:** `Expense updated in {group}`
**Body:** `{actor} edited "{description}" — €{amount}`
**Navigates to:** Group details page.

---

### `payment_deleted`
**Triggered by:** Any group member deletes an expense.
**Recipients:** All group members except the one who deleted it.
**Title:** `Expense removed in {group}`
**Body:** `{actor} deleted "{description}"`
**Navigates to:** Group details page.

---

### `invitation_received`
**Triggered by:** Group creator/member invites a user to a group.
**Recipients:** The invited user.
**Title:** `You were invited to {group}`
**Body:** `{actor} invited you to join "{group}"`
**Actions in panel:** Accept / Decline buttons.
**Navigates to:** Group details page (on Accept).

---

### `invitation_accepted`
**Triggered by:** An invited user accepts a group invitation.
**Recipients:** The user who sent the invitation.
**Title:** `{new member} joined {group}`
**Body:** `{new member} accepted your invitation to "{group}"`
**Navigates to:** Group details page.

---

### `member_joined`
**Triggered by:** A user accepts an invitation **or** joins via invite link.
**Recipients:** All existing group members (excluding the inviter and the new member).
**Title:** `New member in {group}`
**Body (invite):** `{new member} joined "{group}"`
**Body (link):** `{new member} joined "{group}" via invite link`
**Navigates to:** Group details page.

---

### `settlement_recorded`
**Triggered by:** A group member records a debt settlement.
**Recipients:** The user who received the payment.
**Title:** `Payment received in {group}`
**Body:** `{payer} settled €{amount} with you in "{group}"`
**Navigates to:** Group details page.

---

### `leave_requested`
**Triggered by:** A group member requests to leave the group.
**Recipients:** The group creator.
**Title:** `Leave request in {group}`
**Body:** `{member} wants to leave "{group}". Approve or decline their request.`
**Actions in panel:** Approve / Decline buttons.

---

### `leave_request_approved`
**Triggered by:** The group creator approves a leave request.
**Recipients:** The member who requested to leave.
**Title:** `Leave request approved`
**Body:** `Your request to leave "{group}" has been approved.`
**Navigates to:** Group details page.

---

### `leave_request_declined`
**Triggered by:** The group creator declines a leave request.
**Recipients:** The member who requested to leave.
**Title:** `Leave request declined`
**Body:** `Your request to leave "{group}" was declined by the group creator.`
**Navigates to:** Group details page.

---

### `group_archived`
**Triggered by:** The group creator archives a group.
**Recipients:** All group members except the creator.
**Title:** `"{group}" has been archived`
**Body:** `The group "{group}" was archived. You can still view its history but no new payments or invitations are allowed.`
**Navigates to:** Group details page.

---

## Visibility Rules

Notifications are filtered so users only see notifications relevant to them:
- Notifications with a `group_id` are shown only if the user is currently a member of that group.
- `invitation_received` notifications are always shown, even if the user hasn't joined the group yet.

---

## Database Schema

```sql
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in (
               'payment_added', 'payment_edited', 'payment_deleted',
               'invitation_received', 'invitation_accepted',
               'settlement_recorded', 'member_joined',
               'leave_requested', 'leave_request_approved', 'leave_request_declined',
               'group_archived'
             )),
  title      text not null,
  body       text not null,
  group_id   uuid references public.groups(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
```
