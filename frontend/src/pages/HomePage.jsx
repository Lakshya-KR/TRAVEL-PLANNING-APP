import React from "react";
import { ArrowRight } from "lucide-react"; // Optional, for arrow icon
import { MapPin } from "lucide-react";  
// import Image from "/img/explore-beach.jpg";
import { useNavigate } from "react-router-dom"; 


const destinations = [
  { name: "Croatia", image: "/img/home-trees.jpg" },
  { name: "Iceland", image: "/img/home-lake.jpg" },
  { name: "Italy", image: "/img/home-mountain.jpg" },
  { name: "Spain", image: "/img/home-beach.jpg" },
];



const HomePage = () => {
  const navigate = useNavigate(); 

  // make a function to handle the button click
  const handleButtonClick = () => {
    navigate('/destination'); // navigate to the destinations page
    alert("Let's start planning your trip!"); // show an alert when the button is clicked

  };
  return (
    <>  
    <div className="relative min-h-screen bg-black text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="./img/home-bg.jpg"
          alt="Forest background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-50" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 px-8 py-12 flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Navbar */}
        <nav className="flex justify-between items-center mb-10">
          <h1 className="text-lg font-semibold">WHEEL AND WANDERS</h1>
          <ul className="flex gap-8 text-sm font-medium">
            <li className="border-b-2 border-white">Home</li>
            <li className="hover:opacity-80 cursor-pointer">About</li>
            <li className="hover:opacity-80 cursor-pointer">Popular</li>
            <li className="hover:opacity-80 cursor-pointer">Explore</li>
          </ul>
        </nav>

        {/* Main Text */}
        <div>
          <h2 className="text-xl font-light">Welcome To WHEEL AND WANDERS</h2>
          <h1 className="text-6xl font-bold leading-tight mt-2">
            Explore <br /> The World
          </h1>
          <p className="mt-4 max-w-md text-sm text-gray-300">
            Live the trips exploring the world, discover paradises, islands,
            mountains and much more, get your trip now.
          </p>
        </div>

        {/* Destination Cards */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {destinations.map((dest) => (
            <div
              key={dest.name}
              className="relative rounded overflow-hidden shadow-md group cursor-pointer"
            >
              <img
                src={dest.image}
                alt={dest.name}
                className="h-40 w-full object-cover transform group-hover:scale-105 transition duration-300"
              />
              <div className="absolute bottom-2 left-2 text-white font-semibold drop-shadow-lg">
                {dest.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
     <section className="bg-black text-white py-16 px-6">
     <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-10">
       {/* Text Content */}
       <div>
         <h2 className="text-4xl font-bold mb-4 leading-tight">
           Learn More <br /> About WHEEL AND WANDERS
         </h2>
         <p className="text-gray-300 mb-8 max-w-md">
           All the trips around the world are a great pleasure and happiness for anyone, enjoy the sights when you travel the world. Travel safely and without worries, get your trip and explore the paradises of the world.
         </p>
         <button className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 flex items-center gap-2 transition rounded">
           Explore WHEEL AND WANDERS
           <ArrowRight size={18} />
         </button>
       </div>

       {/* Image */}
       <div className="w-full h-full">
         <img
           src="img/about-beach.jpg" // Replace with your actual path
           alt="Travel destination"
           className="w-full h-auto object-cover hover:scale-105 transition duration-300 rounded-lg shadow-lg"
         />
       </div>
     </div>
   </section>
   <section className="bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">
          Enjoy The Beauty <br /> Of The World
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Logan Mountain */}
          <div className="space-y-3">
            <img
              src="/img/popular-mountain.jpg"
              alt="Logan Mountain"  
              className="w-full h-[20rem]  object-cover rounded-lg shadow-md"
            />
            <h3 className="text-xl font-semibold">Logan Mountain</h3>
            <div className="flex items-center justify-center text-gray-400">
              <MapPin size={16} className="mr-1" />
              <span>Canadá</span>
            </div>
          </div>

          {/* Spike Forest */}
          <div className="space-y-3">
            <img
              src="/img/popular-forest.jpg"
              alt="Spike Forest"
              className="w-full h-[20rem]  object-cover rounded-lg shadow-md"
            />
            <h3 className="text-xl font-semibold">Spike Forest</h3>
            <div className="flex items-center justify-center text-gray-400">
              <MapPin size={16} className="mr-1" />
              <span>Irland</span>
            </div>
          </div>

          {/* Garda Lake */}
          <div className="space-y-3">
            <img
              src="/img/popular-lake.jpg"
              alt="Garda Lake"
              className="w-full h-[20rem] object-cover rounded-lg shadow-md"
            />
            <h3 className="text-xl font-semibold">Garda Lake</h3>
            <div className="flex items-center justify-center text-gray-400">
              <MapPin size={16} className="mr-1" />
              <span>Italy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section
      className="relative h-[80vh] bg-cover bg-center flex items-end"
      style={{
        backgroundImage: `url('/img/explore-beach.jpg')`, // <- make sure this image is in your public folder
      }}
    >
      <div className="bg-gradient-to-t from-black/80 to-transparent w-full p-8 sm:p-16 text-white">
        <div className="max-w-4xl">
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
            Explore The <br /> Best Paradises
          </h2>
          <p className="text-gray-300 text-base sm:text-lg mb-6">
            Exploring paradises such as islands and valleys when traveling the world is one of the greatest experiences when you travel, it offers you harmony and peace and you can enjoy it with great comfort.
          </p>
          <div className="flex items-center gap-3">
            <img
              src="/images/paul.jpg" // make sure to put this avatar image in /public/images/
              alt="Paul Jeams"
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="text-sm sm:text-base">Paul Jeams</span>
          </div>
        </div>
      </div>
    </section>
    <div className="bg-black text-white">
      {/* Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 md:gap-5 items-center">
        <img
          src="/img/join-island.jpg" // make sure this image exists in /public/images
          alt="Paradise"
          className="w-[26rem] h-[25rem] rounded-md"
        />
        <div>
          <h2 className="text-4xl font-bold mb-4">Your Journey Starts Here</h2>
          <p className="text-gray-300 mb-6">
            Get up to date with the latest travel and information from us.
          </p>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-3 mb-4 bg-gray-900 text-white placeholder:text-gray-500 rounded-md focus:outline-none"
          />
          <button className="w-full p-3 mb-2 bg-white hover:bg-black hover:border-2 hover:text-white text-black font-semibold flex items-center justify-center gap-2 rounded-md transition">
            Subscribe to us <ArrowRight size={18} />
          </button>
          <button onClick={handleButtonClick} className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold flex items-center justify-center gap-2 rounded-md transition">
            START PLANNING YOUR TRIP NOW<ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] px-4 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10 text-sm">
          <div>
            <h3 className="text-white font-semibold text-lg mb-3">Travel</h3>
            <p className="text-gray-400">
              Travel with us and explore the world without limits.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">About</h3>
            <ul className="space-y-2 text-gray-400">
              <li>About Us</li>
              <li>Features</li>
              <li>News & Blog</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li>FAQs</li>
              <li>History</li>
              <li>Testimonials</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Contact</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Call Center</li>
              <li>Support Center</li>
              <li>Contact Us</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Privacy Policy</li>
              <li>Terms & Services</li>
              <li>Payments</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};

export default HomePage;