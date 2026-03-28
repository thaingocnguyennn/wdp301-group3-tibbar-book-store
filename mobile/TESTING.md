# Testing Guide - TIBBAR Mobile App

This guide provides comprehensive testing workflows for all features.

## Prerequisites

- Mobile app running (iOS/Android/Expo)
- Backend API running at configured URL
- Test user accounts (create via registration)
- Network connectivity

## Test Workflows

### 1. Authentication Tests

#### 1.1 User Registration
1. Tap "Register" button
2. Fill in all fields:
   - Full Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "1234567890"
   - Password: "password123"
   - Confirm: "password123"
3. Tap "Register"
4. **Expected**: Navigate to home screen, user logged in
5. **Verify**: Profile shows correct name and email

#### 1.2 User Login
1. Logout (go to Profile > Logout)
2. Fill login form:
   - Email: "john@example.com"
   - Password: "password123"
3. Tap "Login"
4. **Expected**: Navigate to home screen
5. **Verify**: Profile page shows correct user data

#### 1.3 Form Validation
1. Try registering with invalid email
   - **Expected**: Error message "Please enter a valid email"
2. Try login with short password
   - **Expected**: Error message shown
3. Try matching different passwords
   - **Expected**: Error on register

#### 1.4 Logout
1. Go to Profile > Logout
2. Tap "Logout"
3. **Expected**: Return to login screen
4. **Verify**: Cannot access app features without logging in

---

### 2. Home Screen Tests

#### 2.1 Book Display
1. Launch app (auto-logged in)
2. **Expected**: Home screen loads, books displayed in grid
3. **Verify**: 
   - Book images show correctly
   - Titles and authors visible
   - Prices displayed
   - Scrollable grid

#### 2.2 News Section
1. Scroll down on Home screen
2. **Expected**: "Latest News" section visible
3. **Verify**: News items displayed with dates

#### 2.3 Search Functionality
1. Tap search box
2. Type "Harry" (or any book keyword)
3. Tap search button
4. **Expected**: Results filtered to matching books
5. **Verify**: Results update dynamically

#### 2.4 Pull-to-Refresh
1. On Home screen, pull down
2. **Expected**: Loading indicator appears
3. **Verify**: Data refreshes, books reload

---

### 3. Book Detail Tests

#### 3.1 View Book Details
1. Tap any book on Home
2. **Expected**: Book Detail screen opens
3. **Verify**: All details visible:
   - Full image
   - Title and author
   - Full price
   - Rating and reviews
   - Description
   - Reviews list

#### 3.2 Add to Cart
1. On Book Detail, tap "Add to Cart"
2. **Expected**: Confirmation alert
3. Go to Orders > Cart
4. **Verify**: Book added to cart with correct price

#### 3.3 Wishlist from Detail
1. Tap heart icon on Book Detail
2. **Expected**: Heart fills (wishlisted)
3. Tap again
4. **Expected**: Heart empties (removed)

#### 3.4 View Reviews
1. Scroll to reviews section
2. **Expected**: Reviews display with:
   - Reviewer name
   - Star rating
   - Review text
   - Date (if available)

---

### 4. Wishlist Tests

#### 4.1 Add to Wishlist
1. On Home, tap heart icon on book card
2. Go to Wishlist tab
3. **Expected**: Book appears in wishlist grid
4. **Verify**: Correct book displayed with filled heart

#### 4.2 Remove from Wishlist
1. On Wishlist, tap heart icon on book
2. **Expected**: Book removed, tooltip confirms
3. **Verify**: Book no longer in wishlist

#### 4.3 Navigate to Book Detail
1. Tap any book on Wishlist
2. **Expected**: Navigate to Book Detail
3. **Verify**: Same book details shown

#### 4.4 Empty Wishlist
1. Remove all books from wishlist
2. Go back to Wishlist
3. **Expected**: "Your wishlist is empty" message

---

### 5. Cart Tests

#### 5.1 View Cart
1. Go to Orders > Cart
2. **Expected**: Cart items displayed with:
   - Book image
   - Title
   - Price
   - Quantity
   - Remove button

#### 5.2 Update Quantity
1. In cart, tap minus button on item
2. Tap plus button multiple times
3. **Expected**: Quantity updates, total recalculates
4. **Verify**: Price changes correctly

#### 5.3 Remove from Cart
1. Tap X icon on cart item
2. **Expected**: Item removed
3. **Verify**: Subtotal and tax update

#### 5.4 Cart Summary
1. Add multiple items
2. **Expected**: See correct total:
   - Subtotal: Sum of all items
   - Tax: 10% of subtotal
   - Total: Subtotal + Tax
3. **Verify**: Math is correct

#### 5.5 Empty Cart
1. Remove all items
2. **Expected**: "Your cart is empty" message
3. Tap "Continue Shopping" or navigate home

---

### 6. Checkout Tests

#### 6.1 Start Checkout
1. In cart with items, tap "Proceed to Checkout"
2. **Expected**: Checkout screen opens
3. **Verify**: All cart items shown in summary

#### 6.2 Select Address
1. If addresses exist, radio buttons show
2. Select an address
3. **Expected**: Address highlighted
4. **Verify**: Correct address selected

#### 6.3 Add New Address (if none)
1. On Checkout, address section empty
2. Navigate back and add address in Profile
3. Return to checkout
4. **Expected**: New address available

#### 6.4 Apply Voucher
1. Enter valid voucher code (get from backend)
2. Tap "Apply"
3. **Expected**: Discount applied, total reduced
4. **Verify**: New total = old total - discount

#### 6.5 Invalid Voucher
1. Enter invalid voucher code
2. Tap "Apply"
3. **Expected**: Error message "Invalid voucher code"

#### 6.6 Place Order
1. Select address
2. (Optional) Apply voucher
3. Tap "Place Order"
4. **Expected**: 
   - Order confirmation
   - Navigate to Order History
   - Order appears in list

---

### 7. Order Management Tests

#### 7.1 View Order History
1. Go to Orders > Order History
2. **Expected**: List of all orders
3. **Verify**: 
   - Order IDs shown
   - Status badges displayed
   - Dates correct
   - Amounts accurate

#### 7.2 View Order Details
1. Tap any order
2. **Expected**: Order Detail screen opens
3. **Verify**:
   - All items listed
   - Item prices correct
   - Delivery address shown
   - Total matches

#### 7.3 Order Calculations
1. Review order items
2. **Expected**: 
   - Subtotal = sum of items
   - Tax = subtotal × 10%
   - Total = subtotal + tax - discount
3. **Verify**: Math is accurate

#### 7.4 Cancel Pending Order
1. On pending order detail
2. Tap "Cancel Order"
3. Confirm cancellation
4. **Expected**: Status changes to "Cancelled"
5. **Verify**: Cannot cancel again

#### 7.5 Cannot Cancel Delivered
1. On delivered order detail
2. **Expected**: No cancel button visible

---

### 8. User Profile Tests

#### 8.1 View Profile
1. Go to Profile tab
2. **Expected**: 
   - User avatar with initials
   - Full name
   - Email

#### 8.2 Edit Profile
1. Tap "Edit Profile"
2. Fill in new data
3. Tap "Save Changes"
4. **Expected**: Confirm success alert
5. Go back to profile
6. **Verify**: Changes saved

#### 8.3 Change Password
1. Tap "Change Password"
2. Fill in:
   - Current password: correct
   - New password: new123456
   - Confirm: new123456
3. Tap "Change Password"
4. **Expected**: Success alert
5. **Verify**: Can login with new password

#### 8.4 Password Validation
1. Try mismatched passwords
2. **Expected**: Error shown
3. Try short password
4. **Expected**: Error about length

---

### 9. Address Management Tests

#### 9.1 View Addresses
1. Go to Profile > Manage Addresses
2. **Expected**: List of addresses
3. **Verify**: Each shows full info

#### 9.2 Add Address
1. Tap "Add New Address"
2. Fill all fields:
   - Full Name
   - Phone Number
   - Street
   - Ward
   - District
   - City
3. Tap "Save"
4. **Expected**: Address added to list
5. **Verify**: Available for checkout

#### 9.3 Edit Address
1. Find address in list
2. Tap "Edit"
3. Change a field (e.g., street)
4. Tap "Save"
5. **Expected**: Changes saved
6. **Verify**: Updated in list

#### 9.4 Delete Address
1. Find address in list
2. Tap "Delete"
3. Confirm deletion
4. **Expected**: Address removed
5. **Verify**: No longer in list

#### 9.5 Address in Checkout
1. Go to Orders > Cart
2. Add items
3. Go to Checkout
4. **Expected**: All addresses available for selection

---

### 10. Support Chat Tests

#### 10.1 View Conversations
1. Go to Profile > Support Chat
2. **Expected**: List of conversations (if any)
3. **Verify**: Each shows relevant info

#### 10.2 Send Message
1. In conversation, type message
2. Tap send button
3. **Expected**: Message appears in chat
4. **Verify**: Own message on right side

#### 10.3 Receive Messages
1. Simulate support response (via API/admin)
2. **Expected**: Message appears from support
3. **Verify**: Support message on left side

#### 10.4 Create Conversation
1. If no conversations, prompt to create
2. Enter subject: "Issue with book order"
3. Tap create
4. **Expected**: New conversation starts
5. **Verify**: Can send messages

---

## Performance Tests

### App Performance
1. Launch app
2. **Expected**: Startup < 3 seconds
3. Navigate between tabs
4. **Expected**: Smooth transitions
5. Scroll book list
6. **Expected**: Smooth scrolling

### Network Tests
1. Test on slow network (3G simulation)
2. **Expected**: Loading indicators appear
3. Timeouts handled gracefully
4. Back up when network restored

### Storage Tests
1. Close and reopen app
2. **Expected**: Still logged in
3. Logout
4. **Expected**: Auth token cleared

---

## Error Scenario Tests

### Network Errors
1. Turn off network/WiFi
2. Try to load books
3. **Expected**: Error message shown
4. Turn network back on
5. Retry or refresh
6. **Expected**: Data loads

### Invalid Credentials
1. Login with wrong password
2. **Expected**: "Invalid credentials" error

### Expired Token
1. Wait for token to expire (backend-dependent)
2. Try API call
3. **Expected**: Auto-logout occurs

### Invalid Voucher
1. Enter random voucher code
2. Tap apply
3. **Expected**: Error message displayed

---

## Regression Tests

Run these before each release:

- [ ] User can register
- [ ] User can login
- [ ] User can browse books
- [ ] User can search books
- [ ] User can add to wishlist
- [ ] User can add to cart
- [ ] User can checkout
- [ ] User can view order history
- [ ] User can edit profile
- [ ] User can manage addresses
- [ ] User can chat with support
- [ ] User can logout

---

## Test Report Template

```
Date: ___________
Device: _________
OS Version: _____
App Version: ____
Backend URL: ____

Test Results:
[ ] Authentication - PASS/FAIL
[ ] Home Screen - PASS/FAIL
[ ] Book Details - PASS/FAIL
[ ] Wishlist - PASS/FAIL
[ ] Cart - PASS/FAIL
[ ] Checkout - PASS/FAIL
[ ] Orders - PASS/FAIL
[ ] Profile - PASS/FAIL
[ ] Addresses - PASS/FAIL
[ ] Support Chat - PASS/FAIL

Issues Found:
1. ___________________________
2. ___________________________
3. ___________________________

Notes:
____________________________
```

---

## Tips

- Test on both Android and iOS if possible
- Test on different screen sizes (phones, tablets)
- Test with different network conditions
- Create multiple test accounts
- Test with various data (many books, many orders, etc.)
- Clear app cache between test sessions
- Check console logs for errors
- Verify all alerts and messages are clear

---

Happy Testing! 🧪
