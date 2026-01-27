

ITX4103/CSX4103 Requirement Engineering (541)


System name
Pop Mart Auction Platform

Project Objective  
To build a secure auction-based e-commerce system where:
Users can list their collectible Pop Mart toys for auction after passing a screening/verification process.
Buyers can browse items, place bids in real-time, and win auctions.
Admin acts as an escrow holder, keeping payment until:
The seller’s item is collected via courier,
The item passes physical authenticity checks,
The buyer receives it successfully.
The system manages payouts to sellers within one week after verification.
The platform automatically deducts a service fee from each completed transaction.

Stakeholders
Sellers
Users who want to list their Pop Mart toys for auction.
Buyers
Users who place bids on listed items. Buyers rely on:
Safe bidding
Secure escrow
Verified item authenticity
Courier delivery
Admins / Platform Operators
Responsible for:
Screening listings
Monitoring live auctions
Holding payment in escrow
Dispatching courier for item pickup
Performing authenticity verification
Releasing payout to seller within one week
Taking the platform transaction fee
Services/Process
Auction Listing Service
Seller submits item listing request (photos, condition, starting price).
Item goes live for the auction period.
Bidding Service
Buyers place incremental bids.
System ensures fairness by enforcing minimum increments and preventing self-bids.
Escrow Payment Service
When an auction ends, the buyer pays immediately.
Payment is held by the platform (not released to seller yet).
Item Collection and Verification
Courier is dispatched to collect the item from the seller.
Item arrive at the authentication center.
Staff checks item condition, originality, and matches listing details.
Delivery to Buyer
After verification, the item is shipped to the buyer.
Seller Payout Service
Once the buyer receives the item:
Platform deducts service fee
Remaining amount is paid out to seller within 7 days

Buyer Behavior
Buyers must attach their debit card, credit card or any available payment method during sign up. After bidding and if the buyer has won then the amount will be subtracted and be put on hold on the admin side.
If the buyer does not have enough amount in the account the system will first send an alert about insufficient funds. Payment will process again after a short time gap. If the buyer still does not add funds to account, the bid will be cancelled and the buyer will receive a warning.
If the buyer does this behavior again, the buyer will be banned from the platform.

Bidding notification 
Let’s say a buyer is bidding on an item. They bid 100. And then another buyer bids 150.
The buyer that bidded 100 will receive notification of “User X has outbidded you with 150” 
The main point is to show the previous top bidder that they are no longer the top bidder.

Functionality
Seller Functions
Submit item for auction listing (with photos, description, minimum price).
Set auction duration: minimum 1 hour, maximum 1 day.
Receive notification when the auction ends.
Send item to the office upon successful auction.
Get paid after authenticity verification.
Buyer Functions
Browse available auctions (blind boxes & resale items).
Bid in real-time.
Receive notifications when outbid or when auction ends.
Pay automatically when winning.
Receive verified products from office.
Auction System Functions
Real-time bidding countdown.
Minimum bid increments.
Auto-close when time ends.
Notify seller and buyer of auction results.
Authenticity Verification Workflow
Seller ships item to office.
Authenticity team verifies product (within 7 days).
If authentic, item shipped to buyer and money released to seller.
If inauthentic, buyer refunded, item returned/case revised.
Payment & Wallet
Buyers must have a valid payment method linked.
Money deducted only after auction success.
Sellers receive funds only after the verification stage.
Admin Functions
Manage categories and tags.
Suspend fraudulent users.
Access to transaction logs, reports, analytics.
Handle disputes.

Limitation 
The whole seller → logistics  handling → final verification of product → delivering to buyer will take place within 7 days and it cannot be shortened due to the time taken to process. We only allow Pop Mart related items due to ease of verification. Payment can only be transferred to seller when the item is verified and delivered to buyer
