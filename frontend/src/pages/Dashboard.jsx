import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const location = useLocation();

  const token = new URLSearchParams(location.search).get("token");

  // Fetch GitHub user profile
  useEffect(() => {
    if (token) {
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setUserData)
        .catch((err) => console.error("Failed to fetch GitHub user", err));
    }
  }, [token]);

  // Fetch user's repos
  useEffect(() => {
    if (token) {
      fetch("https://api.github.com/user/repos", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then(setRepos)
        .catch((err) => console.error("Failed to fetch repos", err));
    }
  }, [token]);

  // Handle repo selection
  const handleSelect = (repoFullName) => {
    fetch("http://18.232.78.86:3000/api/setup-cicd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, repoFullName }),
    })
      .then((res) => res.json())
      .then((data) => alert(data.message))
      .catch((err) => alert("Failed to setup CI/CD"));
  };

  if (!userData) return <div>Loading GitHub profile...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {userData.login} 👋</h1>
      <img
        src={userData.avatar_url}
        alt="Avatar"
        width="100"
        className="rounded-full mb-4"
      />
      <p className="mb-6">
        GitHub:{" "}
        <a
          href={userData.html_url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          {userData.html_url}
        </a>
      </p>

      <h2 className="text-xl font-semibold mb-2">Your Repositories:</h2>
      {repos.length === 0 ? (
        <p>No repositories found.</p>
      ) : (
        <ul className="space-y-2">
          {repos.map((repo) => (
            <li key={repo.id}>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => handleSelect(repo.full_name)}
              >
                🚀 Setup CI/CD for: {repo.full_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
