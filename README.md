# 🛒 Zee - Mobile 

ShopMate is a full-stack, cross-platform mobile e-commerce application designed to provide a seamless shopping experience for customers and a powerful, unified management interface for store administrators. 

Built with React Native (Expo) for the frontend and Node.js/Express with MongoDB for the backend, ShopMate handles everything from browsing products and managing carts to secure authentication and order tracking.

---

## ✨ Key Features

### For Customers
* **📱 Native Mobile Experience:** Fast, responsive UI built with React Native and Expo Router.
* **🛍️ Product Browsing & Cart:** Easily browse products, view high-quality images, and manage shopping carts.
* **🔒 Secure Authentication:** JWT-based user authentication including secure password resets via OTP (One-Time Password) sent to email.
* **📦 Order Tracking:** View order history and track the status of current orders in real-time.
* **⭐ Ratings & Reviews:** Customers can leave feedback and rate the products they have purchased.

### For Administrators
* **🎛️ Unified Admin Dashboard:** A dedicated, tab-based dashboard right inside the app.
* **📝 Product Management:** Add, edit, or delete product listings, including uploading images directly to Cloudinary.
* **🚚 Order Fulfillment:** View incoming orders and dynamically update their status (e.g., Pending, Processing, Shipped, Delivered).
* **💳 Payment Management:** Track payment statuses, issue refunds, and manage transaction records securely.

---

## 🛠️ Technology Stack

**Frontend (Mobile App):**
* [React Native](https://reactnative.dev/)
* [Expo](https://expo.dev/) (with Expo Router for file-based routing)
* React Context API (State Management)
* Axios (API Requests)

**Backend (RESTful API):**
* [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/) & Mongoose (Database & ORM)
* JSON Web Tokens (JWT) & bcryptjs (Security & Auth)
* [Cloudinary](https://cloudinary.com/) & Multer (Image storage and upload)
* Nodemailer (Email/OTP delivery)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v16 or higher)
* [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas URI)
* [Expo CLI](https://docs.expo.dev/get-started/installation/)
* A [Cloudinary](https://cloudinary.com/) account (for image hosting)

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/IT21101545/ZEE_mob.git
cd ShopMate
\`\`\`

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

**Environment Variables:**
Create a `.env` file in the `backend` folder and add the following keys:
\`\`\`env
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://hamdhanansar16_db_user:uw2odVqsDznx2AHe@cluster0.0pfpcne.mongodb.net/?appName=Cluster0

# Authentication
JWT_SECRET=hfkjsdhf89w3y4r98weyhfsjdhfksjdfh8w34yr78we


# Nodemailer (OTP / Emails)
EMAIL_USER=hamdhanansar16@gmail.com
EMAIL_PASS=wqslwyytpjjkrtlc

\`\`\`

**Run the Backend Server:**
\`\`\`bash
# Run in development mode (uses nodemon)
npm run dev
\`\`\`
*The server should now be running on `http://localhost:5000`*

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

**Run the Mobile App:**
\`\`\`bash
npx expo start
\`\`\`
* This will open the Expo Metro Bundler in your browser.
* You can scan the QR code with the **Expo Go** app on your iOS or Android device.
* Alternatively, press `a` to run on an Android Emulator or `i` for an iOS Simulator.

*(Note: Ensure that your frontend API calls are pointing to your local machine's IP address instead of `localhost` if you are testing on a physical mobile device).*

---

## 📂 Project Structure

\`\`\`text
ShopMate/
│
├── backend/                  # Node.js / Express Server
│   ├── config/               # Database and Cloudinary configurations
│   ├── controllers/          # Route logic (Auth, Products, Orders, etc.)
│   ├── middleware/           # JWT auth and file upload middleware
│   ├── models/               # Mongoose database schemas
│   ├── routes/               # Express API routes
│   ├── utils/                # Helper functions (e.g., sendEmail.js)
│   ├── server.js             # Backend entry point
│   └── package.json          
│
└── frontend/                 # React Native / Expo App
    ├── app/                  # Expo Router file-based screens
    │   ├── (auth)/           # Login, Register, Forgot Password
    │   ├── (tabs)/           # Main app tabs (Home, Cart, Profile, Admin)
    │   └── _layout.tsx       # Global app layout
    ├── components/           # Reusable UI components
    ├── context/              # Global state (AuthContext, ProductContext)
    ├── constants/            # Theme colors, config variables
    └── package.json          
\`\`\`

---

## 🌐 Main API Endpoints

### Authentication (`/api/auth`)
* `POST /register` - Register a new user
* `POST /login` - Authenticate user & get token
* `POST /forgot-password` - Request OTP for password reset
* `POST /reset-password` - Verify OTP and update password

### Products (`/api/products`)
* `GET /` - Get all products
* `POST /` - Create a new product (Admin only, handles image upload)
* `PUT /:id` - Update a product (Admin only)
* `DELETE /:id` - Delete a product (Admin only)

### Orders (`/api/orders`)
* `POST /` - Create a new order
* `GET /myorders` - Get orders for the logged-in user
* `GET /` - Get all orders (Admin only)
* `PUT /:id/status` - Update order status (Admin only)

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature
