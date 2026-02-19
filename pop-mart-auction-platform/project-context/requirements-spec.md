# Pop Mart Auction Platform - Requirement Specification

## Revision Markers
- `[NEW]` indicates requirements newly added in this revision (February 19, 2026).

## Problem Statements

### Buyers
| Problem ID | Problem Statement |
|---|---|
| prob_buy_1 | A buyer wants to bid safely without fear of fraud |
| prob_buy_2 | A buyer wants to be notified when outbid |
| prob_buy_3 | A buyer wants assurance that items are authentic |
| prob_buy_4 | A buyer wants secure payment processing after winning |
| prob_buy_5 | A buyer wants to receive a refund if the item fails verification |
| prob_buy_6 | A buyer wants to track delivery status after purchase |
| prob_buy_8 | [NEW] A buyer wants payment status visibility from the payment gateway during auction settlement |
| prob_buy_9 | [NEW] A buyer wants to save payment method and shipping address for checkout simulation |

### Sellers
| Problem ID | Problem Statement |
|---|---|
| prob_sell_1 | A seller wants secure payment after auction completion |
| prob_sell_2 | A seller wants protection from non-paying buyers |
| prob_sell_3 | A seller wants to set auction duration within allowed limits |
| prob_sell_4 | A seller wants to be notified when their item is sold |
| prob_sell_5 | A seller wants to track the verification status of their item |
| prob_sell_6 | A seller wants transparency on service fee deductions |
| prob_sell_7 | [NEW] A seller wants a clear reason if their listing is rejected during admin screening |
| prob_sell_8 | [NEW] A seller wants to save payout method and address details for settlement simulation |

### Admins
| Problem ID | Problem Statement |
|---|---|
| prob_admin_1 | An admin wants to control escrow payments securely |
| prob_admin_2 | An admin wants to verify the authenticity of submitted items |
| prob_admin_3 | An admin wants to monitor live auctions to prevent suspicious activity |
| prob_admin_4 | An admin wants to manage disputes between buyers and sellers |
| prob_admin_5 | An admin wants the ability to suspend or ban fraudulent users |
| prob_admin_6 | An admin wants to generate transaction and revenue reports |
| prob_admin_7 | [NEW] An admin wants to approve or reject seller listing requests before any auction goes live |
| prob_admin_8 | [NEW] An admin wants rejection decisions to include a mandatory reason |
| prob_admin_9 | [NEW] An admin wants payment gateway attempt logs for audit and failure tracking |

## Functional Requirements
| From Problem ID | Requirement ID | Functional Requirement |
|---|---|---|
| prob_buy_1 | req_buy_1 | The system shall allow buyers to place realtime bids. |
| prob_buy_2 | req_buy_2 | The system shall notify buyers when they are outbid. |
| prob_buy_3 | req_buy_3 | The system shall verify items before delivery. |
| prob_buy_4 | req_buy_4 | The system shall process payment automatically after an auction win. |
| prob_buy_5 | req_buy_5 | The system shall refund buyers if an item fails authenticity verification. |
| prob_buy_6 | req_buy_6 | The system shall provide shipment tracking information to buyers. |
| prob_buy_8 | req_buy_8 | [NEW] The system shall show buyers payment gateway status updates for their winning auction payments. |
| prob_buy_9 | req_buy_9 | [NEW] The system shall allow buyers to save and update payment method and shipping address details. |
| prob_sell_1 | req_sell_1 | The system shall release payment to sellers after verification and successful delivery. |
| prob_sell_2 | req_sell_2 | The system shall prevent auction completion if payment is not successful. |
| prob_sell_3 | req_sell_3 | The system shall allow sellers to select auction duration within defined limits. |
| prob_sell_4 | req_sell_4 | The system shall notify sellers when their item is sold. |
| prob_sell_5 | req_sell_5 | The system shall allow sellers to track item verification status. |
| prob_sell_6 | req_sell_6 | The system shall clearly display platform service fee deductions. |
| prob_sell_7 | req_sell_7 | [NEW] The system shall show sellers the rejection reason when a listing request is rejected by admin. |
| prob_sell_8 | req_sell_8 | [NEW] The system shall allow sellers to save and update payout method and address details. |
| prob_admin_1 | req_admin_1 | The system shall hold buyer payments in escrow until verification is complete. |
| prob_admin_2 | req_admin_2 | The system shall manage the authenticity verification workflow. |
| prob_admin_3 | req_admin_3 | The system shall allow admins to monitor live bidding activities. |
| prob_admin_4 | req_admin_4 | The system shall allow admins to resolve disputes between users. |
| prob_admin_5 | req_admin_5 | The system shall allow admins to suspend or ban user accounts. |
| prob_admin_6 | req_admin_6 | The system shall generate transaction and revenue reports for platform analysis. |
| prob_admin_7 | req_admin_7 | [NEW] The system shall require admin approval before a seller listing is published as a live auction. |
| prob_admin_8 | req_admin_8 | [NEW] The system shall require admins to enter a rejection reason when rejecting a seller listing request. |
| prob_admin_9 | req_admin_9 | [NEW] The system shall log payment gateway attempts and outcomes for each auction settlement and expose them in admin reporting. |
