// StudyTargets Component
function StudyTargets({ targets, onTargetsChange }) {
  const [newTarget, setNewTarget] = useState('');

  const addTarget = () => {
    if (newTarget.trim()) {
      onTargetsChange([...targets, newTarget.trim()]);
      setNewTarget('');
    }
  };

  const removeTarget = (index) => {
    const updatedTargets = [...targets];
    updatedTargets.splice(index, 1);
    onTargetsChange(updatedTargets);
  };

  return (
    <>
      <style>{`
        .study-targets {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #E5E1DA;
        }
        
        .study-targets h3 {
          color: #89A8B2;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .study-targets h3::before {
          content: "🎯";
          font-size: 1.2rem;
        }
        
        .target-input {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .target-input input {
          flex: 1;
          padding: 0.75rem;
          border: 2px solid #E5E1DA;
          border-radius: 10px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background-color: #F1F0E8;
        }
        
        .target-input input:focus {
          outline: none;
          border-color: #89A8B2;
          background-color: white;
          box-shadow: 0 0 0 3px rgba(137, 168, 178, 0.1);
        }
        
        .target-input button {
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #89A8B2 0%, #B3C8CF 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .target-input button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(137, 168, 178, 0.3);
        }
        
        .target-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .target-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #F1F0E8 0%, #E5E1DA 100%);
          border-radius: 10px;
          transition: all 0.3s ease;
          border-left: 4px solid #B3C8CF;
        }
        
        .target-list li:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(137, 168, 178, 0.15);
        }
        
        .target-list li:last-child {
          margin-bottom: 0;
        }
        
        .target-list button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .target-list button:hover {
          background: #dc2626;
          transform: scale(1.05);
        }
      `}</style>
      
      <div className="study-targets">
        <h3>Study Targets</h3>
        <div className="target-input">
          <input
            type="text"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="Add a new study target"
          />
          <button onClick={addTarget}>Add</button>
        </div>
        <ul className="target-list">
          {targets.map((target, index) => (
            <li key={index}>
              <span>{target}</span>
              <button onClick={() => removeTarget(index)}>Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}