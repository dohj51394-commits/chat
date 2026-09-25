# Chat - Android APK & AAB Production Build Guide

This application is engineered for native Android deployment using either **Capacitor** or **Google Bubblewrap (Trusted Web Activity - TWA)**. Both produce release-ready `.apk` and `.aab` (Google Play Store) packages.

---

## Method 1: Build APK & AAB with Capacitor (Recommended)

### Step 1: Install Capacitor CLI
```bash
npm install -g @capacitor/cli @capacitor/core @capacitor/android
```

### Step 2: Build the Web Assets
```bash
npm run build
```

### Step 3: Initialize & Add Android Project
```bash
npx cap add android
npx cap copy
npx cap sync
```

### Step 4: Build Debug/Release APK & AAB
Open in Android Studio or build via Gradle command line:
```bash
cd android
# Build Debug APK
./gradlew assembleDebug
# The APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk

# Build Production Release APK
./gradlew assembleRelease
# The APK will be generated at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk

# Build Google Play AAB (Android App Bundle)
./gradlew bundleRelease
# The AAB will be generated at:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## Method 2: Build TWA APK/AAB with Bubblewrap CLI (Google Official)

```bash
# 1. Install bubblewrap
npm install -g @bubblewrap/cli

# 2. Initialize from PWA Manifest
bubblewrap init --manifest=https://your-domain.com/manifest.json

# 3. Build APK and Play Store AAB
bubblewrap build
```

---

## Supabase & FCM Configuration

1. **Supabase**: Run `supabase_schema.sql` in your Supabase SQL Editor. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` or in the app's Settings -> Supabase Config tab.
2. **Firebase Cloud Messaging (FCM)**: Place your `google-services.json` into `android/app/` and register the FCM token from the Notifications settings.
3. **Paystack Payments**: Enter your Paystack Public Key (`pk_live_...` or `pk_test_...`) in the Payment settings or `.env`.
