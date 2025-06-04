import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axiosInstance from "../apis/api";
import { Link } from "react-router-dom";
import { FaArrowAltCircleLeft, FaClock, FaCalendarAlt, FaPlay } from "react-icons/fa";
import { format } from "date-fns";
import CountdownTimer from "./CountdownTimer";
import { motion } from "framer-motion";

const UpcomingPolls = () => {
  const [, setAllPolls] = useState([]);
  const [upcomingPolls, setUpcomingPolls] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await axiosInstance.get("polls/list/");
        const polls = response.data;
        const now = new Date();
        
        // Properly categorize polls
        const upcoming = polls.filter(poll => new Date(poll.start_time) > now);
        const active = polls.filter(poll => 
          new Date(poll.start_time) <= now && new Date(poll.end_time) > now
        );
        
        // Sort by start time
        const sortedUpcoming = upcoming.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const sortedActive = active.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        setAllPolls(polls);
        setUpcomingPolls(sortedUpcoming);
        setActivePolls(sortedActive);
      } catch (error) {
        console.error("Error fetching polls:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  const PollCard = ({ poll, isActive = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="relative">
        <img
          src={
            poll.poll_image ||
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=="
          }
          alt={`Image for ${poll.title}`}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          {isActive && (
            <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full shadow-md">
              Live
            </span>
          )}
          <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full shadow-md">
            {poll.poll_type === 'voters-pay' ? 'Voters Pay' : 'Creator Pay'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
          {poll.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {poll.description}
        </p>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <CountdownTimer startTime={poll.start_time} endTime={poll.end_time} />
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <FaClock className="mr-2" />
            <span className="text-xs">
              {isActive ? 'Started: ' : 'Starts: '}
              {format(new Date(poll.start_time), "PPp")}
            </span>
          </div>
        </div>

        <Link
          to={`/polls/${poll.id}/contestants`}
          className={`block w-full text-center py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg ${
            isActive 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isActive ? 'Vote Now' : 'View Contestants'}
        </Link>
      </div>
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
      poll_type: PropTypes.string,
    }).isRequired,
    isActive: PropTypes.bool,
  };

  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading polls...</p>
      </div>
    </div>
  );

  const ErrorScreen = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Failed to load polls. Please try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white py-2 px-6 rounded-full hover:bg-blue-600 transition-colors shadow-md"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const EmptyState = ({ type }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl text-gray-600 mb-4">
          {type === 'upcoming' ? 'No upcoming polls found.' : 'No active polls found.'}
        </h1>
        <p className="text-gray-500 mb-6">
          {type === 'upcoming' 
            ? 'Check back later for new polling events.' 
            : 'All polls are either upcoming or have ended.'
          }
        </p>
        <Link 
          to="/dashboard" 
          className="text-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center"
        >
          <FaArrowAltCircleLeft className="mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  // PropTypes for EmptyState
  EmptyState.propTypes = {
    type: PropTypes.oneOf(['upcoming', 'active']).isRequired,
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen />;

  const currentPolls = activeTab === 'upcoming' ? upcomingPolls : activePolls;
  const hasPolls = upcomingPolls.length > 0 || activePolls.length > 0;

  if (!hasPolls) {
    return <EmptyState type="upcoming" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Poll Events
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover and participate in our latest voting events. Don&apos;t miss out on having your say!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm p-1 flex">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'active'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaPlay className="mr-2" />
              Active Polls ({activePolls.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaCalendarAlt className="mr-2" />
              Upcoming Polls ({upcomingPolls.length})
            </button>
          </div>
        </div>

        {/* Polls Grid */}
        {currentPolls.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {currentPolls.map((poll) => (
              <PollCard 
                key={poll.id} 
                poll={poll} 
                isActive={activeTab === 'active'} 
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState type={activeTab} />
        )}

        <div className="mt-12 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FaArrowAltCircleLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

// PropTypes for main component
UpcomingPolls.propTypes = {
  // No props expected for the main component
};

export default UpcomingPolls;