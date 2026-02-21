# Report Evidence Placeholders (Mock Images)

Use this section in your report when screenshots are pending.  
Replace each `image` placeholder later with the actual screenshot file/path.

## req_admin_7 - Admin Approval Before Listing Goes Live
**Requirement text:** The system shall require admin approval before a seller listing is published as a live auction.

**Flow summary:**
1. Seller submits listing request from Seller Dashboard.
2. Listing enters pending review state.
3. Admin views pending listing in Admin Verification queue.
4. Admin approves or rejects; only approved listings go live.

**UI Evidence (Mock Placeholder):**
Seller submits listing request:
![image](image)

Admin views pending listing in review queue:
![image](image)

Admin approval/rejection action result:
![image](image)

**Explanation for report:**
The UI demonstrates that seller listings are not published immediately.  
They must first appear in the admin review queue, and publication occurs only after admin approval.

---

## req_admin_2 / req_buy_3 - Admin Verification Workflow After Auction End
**Requirement text (admin):** The system shall manage the authenticity verification workflow.  
**Requirement text (buyer):** The system shall verify items before delivery.

**Flow summary:**
1. Auction closes and payment is processed into escrow hold.
2. Admin opens the verification workflow case.
3. Admin sets verification outcome (pending/passed/failed) and shipment progression.
4. Delivery progression is controlled by verification state.

**UI Evidence (Mock Placeholder):**
Escrow case created after auction end:
![image](image)

Admin verification controls (status selection and save):
![image](image)

Post-verification case state (passed/failed outcome reflected):
![image](image)

**Explanation for report:**
The UI shows a dedicated post-auction verification stage where admin decisions directly control case progression.  
This demonstrates that authenticity verification is explicitly managed before final fulfillment.
