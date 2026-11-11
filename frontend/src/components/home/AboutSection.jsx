const informationItems = [
  {
    number: "01",
    title: "Paper Reports",
    description:
      "Important health information can be difficult to organize.",
  },
  {
    number: "02",
    title: "Prescriptions",
    description:
      "Medical information may be stored in different places.",
  },
  {
    number: "03",
    title: "Hospital Records",
    description:
      "Past health information may not be easily accessible.",
  },
  {
    number: "04",
    title: "Personal Memory",
    description:
      "Family medical history can be difficult to remember accurately.",
  },
];

function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="section-container">
        <div className="section-heading">
          <span className="section-label">ABOUT THE SYSTEM</span>

          <h2>Why Family Health Monitoring?</h2>

          <p>
            Important health information is often scattered across different
            places, making it difficult for families to keep track of their
            medical history.
          </p>
        </div>

        <div className="about-content">
          <div className="about-text">
            <p>
              Family health information may be stored in paper reports,
              prescriptions, hospital records, different files, or simply
              remembered by family members.
            </p>

            <p>
              The Family Health Monitoring System aims to bring basic family
              health information together in one centralized and organized
              platform.
            </p>
          </div>

          <div className="information-list">
            {informationItems.map((item) => (
              <div className="information-item" key={item.number}>
                <span aria-hidden="true">{item.number}</span>

                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;