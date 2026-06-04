# Veloce Rentals Public FAQ

Audience: public visitors and all signed-in roles.
Scope: public.

## What is Veloce Rentals?

Veloce Rentals is a vehicle rental web app for browsing vehicles, checking availability, registering a customer account, and booking rentals after approval. Some operational areas are protected by signed-in roles.

## What can visitors do before signing in?

Visitors can open the landing page, read the FAQ and contact information, use the fast search form, browse the public vehicle catalog, filter vehicles, and view vehicle details. Booking a vehicle requires a signed-in customer account.

## How does a customer create an account?

To create a customer account, open the Login page and use the "Create one here" link below the sign-in form. That link opens `/register`. The Register page is the customer registration screen.

On the Register page, the customer enters full name, email, phone number, and password. The customer must upload a driving license image and capture a live photo with the camera. After submitting, the app shows "Verification Submitted" and explains that a manager must verify the license and live photo before access is approved.

## Why is there no separate sign-up button on the login form?

The login page does not use a large button named Sign Up. It uses a text link that says "Create one here" after the sentence "No account yet?" That link goes to the Register page.

## What password format is required for customer registration?

The customer registration form requires a password with at least 8 characters, one uppercase letter, and one number. The form also validates that the email address is valid, the phone number format is valid, the license file is an image under 5MB, and a live photo has been captured.

## What happens after customer registration?

After registration, the customer account is pending verification. The customer cannot log in normally until a manager or admin approves the submitted license image and live photo. If the customer tries to log in while pending, the Login page shows a message that the account is awaiting verification.

## How does a customer book a car?

A customer can browse vehicles before signing in, but booking requires an approved customer account. After the customer account is approved, the customer signs in, opens the vehicle catalog or customer vehicles page, selects a vehicle, chooses pickup and return dates, enters any required pickup address, and confirms the booking. The backend checks date validity, customer booking overlap, vehicle availability, stock, and active vehicle overlaps before creating the booking.

## Can a public visitor book directly from the landing page?

No. A public visitor can search and inspect vehicles, but the final booking flow requires an approved signed-in customer account. The assistant can explain the steps but cannot create a booking for a signed-out visitor.

## What vehicle types does the app support?

The app supports car, SUV, van, truck, and bike listings. Vehicle records include name, brand, type, registration number, daily rental price, fuel type, seating capacity, stock count, availability status, city, description, and images.

## What search and filter options are available?

The vehicle catalog can be searched by vehicle name, brand, registration number, description, or city. It can also be filtered by vehicle type, brand, fuel type, minimum price, maximum price, and available-only status.

## What cities are represented in the landing-page content?

The landing page promotes destinations including Mumbai, Delhi, Bangalore, Goa, Kochi, Chennai, Manali, Guwahati, Kolkata, and Hyderabad. Actual availability depends on vehicle records currently stored in the backend.

## How is vehicle availability protected?

The backend checks vehicle availability and overlapping bookings. Booking creation uses Redis-based locking and database checks to reduce double-booking during concurrent requests.

## Does pricing update automatically?

The app calculates booking totals from the vehicle daily rental price and the number of rental days. Prices are displayed in INR. Payments, when enabled, use Stripe PaymentIntents in INR paise.

## How does the assistant work on the landing page?

On the landing page, Veloce Assistant answers general app, vehicle, FAQ, policy, and support questions from the public knowledge base and live vehicle catalog. A signed-out visitor should not receive dashboard-only guidance as if they were a customer, manager, or admin.

## How does the assistant work after login?

After login, the assistant uses the signed-in user's role to retrieve role-appropriate knowledge. Customers can receive customer booking and cancellation help. Other protected dashboards receive only the knowledge appropriate to the signed-in role.

## Contact and support

The public contact section lists phone, email, office address, and a contact form. The configured public contact email is care@velocerentals.com and the phone number shown in the app is +1 (800) 555-0199.
