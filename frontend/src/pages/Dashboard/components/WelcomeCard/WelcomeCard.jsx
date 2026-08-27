import "./WelcomeCard.css";

function WelcomeCard({ firstName, initials }) {
  return (
    <section className="welcome-card">
      <div className="welcome-card-content">
        <span className="welcome-eyebrow">Welcome back</span>

        <h2>Good to see you, {firstName}.</h2>

        <p>
          Manage your professional profile, projects, experience, and portfolio
          from one place.
        </p>
      </div>

      <div className="welcome-avatar">{initials}</div>
    </section>
  );
}

export default WelcomeCard;
