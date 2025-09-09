# Dairy Farm Dashboard

A comprehensive web application for managing dairy farm operations, including cattle management, milk production tracking, order processing, and financial analytics.

## Features

- **Dashboard**: Overview of farm metrics and key performance indicators
- **Cattle Management**: Track cattle information, breeds, and health records
- **Milk Production**: Monitor daily production and analyze trends
- **Order Management**: Process and track customer orders
- **Financial Analytics**: Revenue tracking and financial reporting
- **User Authentication**: Secure login and registration system
- **Admin Panel**: Administrative tools for user and system management

## Technology Stack

### Frontend
- React.js
- Chart.js for data visualization
- CSS3 for styling
- Context API for state management

### Backend
- Node.js
- Express.js
- SQLite database
- RESTful API architecture

## Installation

1. Clone the repository
```bash
git clone [repository-url]
cd dairy-farm-dashboard
```

2. Install dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. Environment Setup
```bash
# Copy environment example files
cp .env.example .env
cp backend/.env.example backend/.env
```

4. Database Setup
```bash
# The application uses SQLite database
# Database files will be created automatically when the backend starts
```

## Usage

1. Start the backend server
```bash
cd backend
npm start
```

2. Start the frontend development server
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
dairy-farm-dashboard/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/            # Custom hooks
│   ├── styles/           # CSS files
│   ├── config/           # Configuration files
│   └── data/             # Static data
├── backend/
│   ├── node_modules/     # Backend dependencies
│   ├── *.js              # Backend scripts and utilities
│   └── *.db              # SQLite database files
├── build/                # Production build
└── package.json          # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.