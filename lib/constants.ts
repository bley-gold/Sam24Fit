// Site configuration
export const SITE_CONFIG = {
  name: "Sam24Fit",
  description: "Premium Gym in Pretoria - Your fitness journey starts here",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://sam24fit.netlify.app",
  ogImage: "/og-image.jpg",
  links: {
    github: "https://github.com/yourusername/sam24fit-gym-site",
  },
}

// Gym information
export const GYM_INFO = {
  name: "Sam24Fit",
  tagline: "Pretoria Fitness",
  address: "438 De Kock St, Sunnyside, Pretoria, 0002",
  phone: "+27 67 993 4104",
  email: "info@sam24fit.com",
  hours: {
    weekdays: "5:30 AM - 8:00 PM",
    saturday: "6:30 AM - 6:00 PM",
    sunday: "Closed",
  },
  pricing: {
    monthly: 120,
    joiningFee: 50,
  },
}

// File upload constraints
export const UPLOAD_CONSTRAINTS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"],
}

// Demo accounts
export const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@sam24fit.com",
    password: "password",
  },
  user: {
    email: "demo@sam24fit.com",
    password: "password",
  },
}
