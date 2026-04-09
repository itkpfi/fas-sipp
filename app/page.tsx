"use client";

import { LoadingOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import moment from "moment";
import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const appLogoSrc = process.env.NEXT_PUBLIC_APP_LOGO || "/logsvg.svg";

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          window && window.location.replace("/dashboard");
        } else {
          setErr(res.msg);
        }
      })
      .catch((err) => {
        console.log(err);
        setErr("Internal Server Error");
      });
    setLoading(false);
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-8 md:py-8 lg:px-12">
      <div className="app-auth-shell mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl xl:grid-cols-[1.15fr_0.85fr]">
        <section className="relative flex items-center justify-center px-6 py-8 text-white md:px-10 md:py-10 xl:px-12 xl:py-12">
          <div className="relative z-10 flex w-full max-w-2xl flex-col items-center justify-center rounded-[32px] border border-white/14 bg-white/10 px-8 py-12 text-center shadow-[0_24px_60px_rgba(2,6,23,0.2)] backdrop-blur md:px-12 md:py-16">
            <img
              src={appLogoSrc}
              alt={`${process.env.NEXT_PUBLIC_APP_FULLNAME ?? "KOPJAS"} Logo`}
              className="h-20 w-auto md:h-24"
            />
            <h1 className="mt-8 text-3xl font-bold tracking-[-0.03em] text-white md:text-5xl">
              {process.env.NEXT_PUBLIC_APP_FULLNAME ?? "KOPJAS SJM"}
            </h1>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-white/86 p-6 md:p-10 xl:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-4 text-center">
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-950 md:text-[2.1rem]">
                  Masuk
                </h2>
              </div>
            </div>

            <div className="app-card space-y-5 p-6 md:p-7">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
                  Username
                </label>
                <Input
                  id="username"
                  size="large"
                  prefix={<UserOutlined className="text-slate-400" />}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  size="large"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="rememberMe" className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Ingat Saya
                </label>
              </div>

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs italic text-red-600">
                  {err}
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                className="!h-[52px] !rounded-[18px] !bg-[linear-gradient(135deg,#0f513f_0%,#178a6d_50%,#2563eb_100%)] !shadow-[0_18px_36px_rgba(15,81,63,0.22)]"
                onClick={() => handleSubmit()}
              >
                {loading ? <LoadingOutlined /> : null} Masuk
              </Button>
            </div>

            <div className="border-t border-slate-200 pt-5 text-center">
              <p className="text-xs text-slate-500">
                © {moment().format("YYYY")} {process.env.NEXT_PUBLIC_APP_FULLNAME ?? "SYREL"}. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
