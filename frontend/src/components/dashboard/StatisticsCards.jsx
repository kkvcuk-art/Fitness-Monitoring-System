const statistics = [
  {
    key: "members",
    label: "Family Members",
    description: "Registered profiles",
    type: "members",
  },
  {
    key: "reports",
    label: "Medical Reports",
    description: "Health records stored",
    type: "reports",
  },
  {
    key: "vaccinations",
    label: "Vaccinations",
    description: "Vaccination records",
    type: "vaccinations",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    description: "Scheduled vaccinations",
    type: "upcoming",
  },
];

function StatisticIcon({ type }) {
  const props = {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "members") {
    return (
      <svg {...props}>
        <circle cx="9" cy="8" r="4" />
        <path d="M2.5 21C2.5 17.5 5.4 15 9 15C12.6 15 15.5 17.5 15.5 21" />
        <path d="M16 5C18.2 5.6 19.4 7.8 18.8 10C18.5 11.1 17.7 12 16.7 12.5" />
        <path d="M17 15.5C19.7 16 21.3 18 21.5 20.5" />
      </svg>
    );
  }

  if (type === "reports") {
    return (
      <svg {...props}>
        <path d="M6 3H16L20 7V21H6V3Z" />
        <path d="M16 3V8H20" />
        <path d="M9 12H17M9 16H17" />
      </svg>
    );
  }

  if (type === "vaccinations") {
    return (
      <svg {...props}>
        <path d="M14.5 4.5L19.5 9.5M12.5 6.5L17.5 11.5" />
        <path d="M5 19L15.5 8.5M4 15L9 20M3 21L6 18" />
        <path d="M17 3L21 7" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7V12L15 14" />
    </svg>
  );
}

function StatisticsCards({
  values = {},
  loading = false,
}) {
  return (
    <section
      className="statistics-grid"
      aria-label="Health statistics"
    >
      {statistics.map((item) => (
        <article
          className={`statistic-card statistic-${item.type}`}
          key={item.key}
        >
          <div className="statistic-card-top">
            <span className="statistic-icon">
              <StatisticIcon type={item.type} />
            </span>

            <span className="statistic-status">
              Live
            </span>
          </div>

          <strong className="statistic-value">
            {loading
              ? "—"
              : values[item.key] ?? 0}
          </strong>

          <h3>{item.label}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}

export default StatisticsCards;