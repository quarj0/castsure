/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "../apis/api";

import {
  FaArrowLeft,
  FaChartBar,
  FaChartPie,
  FaTable,
  FaTrophy,
  FaVoteYea,
} from "react-icons/fa";
import avatar from "../assets/user-icon.jpg";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const ResultsPage = () => {
  const { pollId } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("table");
  const [pollDetails, setPollDetails] = useState(null);
  const [pollData, setPollData] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const httpIntervalRef = useRef(null);

  // Helper function to process image URLs
  const getImageUrl = (imageData) => {
    if (!imageData) return avatar;
    if (typeof imageData === "string") {
      return imageData.startsWith("http")
        ? imageData
        : `http://localhost:8000${imageData}`;
    }
    if (imageData.url) return imageData.url;
    return avatar;
  };

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      // First try to get the results
      const resultsResponse = await axiosInstance.get(
        `/vote/results/${pollId}/`
      );

      // Process results data
      const resultsData = resultsResponse.data;
      const processedResults = processResults(resultsData);
      setResults(resultsData); // Store the raw data instead of processed data

      let newPollDetails = null;
      // Set poll details from results data if available
      if (resultsResponse.data.poll_title) {
        newPollDetails = {
          title: resultsResponse.data.poll_title,
          description: "This poll has ended. Showing final results.",
          is_active: false,
        };
      }

      try {
        // Then try to get poll details
        const pollResponse = await axiosInstance.get(`/polls/${pollId}/`);
        newPollDetails = pollResponse.data;

        // Check if poll is still active
        if (pollResponse.data?.poll) {
          const pollData = pollResponse.data.poll || pollResponse.data;
          const now = new Date();
          const startTime = new Date(pollData.start_time);
          const endTime = new Date(pollData.end_time);
          const isActive = pollData.active;
          setIsActive(isActive && now >= startTime && now <= endTime);
        } else {
          console.warn("poll key missing in poll data");
        }
      } catch (pollError) {
        console.error("Error fetching poll details:", pollError);
        if (pollError.response?.data?.message === "Poll is not active") {
          setIsActive(false);
        }
      }

      // Update poll details once at the end
      if (newPollDetails) {
        setPollDetails(newPollDetails);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
      console.log("Error response data:", error.response?.data);
      setError(
        error.response?.data?.message ||
          error.response?.data?.detail ||
          "Failed to fetch results. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // Initial fetch only - no polling
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const processResults = (data) => {
    if (!data)
      return { results: [], categories: {}, categoryList: [], totalVotes: 0 };

    // If we have the new API response structure
    if (data.categories && data.category_list) {
      return {
        results: [], // We don't need this anymore but keep for backward compatibility
        categories: data.categories,
        categoryList: data.category_list,
        totalVotes: data.total_votes || 0,
      };
    }

    // Handle legacy data formats
    if (Array.isArray(data)) {
      return {
        results: data
          .map((item) => ({
            name: item.name || item.contestant?.name,
            vote_count: item.vote_count || item.total_votes || 0,
            image: getImageUrl(item.image || item.contestant_image),
            category: item.category || "Uncategorized",
          }))
          .sort((a, b) => b.vote_count - a.vote_count),
        categories: {},
        categoryList: [],
        totalVotes: 0,
      };
    }

    return { results: [], categories: {}, categoryList: [], totalVotes: 0 };
  };

  const getDynamicColor = (index, total) =>
    `hsl(${(index * 360) / total}, 70%, 50%)`;

  const getVotePercentage = (votes) => {
    const totalVotes = results.reduce(
      (acc, result) => acc + result.vote_count,
      0
    );
    return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const renderCategoryResults = (category, categoryData) => {
    if (!categoryData || !categoryData.contestants) {
      console.error("Invalid category data:", category, categoryData);
      return null;
    }

    return (
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <FaTrophy className="mr-2 text-primary-600" />
          {category}
          <span className="ml-2 text-sm text-gray-500">
            ({categoryData.total_votes || 0} votes)
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contestant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.contestants.map((contestant, index) => (
                <motion.tr
                  key={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={getImageUrl(contestant.image)}
                          alt={contestant.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contestant.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contestant.vote_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {contestant.percentage}%
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  const renderChart = () => {
    const { categories, categoryList } = processResults(results);

    switch (activeTab) {
      case "bar":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {categoryList &&
              categoryList.map((category) => (
                <div
                  key={category}
                  className="bg-white rounded-xl shadow-sm p-6 mb-6"
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <FaChartBar className="mr-2 text-primary-600" />
                    {category}
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={categories[category].contestants}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value, name, props) => {
                          if (!props || !props.payload) return "";
                          return `${props.payload.percentage}%`;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="vote_count"
                        name="Votes"
                        fill="#8884d8"
                        label={{
                          position: "top",
                          formatter: (value, name, props) => {
                            if (!props || !props.payload) return "";
                            return `${props.payload.percentage}%`;
                          },
                        }}
                      >
                        {categories[category].contestants.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getDynamicColor(
                                index,
                                categories[category].contestants.length
                              )}
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
          </motion.div>
        );

      case "pie":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {categoryList &&
              categoryList.map((category) => (
                <div
                  key={category}
                  className="bg-white rounded-xl shadow-sm p-6 mb-6"
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <FaChartPie className="mr-2 text-primary-600" />
                    {category}
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value, name, props) => {
                          if (!props || !props.payload) return [value, name];
                          return [
                            `${value} votes (${props.payload.percentage}%)`,
                            name,
                          ];
                        }}
                      />
                      <Legend />
                      <Pie
                        data={categories[category].contestants}
                        dataKey="vote_count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          value,
                          index,
                        }) => {
                          const RADIAN = Math.PI / 180;
                          const radius =
                            25 + innerRadius + (outerRadius - innerRadius);
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);

                          return (
                            <text
                              x={x}
                              y={y}
                              fill={getDynamicColor(
                                index,
                                categories[category].contestants.length
                              )}
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                            >
                              {
                                categories[category].contestants[index]
                                  .percentage
                              }
                              %
                            </text>
                          );
                        }}
                      >
                        {categories[category].contestants.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getDynamicColor(
                                index,
                                categories[category].contestants.length
                              )}
                            />
                          )
                        )}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ))}
          </motion.div>
        );

      case "table":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {categoryList &&
              categoryList.map((category) => (
                <div key={category}>
                  {renderCategoryResults(category, categories[category])}
                </div>
              ))}
          </motion.div>
        );

      default:
        return null;
    }
  };

  // --- WebSocket logic ---
  const connectWebSocket = useCallback(() => {
    if (!isActive) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }
    try {
      const wsUrl = `ws://localhost:8000/ws/poll/${pollId}/`;
      console.log("Connecting to WebSocket:", wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      };
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "poll_results":
              if (data.poll_results) {
                setPollData(data.poll_results);
                setIsActive(!!data.poll_results.active);
                const total =
                  data.poll_results.votes?.reduce(
                    (sum, vote) => sum + (vote.total_votes || 0),
                    0
                  ) || 0;
                setTotalVotes(total);
                // If poll is now inactive, disconnect WebSocket
                if (!data.poll_results.active) {
                  disconnectWebSocket();
                }
                // Fetch latest results from HTTP endpoint for live update
                fetchResults();
              }
              break;
            case "pong":
              console.log("Received pong from server");
              break;
            case "error":
              console.error("WebSocket error message:", data.message);
              setConnectionError(data.message);
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionError("Connection error occurred");
        setIsConnected(false);
      };
      wsRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
        setIsConnected(false);
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts &&
          isActive
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          console.log(
            `Attempting to reconnect in ${delay}ms... (attempt ${
              reconnectAttemptsRef.current + 1
            })`
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError("Maximum reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      setConnectionError("Failed to create WebSocket connection");
    }
  }, [pollId, isActive]);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounting or poll ended");
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const requestUpdate = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "request_update",
          poll_id: pollId,
        })
      );
    }
  }, [pollId]);

  // --- Initial HTTP fetch to get pollData and isActive ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/polls/${pollId}/`);
        if (response.ok) {
          const data = await response.json();
          setPollData(data);
          setIsActive(!!data.active);
          const total =
            data.votes?.reduce(
              (sum, vote) => sum + (vote.total_votes || 0),
              0
            ) || 0;
          setTotalVotes(total);
        }
      } catch (error) {
        console.error("Error fetching initial poll data:", error);
      }
    };
    if (pollId) {
      fetchInitialData();
    }
  }, [pollId]);

  // --- WebSocket connection management ---
  useEffect(() => {
    if (isActive) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }
    return () => {
      disconnectWebSocket();
    };
  }, [isActive, connectWebSocket, disconnectWebSocket]);

  // --- HTTP polling for ended polls (optional, every 30s) ---
  useEffect(() => {
    if (!isActive && pollId) {
      httpIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(
            `http://localhost:8000/polls/${pollId}/`
          );
          if (response.ok) {
            const data = await response.json();
            setPollData(data);
            const total =
              data.votes?.reduce(
                (sum, vote) => sum + (vote.total_votes || 0),
                0
              ) || 0;
            setTotalVotes(total);
          }
        } catch (error) {
          console.error("Error fetching poll data (ended poll):", error);
        }
      }, 30000); // 30s
    }
    return () => {
      if (httpIntervalRef.current) {
        clearInterval(httpIntervalRef.current);
        httpIntervalRef.current = null;
      }
    };
  }, [isActive, pollId]);

  // --- Periodic ping to keep connection alive ---
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // Ping every 30 seconds
    return () => clearInterval(pingInterval);
  }, []);

  // Add periodic polling every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResults();
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchResults]);

  const handleRetryConnection = () => {
    reconnectAttemptsRef.current = 0;
    setConnectionError(null);
    connectWebSocket();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12 px-4"
      >
        <div className="container mx-auto">
          <Link
            to={`/poll/${pollId}/contestants`}
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Contestants
          </Link>
          <h1 className="text-3xl font-bold">
            {pollDetails?.title || "Poll Results"}
          </h1>
          {pollDetails && (
            <p className="mt-2 text-white/80">{pollDetails.description}</p>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchResults}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-6"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Votes</p>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl font-bold mt-1"
                    >
                      {processResults(results).totalVotes || 0}
                    </motion.h3>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <FaVoteYea className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-6"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Categories</p>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl font-bold mt-1"
                    >
                      {processResults(results).categoryList.length || 0}
                    </motion.h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaTable className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm p-6"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Leading Category</p>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl font-bold mt-1 truncate max-w-[200px]"
                    >
                      {(() => {
                        const { categories, categoryList } =
                          processResults(results);
                        if (!categoryList.length) return "No categories";
                        const leadingCategory = categoryList.reduce(
                          (max, cat) =>
                            (categories[cat]?.totalVotes || 0) >
                            (categories[max]?.totalVotes || 0)
                              ? cat
                              : max,
                          categoryList[0]
                        );
                        return leadingCategory;
                      })()}
                    </motion.h3>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FaTrophy className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Visualization Controls */}
            <div className="flex justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("table")}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  activeTab === "table"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaTable className="mr-2" />
                Table View
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("bar")}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  activeTab === "bar"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaChartBar className="mr-2" />
                Bar View
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab("pie")}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  activeTab === "pie"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaChartPie className="mr-2" />
                Pie View
              </motion.button>
            </div>

            {/* Chart/Table Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderChart()}
              </motion.div>
            </AnimatePresence>

            {/* Connection Status */}
            <div className="mt-6 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActive
                      ? isConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isActive
                    ? isConnected
                      ? "Live Updates Active"
                      : "Connection Lost"
                    : "Poll Ended"}
                </span>
              </div>
              {connectionError && isActive && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-red-600">
                    {connectionError}
                  </span>
                  <button
                    onClick={handleRetryConnection}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Retry
                  </button>
                </div>
              )}
              {isActive && (
                <button
                  onClick={requestUpdate}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!isConnected}
                >
                  Refresh
                </button>
              )}
            </div>

            {/* Poll Information */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {pollData?.title}
              </h1>
              <p className="text-gray-600 mb-4">{pollData?.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Total Votes:{" "}
                  <strong className="text-blue-600">
                    {totalVotes.toLocaleString()}
                  </strong>
                </span>
                <span>
                  Last Updated:{" "}
                  {new Date(pollData?.last_updated).toLocaleTimeString() ||
                    "No updates yet"}
                </span>
              </div>
            </div>

            {/* Voting Results */}
            <div className="space-y-4">
              {pollData?.votes?.map((vote, index) => {
                const percentage =
                  totalVotes > 0 ? (vote.total_votes / totalVotes) * 100 : 0;
                return (
                  <div
                    key={vote.contestant}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Contestant #{vote.contestant}
                      </h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {vote.total_votes.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {(!pollData?.votes || pollData?.votes.length === 0) && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Live Updates
                </h3>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;
