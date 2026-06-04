# Shared Platform Reference

Audience: all signed-in roles.
Scope: shared.

## Public and protected access

Public pages include the landing page, login, register, vehicle list, and vehicle detail. Protected pages require authentication and then use role guards so users only access the pages intended for their own role.

## Notifications

The dashboard shell includes the notification bell. Verification approval, verification rejection, and license document submission can create notifications for relevant users or admins.

## Profile image uploads

Signed-in users can upload a profile image. The backend uploads the file to Cloudinary under the vehicle-rental/profiles folder and stores the returned image URL on the user profile.

## Vehicle image uploads

Authorized fleet users can upload vehicle images. The backend uploads vehicle images to Cloudinary under the vehicle-rental/vehicles folder.

## License document uploads

Signed-in users can upload a license document. The backend uploads the file to Cloudinary under the vehicle-rental/licenses folder, marks license_verified false, stores the document URL, and notifies admins that a license document was submitted.

## Cache behavior

Vehicle lists, vehicle details, availability, and dashboard stats use Redis-backed caching where implemented. Vehicle changes invalidate vehicle-related cache keys and admin or manager stats where relevant.

## RAG document chunking

The RAG service reads Markdown files from backend/rag_docs, splits text by paragraphs into chunks of about 500 characters with overlap for long paragraphs, embeds chunks through OpenRouter embeddings, and stores them in Chroma. Retrieval returns relevant excerpts with their source file names.

## Assistant configuration

The assistant requires OPENROUTER_API_KEY for embeddings and chat completions. If the key is missing, RAG indexing is skipped and chat returns a service unavailable error when trying to call the chat model.

## Assistant UI placement

The assistant appears as a sticky floating button. It is mounted on the landing page for public FAQ answers and inside the shared dashboard shell so it is available across customer, manager, and admin dashboards.
