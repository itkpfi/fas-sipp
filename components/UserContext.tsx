"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IUser } from "@/libs/IInterfaces";

const userContext = createContext<IUser | undefined>(undefined);
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser>();
  const pathname = usePathname();

  const getData = () => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          setUser({
            id: res.data.id,
            fullname: res.data.fullname,
            username: res.data.username,
            password: "",
            email: res.data.email,
            phone: res.data.phone,
            address: res.data.address,
            target: res.data.target,
            status: res.data.status,
            created_at: res.data.created_at,
            updated_at: res.data.updated_at,
            Role: res.data.Role,
            roleId: res.data.roleId,
            area: res.data.area,
            nip: res.data.nip,
            position: res.data.position,
            sumdan: res.data.sumdan,
            cabang: res.data.cabang,
            sumdanId: res.data.sumdanId || null,
            cabangId: res.data.cabangId,
            salary: res.data.salary,
            t_transport: res.data.t_transport,
            t_position: res.data.r_position,
            ptkp: res.data.ptkp,
            start_pkwt: res.data.start_pkwt,
            end_pkwt: res.data.end_pkwt,
            pkwt_status: res.data.pkwt_status,
            nik: res.data.nik,
            agentFrontingId: res.data.agentFrontingId,
            sPVRelationId: res.data.sPVRelationId,
          });
          if (pathname === "/") {
            window && window.location.replace("/dashboard");
          }
        } else {
          if (pathname !== "/") {
            window && window.location.replace("/");
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(() => {
    getData();
  }, []);

  return (
    <userContext.Provider value={user as IUser}>
      {children}
    </userContext.Provider>
  );
};

export const useUser = () => useContext(userContext);
