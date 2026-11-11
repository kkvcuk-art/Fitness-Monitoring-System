function Brand() {
  return (
    <a href="#home" className="brand" aria-label="Family Health home">
      <span className="brand-icon" aria-hidden="true">
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="34" height="34" rx="10" fill="currentColor" />

          <path
            d="M17 25.2C16.7 24.9 9.5 19.6 9.5 14.1C9.5 11.2 11.7 9.2 14.2 9.2C15.5 9.2 16.5 9.8 17 10.8C17.5 9.8 18.5 9.2 19.8 9.2C22.3 9.2 24.5 11.2 24.5 14.1C24.5 19.6 17.3 24.9 17 25.2Z"
            fill="white"
          />

          <path
            d="M17 12V19M13.5 15.5H20.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className="brand-text">
        <strong>Family Health</strong>
        <small>Monitoring System</small>
      </span>
    </a>
  );
}

export default Brand;