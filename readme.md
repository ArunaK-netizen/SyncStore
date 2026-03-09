# SyncStore

A point-of-sale and employee management application, providing a mobile app for staff and a web dashboard for administrators. The system handles scheduling, point-of-sale operations, inventory management, and performance tracking.

## Architecture

The project is split into two primary applications:

### Mobile Application (`/mobile`)
Built with React Native, Expo Router, and TypeScript. Acts as a POS terminal and digital companion for employees.
- **Cart & POS:** Item browsing, quantity adjustments, and dynamic tax calculation (e.g., category-specific rates).
- **Schedule Management:** Direct access to upcoming shifts and schedules.
- **Gamification:** Leaderboard to track sales metrics and encourage employee performance.
- **Communication:** Built-in announcements system with unread status synchronization.
- **Access Control:** Request-based sign-up system, requiring admin approval to access the mobile features. Supports a system-wide dark mode.

### Admin Dashboard (`/admin`)
Built with Next.js, TypeScript, and Tailwind CSS. Provides a high-level view and complete control over business operations.
- **Business Operations:** Manage product listings, categories, and inventory.
- **Employee Management:** Accept or reject user access requests, curate the application whitelist, and manage staff roles.
- **Analytics:** Data visualization for sales tracking, revenue trends, and key performance indicators.
- **System Announcements:** Broadcast messages directly to employees.

Both applications use Firebase for secure authentication and database persistence.

## Application Interfaces

### Mobile Experience
<p align="center">
  <img src="assets/home.png" width="30%" alt="Home Screen" />
  <img src="assets/checkout.png" width="30%" alt="Checkout" />
  <img src="assets/schedule.png" width="30%" alt="Schedule" />
</p>
<p align="center">
  <img src="assets/Leaderboard.png" width="30%" alt="Leaderboard" />
  <img src="assets/reports.png" width="30%" alt="Reports" />
  <img src="assets/profile.png" width="30%" alt="Profile" />
</p>

### Admin Dashboard
<p align="center">
  <img src="assets/admin_overview.png" width="80%" alt="Admin Overview" />
</p>
<p align="center">
  <img src="assets/admin_products.png" width="45%" alt="Product Inventory" />
  <img src="assets/admin_analytics.png" width="45%" alt="Analytics" />
</p>

## Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   ```

2. **Run the Mobile App:**
   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. **Run the Admin Dashboard:**
   ```bash
   cd admin
   npm install
   npm run dev
   ```

## Environment Setup

Because this project uses Firebase, you must create configuration files that are purposefully kept out of version control.

1. **For the Mobile App (`/mobile`)**:
   - Download your specific `google-services.json` (for Android) from your Firebase console.
   - Place `google-services.json` inside the root of the `/mobile` directory.

2. **For the Admin Dashboard (`/admin`)**:
   - Copy the provided example environment template: 
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and populate it with your Firebase Web configuration details.
   - If utilizing server-side Firebase Admin SDK code, you may also need to insert your `serviceAccountKey.json` from the Firebase console into the root of the `/admin` directory.
