import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DestinationSearch from './pages/DestinationSearch';
import PlaceDetails from './pages/PlaceDetails';
import DestinationDetails from './pages/DestinationDetails';
import ItineraryPage from './pages/ItineraryPage';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} /> 
          <Route path="/destination" element={<DestinationSearch />} />
          <Route path="/destination/:name" element={<DestinationDetails />} />
          <Route path="/generate-itinerary" element={<ItineraryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;