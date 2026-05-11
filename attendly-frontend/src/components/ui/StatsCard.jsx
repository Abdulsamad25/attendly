const StatsCard = ({ icon: Icon, label, value, trend, trendType }) => (
  <div className="bg-white hover:shadow-lg p-6 border border-gray-200 rounded-lg transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium text-gray-600 text-sm">{label}</p>
        <p className="mt-2 font-bold text-gray-900 text-3xl">{value}</p>
        {trend && (
          <p
            className={`text-sm mt-2 ${
              trendType === "positive"
                ? "text-emerald-600"
                : trendType === "negative"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
            {trend}
          </p>
        )}
      </div>
      <div
        className={`p-3 rounded-lg ${
          label === "Present"
            ? "bg-emerald-100 text-emerald-600"
            : label === "Late Arrivals"
              ? "bg-amber-100 text-amber-600"
              : label === "Absences"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600"
        }`}
      >
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default StatsCard;
