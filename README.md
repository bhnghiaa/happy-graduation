# NITCNE Memory Gallery Application

This is a web application for the NITCNE community to share and display memories through images.

## Features

- Interactive 3D environment built with Three.js
- Image upload functionality using Cloudinary
- Backend server for image management
- Responsive design for mobile and desktop

## Installation

1. Install Node.js if you haven't already (https://nodejs.org/)
2. Clone or download this repository
3. Navigate to the project directory in your terminal
4. Install dependencies:

```
npm install
```

## Running the Application

1. Start the server:

```
npm start
```

2. Open your browser and navigate to http://localhost:3000

For development with auto-reload:

```
npm run dev
```

## Configuring Cloudinary

To use the image upload feature, you need to configure Cloudinary:

1. Create a Cloudinary account at https://cloudinary.com/
2. Create an upload preset in your Cloudinary dashboard
3. Update the `cloudinaryConfig` object in `js/index.js` with your Cloudinary credentials

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Three.js
- Backend: Node.js, Express
- Image Storage: Cloudinary

## License

This project is for the NITCNE community.
