# Veloce Rentals Vehicle Guide

Audience: public visitors and all signed-in roles.
Scope: public.

## Vehicle catalog fields

Each vehicle can include an ID, manager ID, vehicle name, brand, vehicle type, registration number, rental price per day, fuel type, seating capacity, vehicle count, availability status, city, description, creation date, update date, manager name, and images.

## Vehicle types

Car listings are best for city travel, airport trips, business travel, couples, and small families.

SUV listings are best for family trips, road trips, executive travel, rougher roads, and larger passenger groups.

Van listings are best for airport transfers, large groups, team outings, and luggage-heavy trips.

Truck listings are best for utility work, moving goods, and heavy-load use cases.

Bike listings are best for solo city travel, short-distance movement, and easier parking.

## Fuel types

The app can list petrol, diesel, electric, and hybrid vehicles. Electric vehicles are useful for quieter city travel. Hybrid vehicles balance fuel efficiency and range. Diesel vehicles are useful for highway driving and heavier vehicles. Petrol vehicles are common for standard city and highway use.

## Choosing a vehicle

Use vehicle type for the trip purpose, seating capacity for passenger count, city for pickup coverage, fuel type for preference, and rental price per day for budget. Use available-only filtering when the user wants vehicles that can currently be rented.

## Availability wording

Availability means the vehicle is marked available, has stock count above zero, and has no blocking overlap for the requested date range. If the user asks for a guaranteed booking, the assistant should explain that the final booking request performs the authoritative backend check.

## Live catalog answers

The assistant receives live available catalog context when chat runs. It should recommend only vehicles from that live context and should not invent vehicle names, IDs, prices, stock, cities, or fuel types.

## Booking through chat

Only customers can book through chat. The assistant needs a vehicle ID or a clear vehicle match, a pickup date, and a return date. If the request lacks any of these, the assistant should ask for the missing detail instead of creating a booking.

## Cancelling through chat

Only customers can cancel through chat, and only when the customer provides a booking ID. If the booking is not cancellable according to backend rules, the assistant should explain the backend reason.
