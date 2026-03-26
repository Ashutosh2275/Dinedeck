import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LiveDemo from './components/LiveDemo';
import WhereWeOperate from './components/WhereWeOperate';
import FeaturesGrid from './components/FeaturesGrid';
import FeatureDeepDive from './components/FeatureDeepDive';
import HowItWorks from './components/HowItWorks';
import DashboardPreview from './components/DashboardPreview';
import Pricing from './components/Pricing';
import FinalCTA from './components/FinalCTA';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer';
import CustomCursor from './components/ui/CustomCursor';
import ScrollProgress from './components/ui/ScrollProgress';
import { useSmoothScroll } from './hooks/useSmoothScroll';

export default function App() {
  useSmoothScroll();

  return (
    <div className="relative min-h-screen bg-white font-['Plus_Jakarta_Sans'] selection:bg-indigo-100 selection:text-indigo-900">
      <CustomCursor />
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <LiveDemo />
        <WhereWeOperate />
        <FeaturesGrid />
        <FeatureDeepDive />
        <HowItWorks />
        <DashboardPreview />
        <Pricing />
        <FinalCTA />
        <ContactUs />
      </main>
      <Footer />
    </div>
  );
}
