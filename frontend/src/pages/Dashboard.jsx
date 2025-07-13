import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("GitHub User:", data);
          setUserData(data);
        })
        .catch((err) => {
          console.error("Failed to fetch GitHub user", err);
        });
    }
  }, [location.search]);

  if (!userData) return <div>Loading GitHub profile...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Welcome, {userData.login} 👋</h1>
      <img src={userData.avatar_url} alt="Avatar" width="100" className="rounded-full my-2" />
      <p>
        GitHub:{" "}
        <a href={userData.html_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          {userData.html_url}
        </a>
      </p>
    </div>
  );
}

export default Dashboard;

