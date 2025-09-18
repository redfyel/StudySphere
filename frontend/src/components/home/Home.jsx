import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import bg from '../../assets/studysphere-bg.png';

const styles = {
  heroImg : {
    width: '100%',
    objectFit: 'cover',
    maxHeight: '100vh',
  }
}

function Home() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background */}
      <img
        src={bg}
        alt="Background"
        style={styles.heroImg}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg"
        >
          StudySphere
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="mt-6 max-w-2xl text-lg md:text-xl text-gray-200"
        >
          Your personalized hub for smarter learning, mood tracking, and study insights.
        </motion.p>

        <motion.a
          href="/dashboard"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition"
        >
          Explore <ArrowRight size={20} />
        </motion.a>
      </div>

      {/* Floating Gradient Orbs */}
      {/* <motion.div
        className="absolute w-72 h-72 bg-purple-500/30 rounded-full blur-3xl top-20 left-10 z-0"
        animate={{ y: [0, -30, 0], x: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 8 }}
      />
      <motion.div
        className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl bottom-20 right-10 z-0"
        animate={{ y: [0, 40, 0], x: [0, -40, 0] }}
        transition={{ repeat: Infinity, duration: 10 }}
      /> */}
    </section>
  );
}

export default Home;
