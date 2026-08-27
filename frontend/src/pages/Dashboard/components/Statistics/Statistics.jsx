import StatisticCard from "./StatisticCard/StatisticCard";

import "./Statistics.css";

function Statistics({ statistics = [] }) {
  return (
    <section className="statistics" aria-label="Portfolio statistics">
      {statistics.map((statistic) => (
        <StatisticCard
          key={statistic.id}
          label={statistic.label}
          value={statistic.value}
          icon={statistic.icon}
        />
      ))}
    </section>
  );
}

export default Statistics;
