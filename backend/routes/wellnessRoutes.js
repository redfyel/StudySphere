const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Assuming your auth middleware is here
const WellnessLog = require('../models/WellnessLog');

// @route   POST api/wellness/log
// @desc    Create a new wellness log (for a mood or study vibe)
// @access  Private
router.post('/log', auth, async (req, res) => {
    console.log('--- Received POST to /api/wellness/log ---');
  console.log('✅ 1. Request Body (req.body):', req.body);
  console.log('✅ 2. User from auth middleware (req.user):', req.user); 
  const { type, value, notes } = req.body;

  try {
     if (!req.user || !req.user.id) {
        console.error('❌ CRITICAL: req.user.id is missing! Auth middleware might have failed.');
        return res.status(401).json({ msg: 'Authorization denied, user ID missing.' });
    }
    const newLog = new WellnessLog({
      user: req.user.id, // The user ID comes from your 'auth' middleware
      type,
      value,
      notes,
    });
  console.log(' Mongoose model created, attempting to save...');
    const log = await newLog.save();
    console.log('✅ SUCCESS: Data saved to MongoDB!', log);
    // const log = await newLog.save();
    res.status(201).json(log); // 201 = Created
  } catch (err) {
        console.error('❌ ERROR in /log route:', err.message);

    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// ✅ UPDATED: This route now accepts specific start and end dates.
// @route   GET api/wellness/logs
// @desc    Get wellness logs for the logged-in user within a date range
// @access  Private
router.get('/logs', auth, async (req, res) => {
  try {
    // The frontend will now send `startDate` and `endDate` as ISO strings
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'Please provide a start and end date.' });
    }

    const logs = await WellnessLog.find({
      user: req.user.id,
      // Find all logs created on or after the start date AND before the end date.
      createdAt: {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      },
    }).sort({ createdAt: 'asc' });

    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route   POST api/wellness/insights
// @desc    Generate personalized wellness insights from a set of logs
// @access  Private
router.post('/insights', auth, (req, res) => {
    const logs = req.body.logs;

    if (!logs || logs.length < 5) { // Increased the threshold for more meaningful analysis
        return res.json({
            headline: "Keep Logging to Unlock Insights",
            insight: "The more you log your moods and study vibes, the more personalized and accurate your insights will be. Aim for at least a week of consistent logging to get started!"
        });
    }

    // --- Advanced Insight Generation ---
    const insights = generateAllInsights(logs);

    // For simplicity, we'll return the most relevant one, but you could return multiple
    const primaryInsight = insights[0] || {
        headline: "Consistency is Key!",
        insight: "You're doing a great job logging your wellness. Keep it up to discover deeper patterns about what influences your mood and productivity."
    };

    res.json(primaryInsight);
});


// --- NEW: Insight Generation Logic ---

function generateAllInsights(logs) {
    const insights = [];

    // Helper to get logs from the last N days
    const getLogsFromLastDays = (days) => {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);
        return logs.filter(log => new Date(log.createdAt) > dateLimit);
    };

    const recentLogs = getLogsFromLastDays(7);

    if (recentLogs.length < 3) return insights; // Not enough recent data

    const moodLogs = recentLogs.filter(l => l.type === 'mood');
    const vibeLogs = recentLogs.filter(l => l.type === 'vibe');

    // Insight 1: Mood-Productivity Correlation
    const happyMoods = ['Happy', 'Awesome', 'Balanced'];
    const productiveVibes = ['focused', 'accomplished', 'energized'];

    const daysWithGoodMood = new Set(moodLogs.filter(l => happyMoods.includes(l.value)).map(l => new Date(l.createdAt).toDateString()));
    const daysWithProductiveVibes = new Set(vibeLogs.filter(l => productiveVibes.includes(l.value.vibe)).map(l => new Date(l.createdAt).toDateString()));

    const commonProductiveDays = [...daysWithGoodMood].filter(d => daysWithProductiveVibes.has(d));

    if (commonProductiveDays.length >= 2 && daysWithGoodMood.size > 0) {
        const correlationPercentage = Math.round((commonProductiveDays.length / daysWithGoodMood.size) * 100);
        if (correlationPercentage > 60) {
            insights.push({
                headline: "Positive Mood, Productive Mind",
                insight: `It looks like you have your most productive study sessions on days when you're feeling good. On ${correlationPercentage}% of your positive mood days this week, you also logged a productive vibe. Keep focusing on activities that boost your mood!`
            });
        }
    }

    // Insight 2: Burnout Warning
    const burnoutVibes = ['overwhelmed', 'burntout'];
    const stressfulMoods = ['Stressed', 'Down'];
    const burnoutDays = vibeLogs.filter(l => burnoutVibes.includes(l.value.vibe)).length;
    const stressDays = moodLogs.filter(l => stressfulMoods.includes(l.value)).length;

    if (burnoutDays >= 2 && stressDays >= 2) {
        insights.push({
            headline: "Watch for Burnout",
            insight: "You've logged feelings of stress and burnout several times this week. Remember to take regular breaks and prioritize rest to maintain a healthy balance. Your well-being is just as important as your study goals."
        });
    }
    
    // Insight 3: Trend analysis
    if (moodLogs.length > 4) {
        const firstHalfMoods = moodLogs.slice(0, Math.floor(moodLogs.length / 2));
        const secondHalfMoods = moodLogs.slice(Math.floor(moodLogs.length / 2));
        const moodRank = { Stressed: 1, Down: 2, Neutral: 3, Balanced: 4, Happy: 5, Awesome: 6 };

        const avgFirstHalf = firstHalfMoods.reduce((acc, log) => acc + moodRank[log.value], 0) / firstHalfMoods.length;
        const avgSecondHalf = secondHalfMoods.reduce((acc, log) => acc + moodRank[log.value], 0) / secondHalfMoods.length;

        if (avgSecondHalf > avgFirstHalf + 0.5) {
             insights.push({
                headline: "Your Mood is Trending Up!",
                insight: "Great news! Your average mood seems to be improving this week. Whatever you're doing, it's working. Reflect on what's been going well lately."
            });
        }
    }


    // Add more insight rules here...

    return insights;
}
module.exports = router;