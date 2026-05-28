import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.database import AsyncSessionLocal, Base, engine
from app.models import Booking, BookingStatus, FuelType, User, UserRole, Vehicle, VehicleImage, VehicleType
from app.utils.password import hash_password


USERS = [
    {"name": "Platform Admin", "email": "admin@rental.com", "password": "Admin123!", "role": UserRole.ADMIN, "phone_number": "+1 555 100 0001"},
    {"name": "Nina Manager", "email": "manager1@rental.com", "password": "Manager123!", "role": UserRole.VEHICLE_MANAGER, "phone_number": "+1 555 100 0002"},
    {"name": "Omar Manager", "email": "manager2@rental.com", "password": "Manager123!", "role": UserRole.VEHICLE_MANAGER, "phone_number": "+1 555 100 0003"},
    {"name": "Ava Customer", "email": "customer1@rental.com", "password": "Customer123!", "role": UserRole.CUSTOMER, "phone_number": "+1 555 100 0004"},
    {"name": "Leo Customer", "email": "customer2@rental.com", "password": "Customer123!", "role": UserRole.CUSTOMER, "phone_number": "+1 555 100 0005"},
    {"name": "Mia Customer", "email": "customer3@rental.com", "password": "Customer123!", "role": UserRole.CUSTOMER, "phone_number": "+1 555 100 0006"},
]

VEHICLES = [
    ("Tesla Model 3", "Tesla", VehicleType.CAR, "EVR-1001", Decimal("129.00"), FuelType.ELECTRIC, 5, "City-ready EV with autopilot."),
    ("Toyota Fortuner", "Toyota", VehicleType.SUV, "SUV-2001", Decimal("154.00"), FuelType.DIESEL, 7, "Comfortable long-haul SUV."),
    ("Mercedes Sprinter", "Mercedes-Benz", VehicleType.VAN, "VAN-3001", Decimal("189.00"), FuelType.DIESEL, 12, "Spacious group travel van."),
    ("Ford Ranger", "Ford", VehicleType.TRUCK, "TRK-4001", Decimal("142.00"), FuelType.DIESEL, 5, "Utility truck with premium cabin."),
    ("Yamaha FZ", "Yamaha", VehicleType.BIKE, "BIK-5001", Decimal("39.00"), FuelType.PETROL, 2, "Agile city bike."),
    ("Honda Civic", "Honda", VehicleType.CAR, "CAR-1002", Decimal("88.00"), FuelType.PETROL, 5, "Reliable daily sedan."),
    ("BMW X5", "BMW", VehicleType.SUV, "SUV-2002", Decimal("176.00"), FuelType.HYBRID, 5, "Luxury SUV with hybrid efficiency."),
    ("Volkswagen California", "Volkswagen", VehicleType.VAN, "VAN-3002", Decimal("165.00"), FuelType.DIESEL, 6, "Lifestyle camper van."),
    ("Chevrolet Silverado", "Chevrolet", VehicleType.TRUCK, "TRK-4002", Decimal("158.00"), FuelType.PETROL, 5, "Heavy-duty and refined."),
    ("Ather 450X", "Ather", VehicleType.BIKE, "BIK-5002", Decimal("31.00"), FuelType.ELECTRIC, 2, "Fast urban electric scooter."),
    ("Hyundai Creta", "Hyundai", VehicleType.SUV, "SUV-2003", Decimal("96.00"), FuelType.PETROL, 5, "Smart compact SUV."),
    ("Kia Carnival", "Kia", VehicleType.VAN, "VAN-3003", Decimal("172.00"), FuelType.HYBRID, 7, "Executive family mover."),
    ("Audi A4", "Audi", VehicleType.CAR, "CAR-1003", Decimal("146.00"), FuelType.PETROL, 5, "Business-class sedan."),
    ("Mahindra Thar", "Mahindra", VehicleType.SUV, "SUV-2004", Decimal("118.00"), FuelType.DIESEL, 4, "Adventure-focused SUV."),
    ("Royal Enfield Meteor", "Royal Enfield", VehicleType.BIKE, "BIK-5003", Decimal("42.00"), FuelType.PETROL, 2, "Classic touring bike."),
]

IMAGE_POOL = [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541443131876-44b03de101c5?auto=format&fit=crop&w=1200&q=80",
]


async def seed_users(session):
    existing_users = {user.email: user for user in (await session.execute(select(User))).scalars().all()}
    created = []
    for record in USERS:
        user = existing_users.get(record["email"])
        if user is None:
            user = User(
                name=record["name"],
                email=record["email"],
                password_hash=hash_password(record["password"]),
                role=record["role"],
                phone_number=record["phone_number"],
            )
            session.add(user)
            created.append(user)
    if created:
        await session.commit()
    return {user.email: user for user in (await session.execute(select(User))).scalars().all()}


async def seed_vehicles(session, users_by_email):
    existing_vehicles = {vehicle.registration_number: vehicle for vehicle in (await session.execute(select(Vehicle))).scalars().all()}
    manager_ids = [users_by_email["manager1@rental.com"].id, users_by_email["manager2@rental.com"].id]

    for index, vehicle_data in enumerate(VEHICLES):
        name, brand, vehicle_type, reg_no, price, fuel_type, seats, description = vehicle_data
        if reg_no in existing_vehicles:
            continue
        vehicle = Vehicle(
            manager_id=manager_ids[index % len(manager_ids)],
            vehicle_name=name,
            brand=brand,
            vehicle_type=vehicle_type,
            registration_number=reg_no,
            rental_price_per_day=price,
            fuel_type=fuel_type,
            seating_capacity=seats,
            availability_status=True,
            description=description,
        )
        session.add(vehicle)
        await session.flush()
        session.add(
            VehicleImage(
                vehicle_id=vehicle.id,
                image_url=IMAGE_POOL[index % len(IMAGE_POOL)],
                is_primary=True,
            )
        )
    await session.commit()


async def seed_bookings(session, users_by_email):
    existing_bookings = await session.scalar(select(Booking.id).limit(1))
    if existing_bookings:
        return

    vehicles = (await session.execute(select(Vehicle).order_by(Vehicle.id.asc()))).scalars().all()
    now = datetime.utcnow().replace(hour=10, minute=0, second=0, microsecond=0)
    booking_specs = [
        (users_by_email["customer1@rental.com"].id, vehicles[0].id, now + timedelta(days=4), now + timedelta(days=7), BookingStatus.PENDING),
        (users_by_email["customer2@rental.com"].id, vehicles[1].id, now + timedelta(days=6), now + timedelta(days=10), BookingStatus.APPROVED),
        (users_by_email["customer1@rental.com"].id, vehicles[2].id, now - timedelta(days=1), now + timedelta(days=2), BookingStatus.ACTIVE),
        (users_by_email["customer3@rental.com"].id, vehicles[3].id, now - timedelta(days=20), now - timedelta(days=15), BookingStatus.COMPLETED),
        (users_by_email["customer2@rental.com"].id, vehicles[4].id, now + timedelta(days=15), now + timedelta(days=18), BookingStatus.CANCELLED),
    ]

    for customer_id, vehicle_id, pickup, dropoff, status in booking_specs:
        vehicle = next(vehicle for vehicle in vehicles if vehicle.id == vehicle_id)
        days = max((dropoff.date() - pickup.date()).days, 1)
        session.add(
            Booking(
                customer_id=customer_id,
                vehicle_id=vehicle_id,
                pickup_date=pickup,
                return_date=dropoff,
                total_amount=vehicle.rental_price_per_day * days,
                status=status,
            )
        )
    await session.commit()


async def main():
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with AsyncSessionLocal() as session:
            users_by_email = await seed_users(session)
            await seed_vehicles(session, users_by_email)
            await seed_bookings(session, users_by_email)
            print("Seed data created successfully.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
