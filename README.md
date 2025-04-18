# Medical Portal Application

A complete medical appointment booking system with patient, doctor, and admin interfaces.

## Features

- User authentication (JWT)
- Role-based access control (patient, doctor, admin)
- Appointment scheduling
- Calendar view for appointments
- Patient medical records
- Doctor availability management

## Setup Instructions

### Prerequisites

- Node.js and npm
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```
git clone <repository-url>
cd <repository-folder>
```

2. Install backend dependencies
```
cd backend
npm install
```

3. Install frontend dependencies
```
cd ..
npm install
```

4. Configure environment variables
   - Create a `.env` file in the backend directory based on the provided `.env` file
   - Update MongoDB URI, JWT secret, and email configuration as needed

### Seeding the Database

To populate the database with test data:

1. Create the `seeds` directory in the backend folder
```
mkdir -p backend/seeds
```

2. Run the seed script
```
cd backend
node seeds/seedData.js
```

This will create:
- 4 doctors with different specializations
- 4 patients with personal details
- 1 admin user
- 20 random appointments

### Test Users

After seeding, you can log in with these credentials:

**Admin**
- Email: admin@example.com
- Password: admin123

**Doctors**
- Email: john.smith@example.com (Cardiology)
- Email: sarah.johnson@example.com (Neurology)
- Email: michael.lee@example.com (Pediatrics)
- Email: emily.wilson@example.com (Dermatology)
- Password for all doctors: password123

**Patients**
- Email: alex@example.com
- Email: olivia@example.com
- Email: william@example.com
- Email: sophia@example.com
- Password for all patients: password123

### Running the Application

1. Start the backend server
```
cd backend
npm run dev
```

2. Start the frontend development server
```
cd ..
npm start
```

3. Open the application in your browser at `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/users/register` - Register a new user
- POST `/api/users/login` - Login and get JWT token

### Users
- GET `/api/users/me` - Get current user profile
- PUT `/api/users/me` - Update user profile
- GET `/api/users/doctors` - Get all doctors

### Appointments
- GET `/api/appointments/slots` - Get available time slots
- POST `/api/appointments/book` - Book an appointment
- PUT `/api/appointments/reschedule/:id` - Reschedule an appointment
- GET `/api/appointments` - Get user's appointments
- PUT `/api/appointments/cancel/:id` - Cancel an appointment

## Connecting Frontend to Backend

The frontend calendar component in `src/components/CalendarComponent.js` is currently using mock data. To connect it to the backend:

1. Update the time slot fetching logic in `CalendarComponent.js`:

```javascript
// Replace the mock data generation with:
useEffect(() => {
  const fetchTimeSlots = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/appointments/slots?date=${date.toISOString()}&doctorId=${doctorId}`);
      const data = await response.json();
      setTimeSlots(data.availableTimeSlots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchTimeSlots();
}, [date, doctorId]);
```

2. Implement authentication in your React components using the JWT token:
   - Store the token in localStorage after login
   - Include it in API requests with the Authorization header
   - Create a higher-order component or context for protected routes 