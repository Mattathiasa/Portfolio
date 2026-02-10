# Mattathias Abraham - Portfolio

A modern, interactive portfolio website showcasing my work as a Software Engineer and Football Content Creator.

![Portfolio Preview](https://img.shields.io/badge/React-18.3.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue) ![Vite](https://img.shields.io/badge/Vite-5.4.19-purple)

## 🚀 Live Demo

Visit my portfolio: **[mattathiasportfolio.vercel.app](https://mattathiasportfolio.vercel.app/)**

## 👨‍💻 About Me

I'm a recent Software Engineering graduate from Addis Ababa, passionate about building innovative applications and creating engaging football content. This portfolio showcases my technical skills, projects, and creative work.

## ✨ Features

- **Modern Design**: Clean, professional interface with smooth animations
- **Fully Responsive**: Optimized for all devices - mobile, tablet, and desktop
- **Interactive Sections**:
  - Hero section with animated background
  - About me with stats and highlights
  - Skills showcase with progress bars
  - Featured projects gallery
  - Blog/insights section
  - Contact form with EmailJS integration
  - Football skills video showcase
- **Smooth Scrolling**: Enhanced navigation experience
- **Dark Theme**: Eye-friendly design
- **Performance Optimized**: Fast loading with Vite

## 🛠️ Technologies Used

- **Frontend Framework**: React 18.3
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **Form Handling**: React Hook Form, Zod
- **Email Service**: EmailJS
- **Icons**: Lucide React, Font Awesome

## 📦 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/Mattathiasa/Portfolio.git

# Navigate to project directory
cd Portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📧 Contact Form Setup

To enable the contact form, you need to set up EmailJS:

1. Create an account at [EmailJS](https://www.emailjs.com/)
2. Create an email service and template
3. Create a `.env` file in the root directory:

```env
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

## 🚀 Deployment

This project can be easily deployed to:

- **Vercel** (Recommended): Connect your GitHub repo and deploy automatically
- **Netlify**: Import project and deploy with one click
- **GitHub Pages**: Use `gh-pages` for static hosting

## 📂 Project Structure

```>
Portfolio/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   ├── assets/         # Images and media
│   └── main.tsx        # Application entry point
├── .env                # Environment variables
└── package.json        # Dependencies
```

## 🎨 Customization

Feel free to fork this project and customize it for your own portfolio:

1. Update personal information in components
2. Replace project images in `src/assets/`
3. Modify color scheme in `tailwind.config.ts`
4. Add your own projects and blog posts
5. Update social media links

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Connect With Me

- **GitHub**: [@Mattathiasa](https://github.com/Mattathiasa)
- **LinkedIn**: [Your LinkedIn](https://linkedin.com)
- **Instagram**: [@mattathiasa](https://www.instagram.com/mattathiasa/)
- **Email**: mattathiasabraham@gmail.com

---

⭐ If you like this portfolio, give it a star!

Built with ❤️ by Mattathias Abraham
