/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import axiosInstance from "../apis/api";
import {
  FaSearch,
  FaPlay,
  FaCalendarAlt,
  FaUsers,
  FaChartBar,
  FaSort,
  FaArrowLeft,
  FaClock,
  FaEye,
} from "react-icons/fa";
import CountdownTimer from "../components/CountdownTimer";

const ActivePolls = ({ authTokens }) => {
  const [activePolls, setActivePolls] = useState([]);
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetchActivePolls();
  }, [authTokens]);

  useEffect(() => {
    filterAndSortPolls();
  }, [activePolls, searchTerm, sortBy]);

  const fetchActivePolls = async () => {
    const now = new Date();
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("polls/list/");

      const polls = response.data;
      const active = polls.filter((poll) => {
        const startTime = new Date(poll.start_time);
        const endTime = new Date(poll.end_time);
        return startTime <= now && endTime > now;
      });

      setActivePolls(active);
    } catch (error) {
      console.error("Error fetching active polls:", error);
      setError(error.response?.data?.detail || "Failed to fetch active polls");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPolls = () => {
    let filtered = activePolls.filter(
      (poll) =>
        poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poll.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort polls based on selected criteria
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) => new Date(b.start_time) - new Date(a.start_time)
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "ending_soon":
        filtered.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
        break;
      default:
        break;
    }

    setFilteredPolls(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

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

  const PollCard = ({ poll }) => (
    <motion.div
      variants={item}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-green-300"
      whileHover={{ y: -2 }}
    >
      <Link to={`/poll/${poll.id}/contestants`}>
        <div className="relative">
          <img
            src={
              poll.poll_image ||
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=="
            }
            alt={poll.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-[pulse_1.5s_ease-in-out_infinite]">
              <FaPlay className="mr-1" />
              LIVE
            </span>
          </div>
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-50 text-white rounded text-xs">
              <FaEye className="mr-1" />
              {poll.total_votes || 0}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">
            {poll.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {poll.description}
          </p>

          <div className="mb-3">
            <CountdownTimer
              startTime={poll.start_time}
              endTime={poll.end_time}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2" />
              <span className="text-xs">
                Started: {new Date(poll.start_time).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center text-orange-600">
              <FaClock className="mr-1" />
              <span className="font-medium text-xs">
                {getTimeRemaining(poll.end_time)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <FaUsers className="mr-2" />
              <span>{poll.total_contestants || 0} Contestants</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
            >
              <FaChartBar className="mr-1" />
              View Poll
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  const PollListItem = ({ poll }) => (
    <motion.div
      variants={item}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200 hover:border-green-300"
    >
      <Link to={`/poll/${poll.id}/contestants`}>
        <div className="flex items-center space-x-4">
          <img
            src={
              poll.poll_image ||
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4="
            }
            alt={poll.title}
            className="w-16 h-16 object-cover rounded-lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {poll.title}
              </h3>
              <span className="inline-flex items-center px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium ml-2">
                <FaPlay className="mr-1" />
                LIVE
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-1">
              {poll.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <FaUsers className="mr-1" />
                  <span>{poll.total_contestants || 0}</span>
                </div>
                <div className="flex items-center">
                  <FaEye className="mr-1" />
                  <span>{poll.total_votes || 0}</span>
                </div>
                <div className="flex items-center text-orange-600">
                  <FaClock className="mr-1" />
                  <span className="font-medium">
                    {getTimeRemaining(poll.end_time)}
                  </span>
                </div>
              </div>

              <CountdownTimer
                startTime={poll.start_time}
                endTime={poll.end_time}
                compact={true}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  // PropTypes
  PollCard.propTypes = {
    poll: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      poll_image: PropTypes.string,
      start_time: PropTypes.string.isRequired,
      end_time: PropTypes.string.isRequired,
      total_contestants: PropTypes.number,
      total_votes: PropTypes.number,
    }).isRequired,
  };

  PollListItem.propTypes = PollCard.propTypes;

  const LoadingSkeleton = () => (
    <div
      className={`grid gap-6 ${
        viewMode === "grid"
          ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          : "grid-cols-1"
      }`}
    >
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div key={n} className="animate-pulse">
          <div
            className={`bg-gray-200 rounded-lg mb-4 ${
              viewMode === "grid" ? "h-48" : "h-16"
            }`}
          ></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Active Polls
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchActivePolls}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-white hover:text-green-200 transition-colors mr-4"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to Dashboard
                </Link>
              </div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <FaPlay className="mr-3" />
                Active Polls
              </h1>
              <p className="text-lg opacity-90">
                {filteredPolls.length} live polls currently running
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{activePolls.length}</div>
              <div className="text-sm opacity-90">Total Active</div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="py-6 bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search active polls..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <FaSort className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Alphabet...</option>
                  <option value="ending_soon">Ending Soon</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Polls Grid/List */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredPolls.length === 0 ? (
            <div className="text-center py-16">
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm
                  ? "No matching active polls found"
                  : "No active polls at the moment"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Check back later when polls go live"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredPolls.map((poll) =>
                viewMode === "grid" ? (
                  <PollCard key={poll.id} poll={poll} />
                ) : (
                  <PollListItem key={poll.id} poll={poll} />
                )
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      {!loading && filteredPolls.length > 0 && (
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {filteredPolls.length} of {activePolls.length} active
                  polls
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchActivePolls}
                  className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Refresh
                </button>
                <Link
                  to="/create-poll"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create New Poll
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

ActivePolls.propTypes = {
  authTokens: PropTypes.shape({
    access: PropTypes.string.isRequired,
    refresh: PropTypes.string,
  }),
};

export default ActivePolls;
