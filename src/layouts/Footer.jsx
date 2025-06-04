import {
  FaEnvelope,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      {/* Advertisement Banner */}
      <div className="w-full flex justify-center py-4 bg-white border-t border-gray-200">
        <div style={{ position: "relative" }}>
          <iframe 
            src="https://publisher.linkvertise.com/cdn/ads/LV-728x90/index.html" 
            frameBorder="0" 
            height="250" 
            width="300"
            title="Advertisement"
          />
          <a 
            href="https://publisher.linkvertise.com/ac/1251835" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
            aria-label="Advertisement Link"
          />
        </div>
      </div>

      <footer className="py-5 bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300">
        <div className="container mx-auto px-6">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row md:justify-between text-center md:text-left space-y-5 md:space-y-0">
           

            <div>
              <h5 className="text-lg font-semibold text-white mb-4 font-montserrat">Legal</h5>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="block justify-center md:justify-start">
              <h5 className="text-lg font-semibold mb-4 font-montserrat">Contact Us</h5>
              <p className="text-gray-300 mb-4 flex items-center gap-2 font-lato">
                <FaMapMarkerAlt className="text-xl text-red-400" />
                Ejisu, Kumasi-Accra Road Ghana
              </p>
              <p className="text-gray-300 mb-4 flex items-center gap-2 font-lato">
                <FaEnvelope className="text-xl text-gray-200" />
                support@castsure.vote
              </p>
              
              <p className="text-gray-300 mb-4 flex items-center gap-2 font-lato">
                <FaWhatsapp className="text-green-500 text-xl" />
                +233595603554
              </p>
            </div>

            {/* Social Media */}
            <div>
              <h5 className="text-lg font-semibold mb-4 font-montserrat">Connect With Developer</h5>
              <div className="flex justify-center md:justify-start space-x-4">
                <a
                  href="https://instagram.com/castsure/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 transition-colors"
                  aria-label="Follow us on Instagram"
                >
                  <FaInstagram className="text-2xl hover:scale-110 transition-transform" />
                </a>
                <a
                  href="https://twitter.com/castsure/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 transition-colors"
                  aria-label="Follow us on Twitter"
                >
                  <FaTwitter className="text-2xl hover:scale-110 transition-transform" />
                </a>
                <a
                  href="https://linkedin.com/company/castsure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500 transition-colors"
                >
                  <FaLinkedinIn className="text-2xl text-blue-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-10 border-t border-gray-800 pt-6 text-center">
            <p className="text-sm text-gray-400 font-lato">
              &copy; {new Date().getFullYear()} Cast Sure. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-2 font-lato">
              Secure Digital Voting & Poll Management Platform
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
