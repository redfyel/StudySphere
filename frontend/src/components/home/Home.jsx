import './Home.css';

const Home = () => {
  return (
    <main className="student-platform-body">

      {/* Parallax Background */}
      <div className="parallax-bg"></div>

      <div className="container content-overlay">

        {/* Top Hero Section */}
        <section className="hero-section">
          <p className="hero-overline">Welcome to StudySphere</p>
          <h1 className="hero-title">
            A Unified Platform for <span>Student Success & Balance</span>
          </h1>
          <p className="hero-subtext">
            Stop juggling multiple apps. StudySphere brings focus, organization, and collaboration
            together—boosting performance without burnout.
          </p>
        </section>

        {/* Main Content Split */}
        <div className="layout-grid">

          {/* Left — Advantages */}
          <section className="advantages">

            <h2 className="section-title">Why Choose StudySphere?</h2>

            <div className="advantage-list">

              <div className="advantage-card">
                <i className="ri-shield-check-line icon-xl"></i>
                <div>
                  <h3>Burnout-Free Productivity</h3>
                  <p>
                    Build consistent habits using our <strong>Wellness Tracker</strong> and
                    <strong> Focus Timers</strong>. Study smarter with balance.
                  </p>
                </div>
              </div>

              <div className="advantage-card">
                <i className="ri-stack-line icon-xl"></i>
                <div>
                  <h3>All-In-One Learning Hub</h3>
                  <p>
                    Convert <strong>Notes → Tasks → Flashcards</strong> instantly.
                    Stay in flow without switching apps.
                  </p>
                </div>
              </div>

              <div className="advantage-card">
                <i className="ri-group-line icon-xl"></i>
                <div>
                  <h3>Smart Peer Collaboration</h3>
                  <p>
                    Connect with <strong>Study Groups</strong>, share notes, and set goal-driven routines together.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Right — Features */}
          <aside className="features card">

            <h2 className="section-title-alt">Explore Key Tools</h2>

            <div className="feature-list">

              <div className="feature">
                <i className="ri-file-text-line"></i>
                <h4>Smart Notes Editor</h4>
                <p>Capture, organize, and structure your content beautifully.</p>
                <button className="text-button">
                  Start a New Note <i className="ri-arrow-right-line"></i>
                </button>
              </div>

              <div className="feature">
                <i className="ri-loop-right-line"></i>
                <h4>Flashcard Practice</h4>
                <p>Master concepts using spaced repetition.</p>
                <button className="text-button">
                  Review Flashcards <i className="ri-arrow-right-line"></i>
                </button>
              </div>

              <div className="feature">
                <i className="ri-heart-2-line"></i>
                <h4>Wellness Check</h4>
                <p>Track your mood and plan balanced study sessions.</p>
                <button className="text-button">
                  Set Today's Goal <i className="ri-arrow-right-line"></i>
                </button>
              </div>

            </div>

            <button className="primary-button full-width">
              Join a Study Community
            </button>

          </aside>

        </div>

      </div>
    </main>
  );
};

export default Home;
