import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaImage,
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import axiosInstance from "../apis/api";
import { PaystackButton } from "react-paystack";

const steps = [
  { title: "Basic Info", description: "Enter poll title and description" },
  { title: "Timing", description: "Set start and end times" },
  { title: "Type & Fees", description: "Choose poll type and set fees" },
  { title: "Preview", description: "Review your poll details" },
];

const CreatePoll = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    poll_type: "",
    expected_voters: "",
    voting_fee: "",
    poll_image: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [setupFee, setSetupFee] = useState(0);
  const [responseData, setResponseData] = useState(null);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [paystackSuccess, setPaystackSuccess] = useState("");
  const [paystackError, setPaystackError] = useState("");

  const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const VOTER_CODES_URL = import.meta.env.VITE_API_URL;

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Calculate setup fee for creator-pay polls
    if (name === "expected_voters" && formData.poll_type === "creator-pay") {
      const expectedVoters = Number(value);
      let fee = 0;

      if (expectedVoters >= 20) {
        // 20-80 voters: 1.5 GHS per voter
        if (expectedVoters <= 80) {
          fee = expectedVoters * 1.5;
        }
        // 81-150 voters: 1.3 GHS per voter
        else if (expectedVoters <= 150) {
          fee = expectedVoters * 1.3;
        }
        // 151-350 voters: 0.9 GHS per voter
        else if (expectedVoters <= 350) {
          fee = expectedVoters * 0.9;
        }
      }

      setSetupFee(fee);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    switch (step) {
      case 0:
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        break;
      case 1: {
        if (!formData.start_time)
          newErrors.start_time = "Start time is required";
        if (!formData.end_time) newErrors.end_time = "End time is required";

        const startTime = new Date(formData.start_time);
        const endTime = new Date(formData.end_time);
        const now = new Date();

        if (startTime <= now) {
          newErrors.start_time = "Start time must be in the future";
        }
        if (endTime <= startTime) {
          newErrors.end_time = "End time must be after start time";
        }
        break;
      }
      case 2:
        if (!formData.poll_type) newErrors.poll_type = "Poll type is required";

        if (formData.poll_type === "creator-pay") {
          if (!formData.expected_voters) {
            newErrors.expected_voters = "Expected voters is required";
          } else {
            const voters = Number(formData.expected_voters);
            if (voters < 20) {
              newErrors.expected_voters =
                "Expected voters must be at least 20 for creator-pay polls.";
            } else if (voters > 350) {
              newErrors.expected_voters =
                "For more than 350 voters, please use the voters-pay model.";
            }
          }
        }

        if (formData.poll_type === "voters-pay") {
          if (!formData.voting_fee) {
            newErrors.voting_fee = "Voting fee is required";
          } else if (Number(formData.voting_fee) <= 0) {
            newErrors.voting_fee = "Voting fee must be greater than 0";
          }
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    const submissionData = new FormData();

    // Append each field to FormData
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        submissionData.append(key, formData[key]);
      }
    });

    // Add setup fee for creator-pay polls
    if (formData.poll_type === "creator-pay" && setupFee > 0) {
      submissionData.append("setup_fee", setupFee);
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await axiosInstance.post("polls/create/", submissionData);
      setResponseData(res.data);
    } catch (err) {
      console.error("API Error:", err.response?.data?.error);
      const apiErrors = err.response?.data?.errors || {};

      const newErrors = {};

      if (typeof apiErrors === "object") {
        Object.keys(apiErrors).forEach((field) => {
          if (Array.isArray(apiErrors[field])) {
            newErrors[field] = apiErrors[field][0];
          } else {
            newErrors[field] = apiErrors[field];
          }
        });
      } else if (typeof apiErrors === "string") {
        newErrors.general = apiErrors;
      }

      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (reference) => {
    setPaystackLoading(true);
    setPaystackSuccess("Verifying payment...");
    setPaystackError("");

    try {
      const verifyRes = await axiosInstance.get(
        `/payment/verify/${reference.reference}/`
      );
      setPaystackSuccess(
        verifyRes.data.message ||
          "Payment verified successfully. Your poll is now active!"
      );

      // Update response data to reflect activated status
      setResponseData((prev) => ({
        ...prev,
        message: "Poll created and activated successfully!",
        payment_completed: true,
      }));
    } catch (err) {
      console.error("Payment verification error:", err);
      setPaystackError(
        err.response?.data?.message ||
          "Payment verification failed. Please contact support if you were debited."
      );
    } finally {
      setPaystackLoading(false);
    }
  };

  const handlePaystackClose = () => {
    setPaystackLoading(false);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter poll title"
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter poll description"
                maxLength={1000}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Image (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="poll-image-upload"
                      className="relative cursor-pointer rounded-md font-medium text-secondary-600 hover:text-secondary-500"
                    >
                      <span>Upload an image</span>
                      <input
                        id="poll-image-upload"
                        name="poll_image"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 3MB</p>
                </div>
              </div>
              {formData.poll_image && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(formData.poll_image)}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg mx-auto"
                  />
                  <p className="text-sm text-gray-600 mt-1 text-center">
                    Selected: {formData.poll_image.name}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, poll_image: null }))
                    }
                    className="mt-2 text-sm text-red-600 hover:text-red-800 block mx-auto"
                  >
                    Remove image
                  </button>
                </div>
              )}
              {errors.poll_image && (
                <p className="mt-1 text-sm text-red-600">{errors.poll_image}</p>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaCalendarAlt className="inline mr-2" />
                Start Time
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-500">{errors.start_time}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaClock className="inline mr-2" />
                End Time
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                min={
                  formData.start_time || new Date().toISOString().slice(0, 16)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.end_time && (
                <p className="mt-1 text-sm text-red-500">{errors.end_time}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poll Type
              </label>
              <select
                name="poll_type"
                value={formData.poll_type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Poll Type</option>
                <option value="voters-pay">
                  Voter-Pay (Voters pay to vote)
                </option>
                <option value="creator-pay">
                  Creator-Pay (You pay for setup)
                </option>
              </select>
              {errors.poll_type && (
                <p className="mt-1 text-sm text-red-500">{errors.poll_type}</p>
              )}
            </div>

            {formData.poll_type === "creator-pay" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Voters
                </label>
                <input
                  type="number"
                  name="expected_voters"
                  value={formData.expected_voters}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="20"
                  max="350"
                  placeholder="Minimum 20 voters required"
                />
                {errors.expected_voters && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.expected_voters}
                  </p>
                )}
                {setupFee > 0 && (
                  <div className="mt-2 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      Setup Fee: GHS {setupFee.toFixed(2)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      This fee covers voter code generation and poll management
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.poll_type === "voters-pay" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voting Fee (GHS)
                </label>
                <input
                  type="number"
                  name="voting_fee"
                  value={formData.voting_fee}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount voters pay to participate"
                />
                {errors.voting_fee && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.voting_fee}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Poll Details Preview
              </h3>
              <dl className="grid grid-cols-1 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formData.title}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formData.description}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Start Time
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.start_time).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      End Time
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(formData.end_time).toLocaleString()}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Poll Type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formData.poll_type === "voters-pay"
                      ? "Voter-Pay"
                      : "Creator-Pay"}
                  </dd>
                </div>
                {formData.poll_type === "creator-pay" && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Expected Voters
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formData.expected_voters}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Setup Fee
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        GHS {setupFee.toFixed(2)}
                      </dd>
                    </div>
                  </>
                )}
                {formData.poll_type === "voters-pay" && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Voting Fee
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      GHS {formData.voting_fee}
                    </dd>
                  </div>
                )}
                {formData.poll_image && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Poll Image
                    </dt>
                    <dd className="mt-1">
                      <img
                        src={URL.createObjectURL(formData.poll_image)}
                        alt="Poll preview"
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (responseData) {
    const isCreatorPay = formData.poll_type === "creator-pay";
    const hasPaymentLink = responseData.payment_link;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <FaCheck className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {responseData.message}
          </h2>

          <div className="space-y-4">
            {responseData.short_url && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="font-medium text-blue-900">Poll URL</p>
                <div className="mt-2">
                  <input
                    type="text"
                    value={responseData.short_url}
                    readOnly
                    className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-md"
                  />
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(responseData.short_url)
                    }
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            )}

            {/* Payment section for creator-pay polls */}
            {isCreatorPay &&
              hasPaymentLink &&
              !responseData.payment_completed && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="font-medium text-yellow-900 mb-2">
                    Complete Payment to Activate Poll
                  </p>
                  <p className="text-sm text-yellow-700 mb-4">
                    Your poll has been created but needs payment to become
                    active.
                  </p>

                  {paystackError && (
                    <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
                      {paystackError}
                    </div>
                  )}

                  {paystackSuccess && (
                    <div className="mb-3 p-2 bg-green-100 border border-green-200 rounded text-green-700 text-sm">
                      {paystackSuccess}
                    </div>
                  )}

                  <PaystackButton
                    publicKey={PAYSTACK_PUBLIC_KEY}
                    email={responseData.user_email || "user@example.com"}
                    amount={setupFee * 100} // Convert to kobo
                    reference={`poll-${responseData.poll_id}-${Date.now()}`}
                    currency="GHS"
                    text={
                      paystackLoading
                        ? "Processing..."
                        : `Pay GHS ${setupFee.toFixed(2)}`
                    }
                    onSuccess={handlePaystackSuccess}
                    onClose={handlePaystackClose}
                    disabled={paystackLoading}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  />
                </div>
              )}

            {/* Download voter codes section */}
            {responseData.download_voter_codes && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="font-medium text-green-900 mb-2">
                  Voter Codes Ready
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Download the voter codes to distribute to participants.
                </p>
                <a
                  href={`${VOTER_CODES_URL}${responseData.download_voter_codes}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download Voter Codes
                  <FaArrowRight className="ml-2" />
                </a>
              </div>
            )}

            {/* Success message for completed payments */}
            {responseData.payment_completed && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="font-medium text-green-900">
                  🎉 Poll Activated Successfully!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Your poll is now live and ready for voting.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <nav className="mb-8">
          <ol className="flex items-center w-full">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={`flex items-center ${
                  index < steps.length - 1 ? "w-full" : ""
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    index <= currentStep
                      ? "bg-primary-600 border-primary-600 text-white"
                      : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {index < currentStep ? (
                    <FaCheck className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-2 hidden sm:block">
                  <div
                    className={`text-sm ${
                      index === currentStep
                        ? "font-medium text-gray-900"
                        : index < currentStep
                        ? "font-medium text-primary-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Form Content */}
        <motion.div
          className="bg-white rounded-xl shadow-sm p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold mb-1">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                {steps[currentStep].description}
              </p>

              <form
                onSubmit={
                  currentStep === steps.length - 1
                    ? handleSubmit
                    : (e) => e.preventDefault()
                }
              >
                {renderStepContent()}

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${
                      currentStep === 0 ? "invisible" : ""
                    }`}
                  >
                    <FaArrowLeft className="mr-2" />
                    Previous
                  </button>

                  <button
                    type={
                      currentStep === steps.length - 1 ? "submit" : "button"
                    }
                    onClick={
                      currentStep === steps.length - 1 ? undefined : nextStep
                    }
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {currentStep === steps.length - 1 ? (
                      loading ? (
                        "Creating Poll..."
                      ) : (
                        "Create Poll"
                      )
                    ) : (
                      <>
                        Next
                        <FaArrowRight className="ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePoll;
