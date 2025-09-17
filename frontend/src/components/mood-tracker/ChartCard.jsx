
const ChartCard = ({ title, chartComponent, insight, children, styles, gridColumn }) => {
  return (
    <div style={{ ...styles.chartContainer, gridColumn: gridColumn || 'span 1' }}>
      <h2 style={styles.cardTitle}>{title}</h2>
      <div style={styles.chartPlaceholder}>
        {chartComponent}
      </div>
      {insight && (
        <div style={styles.insightBox}>
          {insight}
        </div>
      )}
      {children}
    </div>
  );
};

export default ChartCard;