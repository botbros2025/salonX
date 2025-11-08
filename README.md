# Salon360 SaaS - Complete Salon Management System

A comprehensive multi-tenant SaaS platform for salon management with WhatsApp integration, inventory tracking, analytics, and more.

## 🏗️ Tech Stack

- **Frontend**: React Native/Expo with NativeWind CSS (Mobile App)
- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL with Prisma ORM
- **Integrations**: WhatsApp Business API (Twilio), Email/SMS Gateway
- **Hosting**: AWS / GCP / Vercel / Render ready

## 📁 Project Structure

```
SalonX/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes (TypeScript)
│   │   ├── middleware/      # Auth, error handling
│   │   ├── services/        # WhatsApp, notifications
│   │   ├── utils/           # JWT, password hashing
│   │   ├── types/           # TypeScript type definitions
│   │   └── server.ts        # Main server file
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── mobile-app/              # React Native/Expo app (to be created)
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database URL and API keys:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/salon360"
   JWT_SECRET="your-secret-key"
   WHATSAPP_ACCOUNT_SID="your-twilio-sid"
   WHATSAPP_AUTH_TOKEN="your-twilio-token"
   WHATSAPP_PHONE_NUMBER="whatsapp:+1234567890"
   ```

3. **Set up database:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3000`

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - Salon owner signup
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Tenants
- `GET /api/tenants` - Get tenant details
- `PUT /api/tenants` - Update tenant
- `POST /api/tenants/subscription` - Manage subscription

#### Branches
- `GET /api/branches` - List all branches
- `POST /api/branches` - Create branch
- `GET /api/branches/:id` - Get branch details
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

#### Staff
- `GET /api/staff` - List all staff
- `POST /api/staff` - Create staff member
- `GET /api/staff/:id` - Get staff details
- `PUT /api/staff/:id` - Update staff
- `GET /api/staff/leaderboard` - Staff performance leaderboard

#### Clients
- `GET /api/clients` - List clients (with pagination)
- `POST /api/clients` - Create/find client
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client

#### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create service
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `GET /api/services/analytics/popularity` - Service popularity analytics

#### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment details
- `PATCH /api/appointments/:id/status` - Update appointment status
- `PATCH /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments/availability/slots` - Get available time slots

#### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/inventory/:id` - Get item details
- `PUT /api/inventory/:id` - Update item
- `GET /api/inventory/alerts/low-stock` - Get low stock alerts
- `POST /api/inventory/purchase-order` - Generate purchase order

#### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `PATCH /api/invoices/:id/payment` - Update payment status

#### Feedback
- `GET /api/feedback` - List feedback
- `POST /api/feedback` - Create feedback
- `GET /api/feedback/:id` - Get feedback details
- `PUT /api/feedback/:id` - Update feedback

#### Analytics
- `GET /api/analytics/sales` - Sales overview
- `GET /api/analytics/staff/leaderboard` - Staff leaderboard
- `GET /api/analytics/services/popularity` - Service popularity
- `GET /api/analytics/customers` - Customer insights
- `GET /api/analytics/inventory` - Inventory insights

#### WhatsApp
- `POST /api/whatsapp/webhook` - Webhook for incoming messages
- `POST /api/whatsapp/send` - Send test message

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## 📊 Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **Tenant** - Multi-tenant isolation
- **Branch** - Salon branches
- **User** - System users (owner, admin, receptionist, staff)
- **Staff** - Staff details and performance
- **Client** - Customer CRM
- **Service** - Service catalog
- **Appointment** - Booking management
- **InventoryItem** - Stock management
- **Invoice** - Billing and payments
- **Feedback** - Customer ratings

## 🔔 Automation & Notifications

The system includes automated notifications via WhatsApp:

- **Appointment Reminders**: Sent 1 hour before appointment
- **Low Stock Alerts**: When inventory falls below threshold
- **Birthday Messages**: Automated birthday wishes with offers
- **Daily Sales Summary**: End-of-day reports to owners

Cron jobs are automatically set up when the server starts.

## 🧪 Development

### TypeScript

The entire backend is written in TypeScript with strict type checking:

```bash
npm run type-check  # Check types without building
npm run build       # Build for production
```

### Database Migrations

```bash
npm run prisma:migrate    # Create migration
npm run prisma:studio     # Open Prisma Studio (GUI)
```

## 📱 Mobile App (Coming Soon)

The mobile app will be built with:
- React Native / Expo
- NativeWind CSS for styling
- Separate apps for:
  - **Customer App**: Booking, history, feedback
  - **Staff App**: Schedule, attendance, performance
  - **Owner App**: Dashboard, analytics, alerts

## 🚢 Deployment

### Environment Variables

Ensure all required environment variables are set in production:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `WHATSAPP_ACCOUNT_SID` - Twilio account SID
- `WHATSAPP_AUTH_TOKEN` - Twilio auth token
- `WHATSAPP_PHONE_NUMBER` - WhatsApp-enabled phone number
- `NODE_ENV` - Set to `production`

### Build for Production

```bash
npm run build
npm start
```

## 📝 License

ISC

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

