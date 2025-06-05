import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../apis/api";
import LaptopImage from "../assets/laptopandphone.png";
import PollCard from "../layouts/PollCard";
import VoteDemo from "./demo/VoteDemo";
import { FaVoteYea, FaChartLine, FaShieldAlt, FaMobileAlt } from "react-icons/fa";
import PropTypes from "prop-types";

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div 
    className="p-6 bg-white rounded-xl shadow-soft-xl hover:shadow-soft-2xl transition-shadow"
    whileHover={{ y: -5 }}
  >
    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-secondary-600" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

FeatureCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

const Homepage = () => {
  const [upcomingPolls, setUpcomingPolls] = useState([]);
  const [pastPolls, setPastPolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [authTokens, setAuthTokens] = useState(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch the first three upcoming/ongoing polls and past polls
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axiosInstance.get("polls/list/");

        const currentDateTime = new Date();
        // Filter for active polls only
        const activePolls = response.data.filter(poll => poll.active);
        
        const filteredUpcomingPolls = activePolls
          .filter((poll) => {
            const endTime = new Date(poll.end_time).getTime();
            return currentDateTime <= endTime;
          })
          .slice(0, 3);

        const filteredPastPolls = activePolls
          .filter((poll) => new Date(poll.start_time) <= currentDateTime)
          .slice(0, 10);

        setUpcomingPolls(filteredUpcomingPolls);
        setPastPolls(filteredPastPolls);
        setFilteredPolls(activePolls); 
      } catch (error) {
        console.error("Error fetching polls:", error);
      }
    };

    fetchPolls();
  }, []);

  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchTerm(searchValue);

    const combinedPolls = [...upcomingPolls, ...pastPolls];
    const searchResults = combinedPolls.filter((poll) =>
      poll.title.toLowerCase().includes(searchValue)
    );

    setFilteredPolls(searchResults);
  };

  // Add a section for creators
  const renderCreatorSection = () => {
    if (!authTokens) {
      return (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Want to Create Your Own Poll?</h2>
            <p className="text-gray-600 mb-8">Sign up to create and manage your own polls</p>
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Sign Up Now
            </Link>
          </div>
        </section>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Create and Participate in Polls
              </h1>
              <p className="text-lg mb-8">
                Join our platform to create engaging polls or vote in existing ones.
                No account required to vote!
              </p>
              {!authTokens && (
                <div className="space-x-4">
                  <Link
                    to="/register"
                    className="inline-block px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="inline-block px-6 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
            <div className="md:w-1/2">
              <img
                src={LaptopImage}
                alt="Voting Platform"
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose Our Platform</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the most comprehensive and user-friendly voting system designed for modern needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={FaVoteYea}
              title="Easy Voting"
              description="Simple and intuitive voting process for all participants"
            />
            <FeatureCard
              icon={FaChartLine}
              title="Real-time Results"
              description="Watch live as votes come in with instant updates"
            />
            <FeatureCard
              icon={FaShieldAlt}
              title="Secure & Private"
              description="Enterprise-grade security to protect your data"
            />
            <FeatureCard
              icon={FaMobileAlt}
              title="Mobile Ready"
              description="Vote from any device with our responsive design"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo">
        <VoteDemo />
      </section>

      {/* Search Bar */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Find Active Polls</h2>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search for polls..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200 shadow-soft-xl"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {searchTerm && (
        <section className="py-10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
              Search Results
            </h2>
            {filteredPolls.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    item={{
                      title: poll.title,
                      description: poll.description,
                      image: poll.poll_image,
                      startTime: poll.start_time,
                      endTime: poll.end_time,
                      pollType: poll.poll_type,
                      totalVotes: poll.total_votes
                    }}
                    linkTo={`/polls/${poll.id}/contestants`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No polls match your search.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Active Polls Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
              <p className="text-gray-600">Discover and participate in our latest polls</p>
            </div>
            <Link
              to="/upcoming/events"
              className="inline-flex items-center px-6 py-3 bg-white text-secondary-600 rounded-lg shadow-soft-xl hover:shadow-soft-2xl transition-shadow"
            >
              View Upcoming Events
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingPolls.map((poll) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PollCard
                  item={{
                    title: poll.title,
                    description: poll.description,
                    image: poll.poll_image,
                    startTime: poll.start_time,
                    endTime: poll.end_time,
                    pollType: poll.poll_type,
                    totalVotes: poll.total_votes
                  }}
                  linkTo={`/polls/${poll.id}/contestants`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-secondary-600 to-secondary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to Create Your Next Poll?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-lg">
                Join thousands of organizers who trust our platform for their voting needs. Create your poll in minutes and engage with your audience.
              </p>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 bg-white text-secondary-600 rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
                >
                  Get Started Free
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img
                src={LaptopImage}
                alt="Create Poll"
                className="rounded-xl shadow-soft-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Past Events Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Past Events</h2>
              <p className="text-gray-600">Explore our successfully completed polls</p>
            </div>
            <Link
              to="/past/events"
              className="inline-flex items-center px-6 py-3 bg-gray-50 text-gray-700 rounded-lg shadow-soft-xl hover:shadow-soft-2xl transition-shadow"
            >
              View Past Events
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {pastPolls.map((poll) => (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PollCard
                  item={{
                    title: poll.title,
                    description: poll.description,
                    image: poll.poll_image,
                  }}
                  linkTo={`/poll/${poll.id}/results`}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add the creator section */}
      {renderCreatorSection()}
    </div>
  );
};

export default Homepage;
