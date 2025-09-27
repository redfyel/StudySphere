import './Home.css';
const Home = () => {
  return (
    <main className="student-platform-body">
      {/* Parallax Background Element */}
      <div className="parallax-bg" id="parallax-target"></div>

      <div className="container content-overlay">

        {/* Top Mission Statement & Core Value Prop */}
        <section className="mission-statement">
          <p className="overline">Welcome to StudySphere</p>
          <h1>The Unified Platform Designed for <strong>Student Success and Balance</strong>.</h1>
          <p className="tagline">Stop managing five apps. Start mastering your courses. StudySphere brings together focus, knowledge, and community so you can improve performance without the burnout.</p>
        </section>

        {/* Key Sections & Use Cases (T-Shape Content Split) */}
        <div className="main-content-split">

          {/* Left Column: Core Advantages & Philosophy (60%) */}
          <section className="advantages-section">
            <h2 className="section-title">The StudySphere Advantage: Structured Success</h2>

            <div className="advantage-list">
              
              {/* Advantage 1: Focus */}
              <div className="advantage-card card">
                <i className="ri-shield-check-line icon-xl"></i>
                <div className="advantage-info">
                  <h3>Burnout-Proof Consistency</h3>
                  <p>Our integrated <strong>Wellness Tracker</strong> and <strong>Focus Timers</strong> ensure you build sustainable study habits, not just all-nighters. Performance improves when balance is maintained.</p>
                </div>
              </div>

              {/* Advantage 2: Knowledge */}
              <div className="advantage-card card">
                <i className="ri-stack-line icon-xl"></i>
                <div className="advantage-info">
                  <h3>Unified Knowledge Base</h3>
                  <p>Seamlessly link your <strong>Notes, Tasks, and Flashcards</strong>. Turn lecture notes into practice sets instantly, eliminating tedious data transfer and staying in flow.</p>
                </div>
              </div>

              {/* Advantage 3: Collaboration */}
              <div className="advantage-card card">
                <i className="ri-group-line icon-xl"></i>
                <div className="advantage-info">
                  <h3>Empowered Peer Collaboration</h3>
                  <p>Find <strong>Accountability Partners</strong> and structured <strong>Study Groups</strong> directly within the platform. Share notes, track joint goals, and motivate each other.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Key Features & Entry Points (40%) */}
          <aside className="use-cases-section card">
            <h2 className="section-title-alt">Access Key Tools</h2>
            
            <div className="feature-link-list">
              
              <div className="feature-link">
                <i className="ri-file-text-line"></i>
                <h4>Smart Notes Interface</h4>
                <p>Capture, organize, and color-code your lecture content quickly.</p>
                <button className="minimal-button">Start a New Note <i className="ri-arrow-right-line"></i></button>
              </div>
              
              <div className="feature-link">
                <i className="ri-loop-right-line"></i>
                <h4>Interactive Flashcard Engine</h4>
                <p>Use spaced repetition to commit essential terms to long-term memory.</p>
                <button className="minimal-button">Review Your Toughest Set <i className="ri-arrow-right-line"></i></button>
              </div>

              <div className="feature-link">
                <i className="ri-heart-2-line"></i>
                <h4>Daily Wellness Check</h4>
                <p>Track your mood, set focus timers, and schedule mindful breaks.</p>
                <button className="minimal-button">Set Today's Focus Goal <i className="ri-arrow-right-line"></i></button>
              </div>
            </div>
            
            <button className="primary-button-full cta-bottom">Join a Study Community</button>
          </aside>
        </div>

      </div>
    </main>
  );
};

export default Home;