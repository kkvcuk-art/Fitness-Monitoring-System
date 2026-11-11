import Brand from "../common/Brand";

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function isUserLoggedIn() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  return Boolean(
    token ||
      user?._id ||
      user?.id ||
      user?.userId ||
      user?.email
  );
}

function Navbar() {
  const loggedIn = isUserLoggedIn();

  const destination = loggedIn ? "/dashboard" : "/login";
  const buttonText = loggedIn ? "Open Dashboard" : "Get Started";

  return (
    <header className="header">
      <nav className="navbar" aria-label="Main navigation">
        <Brand />

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#contact">Contact</a>

          <a href={destination} className="nav-button">
            {buttonText}
          </a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;