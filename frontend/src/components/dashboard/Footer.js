
import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white text-center py-4 mt-6 fixed bottom-0 left-0">
      <p className="text-sm">© {new Date().getFullYear()} iTutor</p>
    </footer>
  );
};

export default Footer;