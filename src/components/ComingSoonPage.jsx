function ComingSoonPage({ title, description, items = [] }) {
  return (
    <section className="card coming-soon-card">
      <div className="coming-soon-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <span className="coming-soon-badge">در حال توسعه</span>
      </div>

      {items.length > 0 && (
        <div className="coming-soon-list">
          {items.map((item) => (
            <div className="coming-soon-item" key={item}>
              <span>✓</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ComingSoonPage;