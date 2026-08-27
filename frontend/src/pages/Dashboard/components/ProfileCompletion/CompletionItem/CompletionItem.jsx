import "./CompletionItem.css";

function CompletionItem({ label, completed }) {
  return (
    <div className={`completion-item ${completed ? "completed" : ""}`}>
      <span className="completion-item-status" aria-hidden="true">
        {completed ? "✓" : "○"}
      </span>

      <span className="completion-item-label">{label}</span>
    </div>
  );
}

export default CompletionItem;
