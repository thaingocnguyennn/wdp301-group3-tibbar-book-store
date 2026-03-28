# Quick Start Guide

## Prerequisites
- Node.js (v14+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator

## Setup Steps

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Backend URL
Edit `.env` file:
```
API_URL=http://your-backend-url:5000
```

For local development:
```
API_URL=http://localhost:5000
```

### 3. Start Development Server
```bash
npm start
```

This will:
- Start Expo development server
- Display QR code for mobile scanning
- Open interactive menu with platform options

## Running on Different Platforms

### iOS (Mac only)
```bash
npm run ios
# or
expo start --ios
```

### Android
```bash
npm run android
# or
expo start --android
```

### Web
```bash
npm run web
# or  
expo start --web
```

### Physical Device
1. Install Expo Go app from App Store/Play Store
2. Scan QR code from development server
3. App loads on your device

## Testing the App

### Test Account Credentials
Create test accounts through the register flow in the app.

### Key Features to Test
- [ ] User authentication (register/login/logout)
- [ ] Browse books and filter
- [ ] Add books to wishlist
- [ ] Add items to cart
- [ ] Complete checkout process
- [ ] View order history
- [ ] Edit profile and addresses
- [ ] Support chat functionality

## Common Commands

```bash
# Start development server
npm start

# Clear cache and restart
npm start -- --clear

# Eject from Expo (⚠️ irreversible)
npm run eject

# Install a new package
npm install package-name

# Check for updates
npm outdated
```

## Troubleshooting

### Port 8081 Already in Use
```bash
# Kill process on port 8081
# macOS/Linux:
lsof -ti:8081 | xargs kill -9

# Windows (PowerShell):
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues
1. Check `.env` API_URL is correct
2. Ensure backend is running
3. Clear app cache: Expo > Clear cache
4. Restart development server: `npm start -- --clear`

### Android Emulator Not Working
```bash
# Restart adb
adb kill-server
adb start-server

# Or use Android Studio to launch emulator
```

## Project Structure

```
mobile/
├── src/
│   ├── screens/       # Screen components
│   ├── services/      # API services
│   ├── navigation/    # Navigation setup
│   ├── context/       # Global state (Auth)
│   ├── components/    # Reusable components
│   ├── utils/         # Helper utilities
│   ├── constants/     # Constants
│   └── App.js        # Main component
├── App.js            # App entry point
├── app.json          # Expo configuration
├── package.json      # Dependencies
├── .env              # Environment variables
└── README.md         # Documentation
```

## Development Workflow

1. **Create a branch** for your feature
2. **Make changes** to screens/services
3. **Test locally** with your device/emulator
4. **Commit and push** to repository
5. **Create pull request** for review

## Performance Tips

- Use `FlatList` for large lists (not ScrollView)
- Optimize images before adding
- Test on actual device when possible
- Use Redux/Zustand if state gets complex

## Next Steps

1. **Update API URL** to your backend server
2. **Create test accounts** in the app
3. **Test core flows** (auth, browse, order)
4. **Add custom branding** (colors, fonts, logo)
5. **Optimize images** for mobile
6. **Test on both Android and iOS**

## Support

For issues or questions:
1. Check `.github/copilot-instructions.md`
2. Review README.md for feature details
3. Check backend API documentation
4. Review network requests in browser dev tools (Expo)

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Axios Docs](https://axios-http.com/docs/intro)

Happy coding! 🚀
