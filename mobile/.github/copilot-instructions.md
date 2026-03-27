# Copilot Instructions for TIBBAR Mobile App

This file provides custom instructions for Copilot when working on the TIBBAR Book Store mobile app.

## Project Overview

React Native Expo application for TIBBAR book e-commerce platform with full authentication, product browsing, wishlists, cart, checkout, and order management.

## Architecture

### Clean Separation
- **Screens** (`src/screens/`): UI components and user interaction logic
- **Services** (`src/services/`): API calls and backend communication
- **Context** (`src/context/`): Global state management (Auth)
- **Components** (`src/components/`): Reusable UI components
- **Navigation** (`src/navigation/`): Screen routing and navigation
- **Utils** (`src/utils/`): Helper functions (API client, Storage)
- **Constants** (`src/constants/`): Centralized constants

### Key Patterns

1. **API Integration**
   - All API calls through `src/services/`
   - Axios client with interceptors in `src/utils/api.js`
   - Automatic JWT token injection and error handling

2. **State Management**
   - AuthContext for authentication state
   - Local component state for UI
   - AsyncStorage for persistence

3. **Error Handling**
   - Try-catch blocks in all async operations
   - User-friendly Alert messages
   - Loading states for all API calls
   - Empty states for data lists

4. **Navigation**
   - Tab Navigator for main sections (Home, Wishlist, Orders, Profile)
   - Stack navigators within each tab
   - Proper navigation parameters passing

## Development Guidelines

### When Adding a New Feature

1. **Create API Endpoint** in `src/constants/endpoints.js`
2. **Create Service** in `src/services/` directory
3. **Create Screen(s)** in `src/screens/{Feature}/`
4. **Add Navigation**:
   - Export screen from appropriate `Navigator.js`
   - Add stack screen with proper options
5. **Add Components** as needed in `src/components/`
6. **Test** with real API endpoints

### Code Standards

- Always handle loading and error states
- Use consistent error messages
- Separate UI logic from API logic
- Import services, not API client directly
- Use TypeScript-like JSDoc for complex functions
- Keep components focused and functional

### Common Imports

```javascript
// API & Storage
import apiClient from '../utils/api';
import { Storage } from '../utils/storage';

// Services
import { BookService } from '../services/bookService';
import { useAuth } from '../context/AuthContext';

// Components
import { Button } from '../components/Common/Button';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { TextInputField } from '../components/Common/TextInputField';

// Navigation
import { useNavigation, useRoute } from '@react-navigation/native';
```

## API Integration

### Backend Endpoints Map

- **Auth**: `/api/auth/` - Login, Register, Logout
- **Books**: `/api/books/` - Browse, Search, Filter
- **Wishlist**: `/api/wishlist/` - Add, Remove, View
- **Cart**: `/api/cart/` - Add, Update, Remove items
- **Orders**: `/api/orders/` - Create, View, Cancel
- **Users**: `/api/users/` - Profile, Addresses, Change Password
- **Support**: `/api/support-system/` - Chat, Conversations
- **News**: `/api/news/` - View news items
- **Reviews**: `/api/reviews/` - Book reviews

### API Configuration

- Base URL: Set in `.env` file → `API_URL`
- JWT Token: Auto-injected via interceptor
- Error Handling: 401 triggers auto-logout

## Testing Workflows

### Auth Flow
1. Register with email/phone/password
2. Login credentials stored in AsyncStorage
3. Verify token present in headers
4. Test logout clears storage

### Book Browsing
1. Load books on HomeScreen
2. Search and filter functionality
3. Wishlist add/remove
4. Navigate to book details

### Order Flow
1. Add items to cart
2. Update quantities
3. Checkout with address
4. Apply voucher code
5. Verify order creation
6. Check order history

## Mobile UI Considerations

- **Screen Size**: Handle various phone sizes (320px - 600px+)
- **Orientation**: Portrait mode primary
- **Touch Targets**: Minimum 44px height for buttons
- **Colors**: Primary #1a5490, Secondary #f5f5f5, Accent #e53935
- **SafeAreaView**: Wrapped in SafeAreaProvider
- **Keyboard**: Use KeyboardAvoidingView for forms

## Common Tasks

### Adding a New Endpoint
1. Define in `endpoints.js`
2. Create service function
3. Call in screen with try-catch
4. Show loading/error states

### Adding Form Input
1. Use `TextInputField` component
2. Validate before submission
3. Show field-level errors
4. Handle submission loading

### Adding List Screen
1. Use FlatList component
2. Add RefreshControl for pull-to-refresh
3. Show LoadingSpinner while loading
4. Show ErrorMessage on error
5. Show empty state when no data

## Debugging

### Common Issues

1. **401 Unauthorized**: Token expired, check localStorage/AsyncStorage
2. **Network Error**: Verify API_URL and backend running
3. **Navigation Not Working**: Check screen names match exactly
4. **Form Not Submitting**: Validate form data, check error states

### Debug Tips

- Check network tab for API responses
- Use console.log for state changes
- Verify AsyncStorage persistence
- Test on actual device (not just emulator)
- Check Android/iOS specific issues separately

## Files to Always Check

- `.env` - API configuration
- `src/utils/api.js` - Interceptors
- `src/context/AuthContext.js` - Auth state
- `src/navigation/RootNavigator.js` - Navigation structure
- `src/constants/endpoints.js` - API routes

## Performance Tips

- Paginate large lists
- Use FlatList for rendering large datasets
- Memoize expensive components if needed
- Lazy load screens in navigation
- Optimize images (use thumbnails)

## Next Development Priorities

1. Image picker for profile picture
2. Real-time notification updates
3. Offline cart sync
4. Advanced search filters
5. Review submission form
6. Push notifications (FCM)
