import { useSelector } from "react-redux";

const Dashboard = () => {
  const { admin } = useSelector(
    (state) => state.adminAuth
  );

  const cards = [
    {
      title: "Total Users",
      value: "0",
      icon: "👥",
    },
    {
      title: "Total Results",
      value: "0",
      icon: "📋",
    },
    {
      title: "Total Amount",
      value: "₹0",
      icon: "₹",
    },
    {
      title: "Today's Results",
      value: "0",
      icon: "📊",
    },
  ];

  return (
    <div>

      {/* Heading */}

      <div className="mb-8">

        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Welcome back,{" "}
          <span className="font-semibold text-slate-700">
            {admin?.name || "Admin"}
          </span>
        </p>

      </div>

      {/* Cards */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {card.value}
                </h2>

              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
                {card.icon}
              </div>

            </div>

          </div>
        ))}

      </div>

      {/* Welcome Section */}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-slate-900">
          Welcome to Admin Panel
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          From here you can manage users, results,
          amounts and other admin operations.
        </p>

      </div>

    </div>
  );
};

export default Dashboard;