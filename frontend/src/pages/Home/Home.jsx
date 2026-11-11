import Navbar from "../../components/home/Navbar";
import HeroSection from "../../components/home/HeroSection";
import AboutSection from "../../components/home/AboutSection";
import FeaturesSection from "../../components/home/FeaturesSection";
import HowItWorksSection from "../../components/home/HowItWorksSection";
import CallToAction from "../../components/home/CallToAction";
import Footer from "../../components/home/Footer";

import "./Home.css";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CallToAction />
      </main>

      <Footer />
    </>
  );
}

export default Home;