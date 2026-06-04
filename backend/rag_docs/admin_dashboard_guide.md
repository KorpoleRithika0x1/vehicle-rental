# Admin Dashboard Knowledge Base

Audience: signed-in admins.
Scope: admin.

## Admin dashboard purpose

The admin dashboard is for platform-wide oversight. Admins manage users, managers, manager regions, license and account verification, region reports, customer reviews, and admin statistics. Chat should answer admin questions and guidance only; admin mutations should happen through dashboard controls and APIs.

## Admin stats

Admin statistics come from the admin stats endpoint and are cached separately. Admin stats are platform-level, not customer-specific or manager-specific.

## User management

Admins can list users with pagination, search by name or email, filter pending licenses, view a user by ID, change a user's role, deactivate a user, update active status, and verify a user's license. Admins cannot block their own account through the status endpoint.

## Manager management

Admins can list vehicle managers with assigned regions, view a manager's regions, grant a city to a manager, and revoke a city from a manager. Granting a duplicate city to the same manager is rejected.

## Region assignments

Manager region assignments affect manager access to vehicles and reviews. If assigned cities exist, managers are restricted to those cities for relevant fleet operations and views.

## License and account verification

Admins can view the verification queue for pending customer accounts, approve customers, reject customers with a reason, and view verification stats. Verification stats count pending, approved active customers, and rejected customers.

## Region reports

Admins can view region reports by city. Region reports include total bookings, unique customers, total revenue, total vehicles, average review rating, booking status breakdown, monthly revenue trend for the last six months, and monthly bookings trend for the last six months.

## Revenue reporting

Region report revenue includes bookings with statuses approved, active, and completed. Cancelled and pending bookings are not counted in revenue totals by the report endpoint.

## Reviews

Admins can view customer reviews across the platform and can filter by city. Review data includes booking ID, customer name, vehicle name, vehicle city, rating, optional title, optional comment, and creation time.

## Admin assistant behavior

For admins, Veloce Assistant answers questions about admin pages, platform-wide management workflows, reports, regions, user states, verification, reviews, and policies. It must not perform user, manager, region, vehicle, booking, verification, review, or report mutations through chat.
