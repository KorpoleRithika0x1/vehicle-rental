# Veloce Rentals Policies and Rules

Audience: public visitors and all signed-in roles.
Scope: public.

## Authentication and account status

The app uses JWT access and refresh tokens. Protected pages and APIs require an authenticated user. The backend rejects users who are not active, are blocked, or do not meet the role requirement for a protected endpoint.

Customer registration can include license and live-photo verification. Customers registered through the verification flow start as pending verification and must be approved before normal protected access succeeds.

## Public customer registration flow

Customer registration is available from `/register`. The Login page links to it with the text "Create one here" under "No account yet?" The customer registration form requires full name, email, phone number, password, a driving license image upload, and a live photo captured from the camera.

After the form is submitted successfully, the app stores the pending state in the browser session and shows a verification-submitted message. The customer receives access only after the submitted documents are approved.

## Roles

The public app supports customer onboarding and customer booking discovery. Protected operational dashboards exist for authorized staff roles, but public chat should not describe staff dashboard internals. Staff-role details belong only to the signed-in dashboard knowledge base for that exact role.

## Booking date rules

Pickup and return dates are validated on the backend. A return date must be after the pickup date. The minimum charged rental duration is one day. Booking APIs reject invalid date ranges.

## Booking overlap and stock rules

Customers cannot create a booking that overlaps with one of their existing pending, approved, or active bookings. Vehicle availability also checks overlapping bookings for the requested vehicle. Vehicle stock count and availability status must allow the rental.

## Booking status rules

The app uses booking statuses including pending, approved, active, completed, and cancelled. Revenue calculations include approved, active, and completed bookings. Cancellation and completion rules are enforced by backend services.

## Cancellation rules

Customers can cancel bookings only when the booking belongs to them and is allowed by backend status rules. The chat assistant is allowed to cancel only customer approved bookings when the customer gives a booking ID. Managers and admins should use dashboard workflows and APIs, not chat actions, for operational changes.

## Payment rules

Stripe must be configured on the backend before payment intent creation works. Payment intent creation validates dates, checks customer booking overlap, checks vehicle existence, checks vehicle availability status, checks booking overlap for the vehicle, calculates the amount in INR paise, and stores booking metadata on the Stripe PaymentIntent. Payment confirmation requires a succeeded PaymentIntent before creating and marking a booking paid.

## Reviews

Customers can submit one review for a booking only after that booking is completed and belongs to them. Review ratings must be between 1 and 5. Admins and vehicle managers can view reviews, with managers restricted by their assigned cities or own vehicles.

## Privacy and assistant boundaries

The assistant should use retrieved knowledge and live data rather than inventing behavior. Public users receive public knowledge only. Customers receive customer knowledge and their own booking context. Managers receive manager knowledge and manager-scoped vehicle data. Admins receive admin knowledge. The assistant should say it does not know when the knowledge base or live data does not answer a question.
