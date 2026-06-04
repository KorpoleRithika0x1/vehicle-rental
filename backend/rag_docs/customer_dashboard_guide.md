# Customer Dashboard Knowledge Base

Audience: signed-in customers.
Scope: customer.

## Customer dashboard purpose

The customer dashboard is for finding vehicles, creating bookings, tracking current rentals, reviewing rental history, managing profile details, and using Veloce Assistant for customer-only booking help.

## Customer home dashboard

The customer dashboard shows a personalized welcome, customer statistics, recent booking information, and links to customer workflows. Customer statistics come from the customer stats endpoint and are scoped to the signed-in customer.

## Browse vehicles

Customers can browse vehicles from the vehicle catalog and use search or filters for city, brand, type, fuel, price, and availability. Vehicle detail pages show vehicle information, images, and booking entry points.

## Create a booking

Customers can create a booking from the booking confirmation page or by asking the assistant. Booking requires a vehicle, pickup date, return date, and optional pickup address. The backend validates date order, customer booking overlap, vehicle availability, stock, and active overlaps before creating the booking.

## Booking payment

If Stripe is configured, the customer payment flow creates a PaymentIntent before booking confirmation. The amount is calculated as daily rental rate times rental days and sent in INR paise. A booking is created and marked paid only after Stripe reports the PaymentIntent as succeeded.

## My Bookings

The My Bookings page shows active and upcoming rentals for the signed-in customer. Customers can inspect booking status, vehicle details, dates, total amount, and available actions.

## Rental History

The Rental History page shows past and present bookings. Completed bookings can be reviewed if the customer has not already reviewed that booking.

## Customer cancellation

Customers can cancel eligible bookings through the booking UI or chat. Chat cancellation requires the booking ID. If the booking is pending, active, completed, cancelled, not owned by the customer, or otherwise blocked by backend rules, the assistant should explain that it cannot cancel it.

## Customer profile

Customers can manage profile details, profile image, password, phone number, and license-related information where the UI exposes those controls. License document upload sends the document for verification and notifies admins.

## Customer reviews

Customers can submit a rating from 1 to 5 with optional title and comment, but only for their own completed bookings. One review is allowed per booking.

## Customer assistant behavior

For customers, Veloce Assistant can answer app questions, recommend live available vehicles, summarize the customer's booking context, create bookings when enough details are provided, and cancel eligible approved bookings when a booking ID is provided.
