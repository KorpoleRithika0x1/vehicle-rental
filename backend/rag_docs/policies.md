# Veloce Rentals — Rental Policies

## Booking confirmation
When you book a vehicle, the system checks real-time availability and stock count. If the vehicle is available for your dates, the booking is confirmed with status **approved**.

## Cancellation policy
- Customers may cancel their own **approved** bookings.
- Bookings that are pending, active, completed, or already cancelled cannot be cancelled via the cancel API.
- When cancelling an approved booking, vehicle stock is restored automatically.
- Always confirm the booking ID before cancelling.

## Date and availability
- Pickup and return dates are validated server-side.
- If another customer books the same vehicle for overlapping dates and stock runs out, new bookings for those dates will be rejected.
- The platform uses distributed locking to prevent double-booking during concurrent requests.

## Account requirements
- Only customers with an **active** account status can use booking features.
- License verification may be required for certain vehicles or account types.

## Pricing
- Total price = daily rental rate × number of calendar days between pickup and return.
- Prices are shown in INR on the platform.

## Assistant capabilities
The dashboard chat assistant can:
- Answer questions about vehicles, policies, and your bookings
- Recommend available vehicles based on type, city, or budget
- Create bookings when you provide vehicle ID and dates
- Cancel approved bookings when you provide a booking ID

## Data privacy
Your booking history and profile information are only used to personalize assistant responses and are not shared with other customers.
