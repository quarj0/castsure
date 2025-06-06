/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import axiosInstance from "../apis/api";
import { FaSearch, FaPlus, FaCalendarAlt, FaArchive, FaClock, FaPlay } from "react-icons/fa";
import CountdownTimer from "./CountdownTimer";

const DashBoard = ({authTokens}) => {
  const [incomingPolls, setIncomingPolls] = useState([]);
  const [pastPolls, setPastPolls] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [allPolls, setAllPolls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolls = async () => {
      const now = new Date();
      try {
        setLoading(true);
        console.log('Fetching polls...');
        console.log('Auth token:', authTokens);
        
        const response = await axiosInstance.get("polls/list/");
        console.log('Polls response:', response.data);
        
        const polls = response.data;
        setAllPolls(polls);
        
        // Categorize polls based on start_time and end_time
        console.log('Current time:', now.toISOString());
        
        const incoming = polls.filter(poll => {
          const startTime = new Date(poll.start_time);
          console.log(`Poll ${poll.id} - Start time:`, startTime.toISOString());
          return startTime > now;
        });
        
        const active = polls.filter(poll => {
          const startTime = new Date(poll.start_time);
          const endTime = new Date(poll.end_time);
          console.log(`Poll ${poll.id} - Start:`, startTime.toISOString(), 'End:', endTime.toISOString());
          return startTime <= now && endTime > now;
        });
        
        const past = polls.filter(poll => {
          const endTime = new Date(poll.end_time);
          console.log(`Poll ${poll.id} - End time:`, endTime.toISOString());
          return endTime <= now;
        });
        
        console.log('Categorized polls:', { incoming, active, past });
        
        setIncomingPolls(incoming);
        setActivePolls(active);
        setPastPolls(past);
      } catch (error) {
        console.error("Error fetching polls:", error);
        setError(error.response?.data?.detail || 'Failed to fetch polls');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, [authTokens]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredIncomingPolls = incomingPolls.filter((poll) =>
    poll.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActivePolls = activePolls.filter((poll) =>
    poll.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const PollCard = ({ poll, isPast = false }) => (
    <motion.div
      variants={item}
      className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow ${
        isPast ? 'opacity-75 hover:opacity-100' : ''
      }`}
    >
      <Link to={isPast ? `/poll/${poll.id}/results` : `/polls/${poll.id}/contestants`}>
        <img
          src={
            poll.poll_image ||
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=="
          }
          alt={poll.title}
          className={`w-full h-48 object-cover ${isPast ? 'filter grayscale' : ''}`}
        />
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">
            {poll.title}
          </h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            {poll.description}
          </p>
          {!isPast && (
            <div className="flex items-center justify-between mb-2">
              <CountdownTimer startTime={poll.start_time} endTime={poll.end_time} />
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <FaCalendarAlt className="mr-2" />
            <span className="text-xs">
              {new Date(poll.start_time).toLocaleDateString()}
            </span>
          </div>
          {isPast && (
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                View Results
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );

  // PropTypes for PollCard
  PollCard.propTypes = {
    poll: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      poll_image: PropTypes.string,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
    }).isRequired,
    isPast: PropTypes.bool,
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((n) => (
        <div key={n} className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-lg opacity-90">
            Manage your polls and view results all in one place
          </p>
          <motion.div
            className="mt-6 flex gap-4 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              to="/create-poll"
              className="inline-flex items-center px-6 py-3 bg-white text-secondary-600 rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              <FaPlus className="mr-2" />
              Create New Poll
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search polls..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              onChange={handleSearch}
            />
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              className="bg-white p-6 rounded-lg shadow-sm"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-2">Incoming Polls</h3>
              <p className="text-3xl font-bold text-blue-600">
                {incomingPolls.length}
              </p>
            </motion.div>
            <motion.div
              className="bg-white p-6 rounded-lg shadow-sm"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-2">Active Polls</h3>
              <p className="text-3xl font-bold text-green-600">
                {activePolls.length}
              </p>
            </motion.div>
            <motion.div
              className="bg-white p-6 rounded-lg shadow-sm"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-2">Past Polls</h3>
              <p className="text-3xl font-bold text-gray-600">
                {pastPolls.length}
              </p>
            </motion.div>
            <motion.div
              className="bg-white p-6 rounded-lg shadow-sm"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-2">Total Polls</h3>
              <p className="text-3xl font-bold text-secondary-600">
                {allPolls.length}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Active Polls */}
      <section className="py-8 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FaPlay className="mr-2 text-green-600" />
              Active Polls
            </h2>
            <Link
              to="/active/polls"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {filteredActivePolls.slice(0, 6).map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </motion.div>
          )}

          {!loading && filteredActivePolls.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active polls found
              </h3>
              <p className="text-gray-500">
                Check back when polls are live
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Incoming Polls */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FaClock className="mr-2 text-blue-600" />
              Incoming Polls
            </h2>
            <Link
              to="/incoming/polls"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {filteredIncomingPolls.slice(0, 6).map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </motion.div>
          )}

          {!loading && filteredIncomingPolls.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No incoming polls found
              </h3>
              <p className="text-gray-500">
                Create a new poll or check back later
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Past Polls */}
      <section className="py-8 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <FaArchive className="mr-2 text-gray-600" />
              Past Polls
            </h2>
            <Link
              to="/past/polls"
              className="text-gray-600 hover:text-gray-700 font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
            >
              {pastPolls.slice(0, 6).map((poll) => (
                <PollCard key={poll.id} poll={poll} isPast={true} />
              ))}
            </motion.div>
          )}

          {!loading && pastPolls.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No past polls found
              </h3>
              <p className="text-gray-500">
                Completed polls will appear here
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashBoard;

DashBoard.propTypes = {
  authTokens: PropTypes.shape({
    access: PropTypes.string.isRequired, 
    refresh: PropTypes.string, 
    
  }),
};
