const ErrorState = ({ error }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      {error}
    </div>
  );
};

export default ErrorState;