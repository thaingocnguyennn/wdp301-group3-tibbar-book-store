# TIBBAR Book Store Mobile App

A React Native mobile application for the TIBBAR book e-commerce platform built with Expo.

## Features

### Authentication
- User registration with email and phone number
- Login with JWT token storage
- Secure token management with AsyncStorage

### Home
- Browse featured books
- View latest news
- Search and filter books by category
- Add books to wishlist

### Wishlist
- View saved books
- Remove from wishlist
- Quick navigation to book details

### Book Details
- View full book information
- Check ratings and reviews
- Add to cart
- Add to/remove from wishlist

### Cart & Checkout
- Manage cart items (add, update quantity, remove)
- Apply voucher codes for discounts
- Select delivery address
- View order summary

### Order Management
- View order history
- Track order status
- View detailed order information
- Cancel pending orders

### User Profile
- View profile information
- Edit profile details
- Change password
- Manage delivery addresses

### Support Chat
- Create support conversations
- Send and receive support messages
- Real-time chat with support team

## Tech Stack

- **React Native** with Expo
- **Axios** for API requests
- **React Navigation** for routing
- **AsyncStorage** for local data persistence
- **React Native Vector Icons** for UI icons

## Project Structure

```
src/
├── screens/           # Screen components for each feature
│   ├── Auth/         # Login, Register
│   ├── Home/         # Home screen
│   ├── Book/         # Book detail
│   ├── Wishlist/     # Wishlist
│   ├── Order/        # Cart, Checkout, Order history, Order detail
│   ├── User/         # Profile, Edit Profile, Change Password, Addresses
│   └── Support/      # Support chat
├── services/         # API service functions
├── navigation/       # Navigation configuration
├── context/          # React Context (Auth)
├── components/       # Reusable components
├── utils/            # Utilities (API client, Storage)
├── constants/        # Constants (API endpoints)
└── App.js           # App entry point
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```bash
cp .env.example .env
```

3. Update API_URL in .env:
```
API_URL=http://your-api-url:5000
```

## Running the App

### Start Expo development server:
```bash
npm start
```

### For Android:
```bash
npm run android
```

### For iOS:
```bash
npm run ios
```

### For Web:
```bash
npm run web
```

## API Configuration

The app connects to the MERN backend API. Configure the API URL in:
- `.env` file for environment-specific configuration
- `src/utils/api.js` for API client setup

### API Features

- Automatic JWT token injection in headers
- Token expiration handling
- Error handling and status code management

## Key Features Implementation

### Authentication Flow
1. User registers or logs in
2. JWT token stored in AsyncStorage
3. Token automatically injected in API requests
4. Token expiration triggers logout

### State Management
- Auth context for global authentication state
- Local state for component-specific data
- AsyncStorage for persistent data

### Navigation Structure
- Tab Navigator with 4 main tabs (Home, Wishlist, Orders, Profile)
- Stack navigators within each tab
- Modal screens for forms

## Development

### Adding a New Screen

1. Create screen file in `src/screens/{Feature}/ScreenName.js`
2. Create corresponding service in `src/services/` if needed
3. Add routes to appropriate navigator
4. Import and use in navigation structure

### Adding API Endpoints

1. Add endpoint constant in `src/constants/endpoints.js`
2. Create service function in `src/services/`
3. Use service in screen components

## Error Handling

- Try-catch blocks in all async operations
- User-friendly error messages with Alerts
- Loading states for all API calls
- Empty states for lists

## Best Practices

- Separate UI and API logic
- Reusable component architecture
- Consistent error handling
- Loading and empty states
- Mobile-friendly UI design
- Proper navigation flow

## Notes

- Ensure backend API is running before starting the app
- Update API_URL in .env to match your backend
- Test on both Android and iOS devices
- Check network connectivity before API calls
