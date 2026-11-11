import Brand from "../common/Brand";

const footerLinks = [
  { label: "Home", destination: "#home" },
  { label: "About", destination: "#about" },
  { label: "Features", destination: "#features" },
  { label: "How It Works", destination: "#how-it-works" },
  { label: "Contact", destination: "#contact" },
];

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Brand />

          <p>Phase 1 MVP — Family Health Record Management</p>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          {footerLinks.map((link) => (
            <a href={link.destination} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} Family Health Monitoring System</p>
      </div>
    </footer>
  );
}

export default Footer;