import React, { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import { updateSecurity } from "../../app/slice/security/securitySlice";
import { mockPassword } from "../../data/data";

export const Login = () => {
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password === mockPassword) {
      dispatch(
        updateSecurity({ isLocked: false, lockedSince: new Date().getTime() })
      );
    } else {
      alert("wrong password!!");
      setPassword("");
    }
  };

  return (
    <div className="flex justify-center items-center bg-white text-gray-800 w-screen h-screen">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col border border-black rounded-md bg-white p-4">
          <div className="inline-flex flex-col mb-2">
            <label htmlFor="password" className="text-xs">
              Contraseña
            </label>
            <input
              className="border border-black rounded text w-52 px-1"
              type="password"
              id="password"
              autoComplete="off"
              value={password}
              onChange={handlePassword}
            />
          </div>
          <div className="flex justify-end">
            <button className="text-xs border border-black rounded px-2 py-1">
              Ingresar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
