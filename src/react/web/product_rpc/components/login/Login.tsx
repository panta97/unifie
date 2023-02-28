import React, { useState } from "react";
import { FetchStatus } from "../../types/fetch";
import { Loader } from "../shared/Loader";

interface LoginProps {
  setToken: (userToken: string) => void;
}

export const Login = ({ setToken }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(FetchStatus.IDLE);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFetchStatus(FetchStatus.LOADING);
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    const response = await fetch("login", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    if (result.token) {
      setFetchStatus(FetchStatus.IDLE);
      setToken(result.token);
    } else {
      setFetchStatus(FetchStatus.IDLE);
      alert(result.message);
    }
  };

  return (
    <div className="flex justify-center items-center bg-gray-200 text-gray-800 w-screen h-screen">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col border rounded-md bg-white p-4">
          <div className="inline-flex flex-col mb-2">
            <label htmlFor="email" className="text-xs">
              Usuario
            </label>
            <input
              className="border border-gray-300 rounded text w-52 px-1"
              type="email"
              id="email"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="inline-flex flex-col mb-2">
            <label htmlFor="password" className="text-xs">
              Contraseña
            </label>
            <input
              className="border border-gray-300 rounded text w-52 px-1"
              type="password"
              id="password"
              autoComplete="on"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button className="text-xs border rounded px-2 py-1">
              Ingresar
            </button>
          </div>
        </div>
      </form>
      <Loader fetchStatus={fetchStatus} portal={true} />
    </div>
  );
};
