export default function AdminLoading() {
  return (
    <div className="admin-page" aria-live="polite" aria-busy="true">
      <section className="admin-page-head">
        <div>
          <p className="admin-kicker">Loading</p>
          <div className="admin-skeleton admin-skeleton--title" />
          <div className="admin-skeleton admin-skeleton--copy" />
        </div>
      </section>
      <section className="admin-skeleton-grid">
        <div className="admin-skeleton-card" />
        <div className="admin-skeleton-card" />
        <div className="admin-skeleton-card" />
        <div className="admin-skeleton-card" />
      </section>
    </div>
  );
}
