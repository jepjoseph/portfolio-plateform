import "./StatisticCard.css";

function StatisticCard({ label, value, icon }) {
  return (
    <article className="statistic-card">
      <div className="statistic-icon">{icon}</div>

      <div className="statistic-content">
        <span className="statistic-label">{label}</span>

        <strong className="statistic-value">{value}</strong>
      </div>
    </article>
  );
}

export default StatisticCard;
