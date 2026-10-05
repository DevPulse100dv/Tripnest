# TripNest account roles and local guide experiences

TripNest has three account roles stored in the user schema: travelers explore stays, compare listings, and write reviews; guides submit local experiences and manage visitor enquiries; admins maintain the stay catalogue and review guide submissions. There is no separate host account in the current version: the project operator creates and updates the stay listings. Stay listings are published when the administrator saves them; only guide experience submissions have an approval queue. The signup form lets a person choose Traveler or Local guide. Admin signup requires the site owner's private invite code. The login form asks for the same account type selected at signup, then verifies it against the stored account role before creating a session.

## Traveler and guide accounts

Guide signup gives access to the guide dashboard, but it is not a verification badge. A submitted guide experience stays private until approved by an admin. Guides can see their own submissions and incoming visitor enquiries on the guide dashboard. TripNest does not currently track completed tours, so it does not show a completed-tour count.

## Admin account setup

Set a high-entropy `ADMIN_INVITE_CODE` in the server environment (for local development, add it to `.env`; never commit the value). A trusted administrator uses that code only during signup and chooses **Administrator**. The application stores the role in MongoDB and uses the normal Passport username/password credentials afterward. The invite code is not an admin password and is never used for login.

## Verification boundary

The review form records whether an admin inspected identity or a guide credential. Guides may optionally attach a PDF/JPG/PNG licence or training certificate (up to 2 MB); the file is stored in MongoDB and downloadable only through the admin-protected review route. The application does not perform Aadhaar, background, police, licence-registry, or payment-provider checks and must not collect Aadhaar or other identity-document copies. Only mark a check after it has actually been completed with the applicant's consent. A checked badge reports the TripNest review performed; it is not a government endorsement or a safety guarantee.

## Try the flow

1. Create an account and choose **Local guide**.
2. Sign in through `/login`, select **Local guide**, and choose **Offer a local experience** from the guide dashboard.
3. Select a listing and submit the experience details. It remains pending and is not visible to visitors.
4. Create an admin account using the private invite code, then review and approve or decline guide submissions.
5. Open the associated stay as a traveler. Approved experiences appear under **Local experiences nearby**.
6. Sign in as a different traveler, send a contact request, then view it from the guide's dashboard.

## Access boundaries

All visitors can browse stay pages. Travelers can compare listings, write reviews, and send guide enquiries. Guides can view stays to associate with their experience submissions and manage their guide dashboard. Only administrators can create, edit, or delete stay listings and review guide submissions. Admin signup is protected by the invite code, and a role selected at login must exactly match the role saved on the account.
