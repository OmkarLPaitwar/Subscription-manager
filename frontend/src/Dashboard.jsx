function Dashboard() {
  const token = localStorage.getItem("token");

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Dashboard</h1>
      <p>You are logged in ✅</p>
      <p>Token:</p>
      <textarea
        value={token}
        readOnly
        rows={5}
        cols={50}
      />
    </div>
  );
}

export default Dashboard;
