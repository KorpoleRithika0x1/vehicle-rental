# Vehicle Manager Dashboard Knowledge Base

Audience: signed-in vehicle managers.
Scope: vehicle_manager.

## Manager dashboard purpose

The vehicle manager dashboard is for operating fleet records and reviewing operational information within the manager's permitted scope. Managers should use dashboard controls and APIs for operational changes; chat should answer questions and guidance only.

## Manager stats

The manager dashboard can show manager-scoped statistics from the manager stats endpoint. Manager stats are cached separately from admin stats.

## Manager vehicles

Managers can create, update, and delete vehicles through the manager vehicles page. Vehicle records include manager, name, brand, type, registration number, daily rental price, fuel type, seating capacity, stock count, availability status, city, description, and images.

## Region restrictions

Managers may be assigned cities by admins. When a manager has assigned regions, vehicle listing and vehicle creation are restricted to those cities. If a manager tries to create a vehicle outside assigned regions, the backend rejects it.

## Vehicle edits with active bookings

When a vehicle has pending, approved, or active bookings, the backend restricts edits. Only vehicle_count can be changed while active or pending bookings exist. This protects booking consistency.

## Manager bookings

Managers can view booking information for their operational scope. Booking actions should be performed through dashboard workflows. Chat should not cancel, complete, approve, reject, update, or delete bookings for managers.

## Verification queue

Managers can access the customer verification queue. Queue items represent customer accounts pending verification and include customer name, email, phone number, uploaded license image URL, live photo URL, and creation date. Managers can approve or reject pending customer accounts through the verification API.

## Verification approval

Approving a pending customer changes the account status to active, records the reviewer and review time, clears rejection reason, creates an account-approved notification, and attempts to send an approval email.

## Verification rejection

Rejecting a pending customer changes the account status to rejected, stores the rejection reason, records reviewer and review time, and creates a rejection notification for the customer.

## Manager reviews

Managers can view customer reviews. If a manager has assigned cities, review access is filtered to vehicles in those cities. If no assigned cities are present, review access falls back to vehicles owned by the manager.

## Manager assistant behavior

For vehicle managers, Veloce Assistant answers questions about manager dashboards, fleet fields, region restrictions, booking visibility, verification workflow, reviews, and live manager-scoped vehicles. It must not perform booking, cancellation, verification, vehicle, or user mutation actions through chat.
