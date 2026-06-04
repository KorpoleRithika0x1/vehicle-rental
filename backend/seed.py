import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.database import AsyncSessionLocal, Base, engine
from app.models import (
    Booking,
    BookingStatus,
    FuelType,
    ManagerRegion,
    RegionPickupAddress,
    User,
    UserRole,
    Vehicle,
    VehicleImage,
    VehicleType,
)
from app.utils.password import hash_password


USERS = [
    {"name": "Platform Admin", "email": "admin@rental.com", "password": "Admin123!", "role": UserRole.ADMIN, "phone_number": "+1 555 100 0001"},
    {"name": "Nina Manager", "email": "manager1@rental.com", "password": "Manager123!", "role": UserRole.VEHICLE_MANAGER, "phone_number": "+1 555 100 0002"},
    {"name": "Omar Manager", "email": "manager2@rental.com", "password": "Manager123!", "role": UserRole.VEHICLE_MANAGER, "phone_number": "+1 555 100 0003"},
    {"name": "Ava Customer", "email": "customer1@rental.com", "password": "Customer123!", "role": UserRole.CUSTOMER, "phone_number": "+1 555 100 0004"},
    {"name": "Leo Customer", "email": "customer2@rental.com", "password": "Customer123!", "role": UserRole.CUSTOMER, "phone_number": "+1 555 100 0005"},
    {"name": "Mia Customer", "email": "customer3@rental.com", "password": "Customer123!", "role": UserRole.CUSTOMER, "phone_number": "+1 555 100 0006"},
]

# (name, brand, type, reg, price, fuel, seats, description, city)
VEHICLES = [
    ("Tesla Model 3", "Tesla", VehicleType.CAR, "EVR-1001", Decimal("129.00"), FuelType.ELECTRIC, 5, "City-ready EV with autopilot.", "Mumbai"),
    ("Toyota Fortuner", "Toyota", VehicleType.SUV, "SUV-2001", Decimal("154.00"), FuelType.DIESEL, 7, "Comfortable long-haul SUV.", "Delhi"),
    ("Mercedes Sprinter", "Mercedes-Benz", VehicleType.VAN, "VAN-3001", Decimal("189.00"), FuelType.DIESEL, 12, "Spacious group travel van.", "Bangalore"),
    ("Ford Ranger", "Ford", VehicleType.TRUCK, "TRK-4001", Decimal("142.00"), FuelType.DIESEL, 5, "Utility truck with premium cabin.", "Goa"),
    ("Yamaha FZ", "Yamaha", VehicleType.BIKE, "BIK-5001", Decimal("39.00"), FuelType.PETROL, 2, "Agile city bike.", "Kochi"),
    ("Honda Civic", "Honda", VehicleType.CAR, "CAR-1002", Decimal("88.00"), FuelType.PETROL, 5, "Reliable daily sedan.", "Chennai"),
    ("BMW X5", "BMW", VehicleType.SUV, "SUV-2002", Decimal("176.00"), FuelType.HYBRID, 5, "Luxury SUV with hybrid efficiency.", "Manali"),
    ("Volkswagen California", "Volkswagen", VehicleType.VAN, "VAN-3002", Decimal("165.00"), FuelType.DIESEL, 6, "Lifestyle camper van.", "Guwahati"),
    ("Chevrolet Silverado", "Chevrolet", VehicleType.TRUCK, "TRK-4002", Decimal("158.00"), FuelType.PETROL, 5, "Heavy-duty and refined.", "Kolkata"),
    ("Ather 450X", "Ather", VehicleType.BIKE, "BIK-5002", Decimal("31.00"), FuelType.ELECTRIC, 2, "Fast urban electric scooter.", "Hyderabad"),
    ("Hyundai Creta", "Hyundai", VehicleType.SUV, "SUV-2003", Decimal("96.00"), FuelType.PETROL, 5, "Smart compact SUV.", "Mumbai"),
    ("Kia Carnival", "Kia", VehicleType.VAN, "VAN-3003", Decimal("172.00"), FuelType.HYBRID, 7, "Executive family mover.", "Delhi"),
    ("Audi A4", "Audi", VehicleType.CAR, "CAR-1003", Decimal("146.00"), FuelType.PETROL, 5, "Business-class sedan.", "Goa"),
    ("Mahindra Thar", "Mahindra", VehicleType.SUV, "SUV-2004", Decimal("118.00"), FuelType.DIESEL, 4, "Adventure-focused SUV.", "Chennai"),
    ("Royal Enfield Meteor", "Royal Enfield", VehicleType.BIKE, "BIK-5003", Decimal("42.00"), FuelType.PETROL, 2, "Classic touring bike.", "Manali"),
]

MANAGER_REGIONS = {
    "manager1@rental.com": ["Mumbai", "Delhi", "Bangalore", "Goa"],
    "manager2@rental.com": ["Kochi", "Chennai", "Manali", "Guwahati", "Kolkata", "Hyderabad"],
}

REGION_PICKUP_ADDRESSES = {
    "Mumbai": [
        ("CSIA Terminal 2", "Veloce Rentals Desk, Terminal 2 Access Road, Andheri East, Mumbai 400099"),
        ("Bandra West Hub", "14 Linking Road, Bandra West, Mumbai 400050"),
    ],
    "Delhi": [
        ("IGI Airport T3", "Arrivals Lane 4, Indira Gandhi International Airport, New Delhi 110037"),
        ("Connaught Place", "Shop 22, Inner Circle, Connaught Place, New Delhi 110001"),
    ],
    "Bangalore": [
        ("Kempegowda Airport", "Ground Floor, Arrivals Gate 3, Devanahalli, Bengaluru 560300"),
        ("MG Road Downtown", "88 Brigade Road, Ashok Nagar, Bengaluru 560025"),
    ],
    "Goa": [
        ("Dabolim Airport", "Counter 6, Dabolim Airport Road, Vasco da Gama, Goa 403801"),
        ("Calangute Beach", "221 Baga-Calangute Road, Calangute, Goa 403516"),
    ],
    "Kochi": [
        ("Cochin Airport", "Veloce Desk, Nedumbassery, Kochi 683111"),
        ("Marine Drive", "42 Shanmugham Road, Marine Drive, Kochi 682031"),
    ],
    "Chennai": [
        ("Chennai Airport", "Domestic Arrivals, GST Road, Meenambakkam, Chennai 600027"),
        ("Anna Nagar", "Plot 9, 2nd Avenue, Anna Nagar, Chennai 600040"),
    ],
    "Manali": [
        ("Mall Road Pickup", "Hotel Snow View Lane, Mall Road, Manali 175131"),
        ("Kullu Airport Road", "NH3 Service Road, Bhuntar, Kullu 175125"),
    ],
    "Guwahati": [
        ("Lokpriya Gopinath Bordoloi Airport", "Arrivals Parking Bay 2, Guwahati 781015"),
        ("Paltan Bazaar", "House 17, AT Road, Paltan Bazaar, Guwahati 781001"),
    ],
    "Kolkata": [
        ("Netaji Subhas Airport", "Terminal 2 Pickup Zone, Dum Dum, Kolkata 700052"),
        ("Park Street", "55 Park Street, Mullick Bazar, Kolkata 700016"),
    ],
    "Hyderabad": [
        ("RGIA Airport", "Veloce Counter, Shamshabad, Hyderabad 500409"),
        ("Hitech City", "Plot 12, Madhapur Main Road, Hitech City, Hyderabad 500081"),
    ],
}

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


async def seed_manager_regions(session, users_by_email, admin_id: int):
    for manager_email, cities in MANAGER_REGIONS.items():
        manager = users_by_email[manager_email]
        for city in cities:
            existing = await session.execute(
                select(ManagerRegion.id).where(
                    ManagerRegion.manager_id == manager.id,
                    ManagerRegion.city == city,
                )
            )
            if existing.scalar_one_or_none():
                continue
            session.add(ManagerRegion(manager_id=manager.id, city=city, granted_by=admin_id))
    await session.commit()


async def seed_pickup_addresses(session):
    for city, entries in REGION_PICKUP_ADDRESSES.items():
        for label, address in entries:
            existing = await session.execute(
                select(RegionPickupAddress.id).where(
                    RegionPickupAddress.city == city,
                    RegionPickupAddress.address == address,
                )
            )
            if existing.scalar_one_or_none():
                continue
            session.add(RegionPickupAddress(city=city, label=label, address=address))
    await session.commit()


async def seed_vehicles(session, users_by_email):
    existing_vehicles = {
        vehicle.registration_number: vehicle
        for vehicle in (await session.execute(select(Vehicle))).scalars().all()
    }
    manager_ids = [users_by_email["manager1@rental.com"].id, users_by_email["manager2@rental.com"].id]

    for index, vehicle_data in enumerate(VEHICLES):
        name, brand, vehicle_type, reg_no, price, fuel_type, seats, description, city = vehicle_data
        if reg_no in existing_vehicles:
            vehicle = existing_vehicles[reg_no]
            vehicle.city = city
            vehicle.manager_id = manager_ids[index % len(manager_ids)]
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
            vehicle_count=3 if index % 3 == 0 else 1,
            availability_status=True,
            city=city,
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
    addresses = {
        row.city: row.address
        for row in (await session.execute(select(RegionPickupAddress))).scalars().all()
    }
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
                pickup_address=addresses.get(vehicle.city),
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
            admin = users_by_email["admin@rental.com"]
            await seed_manager_regions(session, users_by_email, admin.id)
            await seed_pickup_addresses(session)
            await seed_vehicles(session, users_by_email)
            await seed_bookings(session, users_by_email)
            print("Seed data created successfully.")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
