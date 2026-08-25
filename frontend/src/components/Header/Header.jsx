import "./Header.css";

function Header({ onMenuClick }) {
  return (
    <header className="dashboard-header">
      {/* Left side */}
      <div className="header-left">
        <button
          type="button"
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          title="Open navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="header-title">
          <span className="header-eyebrow">Portfolio Platform</span>

          <h1>Dashboard</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="header-right">
        <button
          type="button"
          className="header-icon-button"
          aria-label="Notifications"
          title="Notifications"
        >
          🔔
        </button>

        <div className="header-profile">
          <div className="header-avatar">JP</div>

          <div className="header-user">
            <span className="header-user-name">Jean Pierre</span>

            <span className="header-user-role">Portfolio Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
