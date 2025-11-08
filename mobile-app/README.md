# Salon360 Mobile App

React Native mobile application for Salon360 SaaS platform built with Expo, TypeScript, and NativeWind.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure environment:**
   Create a `.env` file in the `mobile-app` directory:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## 📱 App Structure

### Navigation
- **Auth Navigator**: Login and Signup screens
- **Owner Navigator**: Dashboard, Appointments, Clients, Services, Staff, Inventory, Analytics
- **Staff Navigator**: Dashboard, Schedule, Performance
- **Customer Navigator**: Dashboard, Bookings, History, Profile

### Key Features
- ✅ TypeScript with strict types
- ✅ NativeWind for styling (Tailwind CSS)
- ✅ Role-based navigation
- ✅ API integration with backend
- ✅ Authentication and token management
- ✅ Beautiful UI with consistent color scheme

## 🎨 Design System

### Colors
- **Primary**: Purple (#8b5cf6) - Main brand color
- **Secondary**: Red (#ef4444) - Alerts, errors
- **Accent**: Green (#22c55e) - Success, completed
- **Neutral**: Gray scale for text and backgrounds

### Components
- `Card`: Reusable card component
- `StatCard`: Statistics display card
- More components in `src/components/`

## 📂 Project Structure

```
mobile-app/
├── src/
│   ├── components/      # Reusable UI components
│   ├── navigation/      # Navigation configurations
│   ├── screens/         # Screen components
│   │   ├── auth/        # Authentication screens
│   │   ├── owner/       # Owner/Admin screens
│   │   ├── staff/       # Staff screens
│   │   └── customer/    # Customer screens
│   ├── services/        # API and auth services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
├── App.tsx              # Main app component
└── package.json
```

## 🔧 Development

### Type Checking
```bash
npm run type-check
```

### Building
```bash
# For production build
expo build:android
expo build:ios
```

## 📝 Notes

- The app automatically detects user role and shows appropriate navigation
- All API calls include authentication tokens automatically
- Token is stored securely using AsyncStorage
- App refreshes user data on startup if token exists

