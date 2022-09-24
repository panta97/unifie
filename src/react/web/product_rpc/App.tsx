import "./App.css";
import { Login } from "./components/login/Login";
import { Navbar } from "./components/shared/Navbar";
import { useToken } from "./hooks/useToken";

function App() {
  // const { token, setToken } = useToken();
  // if (!token) return <Login setToken={setToken} />;
  return (
    <div>
      <Navbar />
    </div>
  );
}

export default App;
