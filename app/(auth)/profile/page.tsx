"use client";

import { FormInput } from "@/components";
import { useUser } from "@/components/UserContext";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { SettingOutlined, UserOutlined } from "@ant-design/icons";
import { App, Button, Card, Typography } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
const { Title } = Typography;
export default function Page() {
  const user = useUser();
  const [data, setData] = useState<any>(user);
  const [loading, setLoading] = useState(false);
  const [dataPass, setDataPass] = useState({
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { modal } = App.useApp();

  useEffect(() => {
    if (user) {
      setData(user);
    }
  }, [user]);

  const handleProfile = async () => {
    if (!data.fullname || !data.username) {
      return modal.error({
        title: "ERROR!",
        content: "Mohon lengkapi label berbintang terlebih dahulu!!",
      });
    }
    if ("sumdan" in data) {
      delete data.sumdan;
    }
    if ("cabang" in data) {
      delete data.cabang;
    }
    if ("area" in data) {
      delete data.area;
    }
    if ("Role" in data) {
      delete data.Role;
    }
    setLoading(true);
    await fetch("/api/user", {
      method: "PUT",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          modal.success({
            title: "Berhasil",
            content: "Update profile berhasil!",
          });
          // window && window.location.reload();
        } else {
          modal.error({
            title: "ERROR!",
            content: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR!",
          content: "Internal Server Error!!",
        });
      });
    setLoading(false);
  };

  const handlePassword = async () => {
    if (
      !dataPass.password ||
      !dataPass.newPassword ||
      !dataPass.confirmPassword ||
      dataPass.newPassword !== dataPass.confirmPassword
    ) {
      return modal.error({
        title: "ERROR!",
        content: "Mohon lengkapi label berbintang terlebih dahulu!!",
      });
    }
    setLoading(true);
    await fetch("/api/user", {
      method: "PATCH",
      body: JSON.stringify({ id: user?.id, ...dataPass }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          modal.success({
            title: "Berhasil",
            content: "Password berhasil diperbarui!",
          });
        } else {
          modal.error({
            title: "ERROR!",
            content: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR!",
          content: "Internal Server Error!!",
        });
      });
    setLoading(false);
  };

  return (
    <div>
      <Card className="shadow-sm">
        <Title level={4}>
          <UserOutlined /> Pengaturan Profil
        </Title>
        <div className="my-4 flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <FormInput
              data={{
                label: "Nama Lengkap",
                type: "text",
                required: true,
                value: data?.fullname,
                onChange: (val: string) => setData({ ...data, fullname: val }),
              }}
            />
            {user && !user.sumdanId && (
              <FormInput
                data={{
                  label: "NIP",
                  type: "text",
                  disabled: true,
                  required: true,
                  value: data.nip,
                }}
              />
            )}
            <FormInput
              data={{
                label: "Username",
                type: "text",
                disabled: true,
                required: true,
                value: data?.username,
              }}
            />
            <FormInput
              data={{
                label: "Email",
                type: "text",
                value: data?.email,
                onChange: (val: string) => setData({ ...data, email: val }),
              }}
            />
            <FormInput
              data={{
                label: "No Telepon",
                type: "text",
                value: data?.phone,
                onChange: (val: string) => setData({ ...data, phone: val }),
              }}
            />
            <FormInput
              data={{
                label: "Alamat / Lokasi",
                type: "textarea",
                value: data?.address,
                onChange: (val: string) => setData({ ...data, address: val }),
              }}
            />
            {user && !user.sumdanId && (
              <FormInput
                data={{
                  label: "Target",
                  type: "text",
                  disabled: true,
                  value: IDRFormat(data?.target || 0),
                }}
              />
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <FormInput
              data={{
                label: "Posisi",
                type: "text",
                disabled: true,
                value: `${data?.position || ""}`,
              }}
            />
            {user && !user.sumdanId && (
              <FormInput
                data={{
                  label: "Cabang",
                  type: "text",
                  disabled: true,
                  value: `${data?.cabang} | ${user.area}`,
                }}
              />
            )}
            <FormInput
              data={{
                label: "Role",
                type: "text",
                disabled: true,
                value: data?.Role?.name,
              }}
            />
            <FormInput
              data={{
                label: "Nama Mitra",
                type: "text",
                disabled: true,
                value: data?.sumdan,
              }}
            />
            <FormInput
              data={{
                label: "Created At",
                type: "text",
                disabled: true,
                value: moment(data.created_at).format("DD/MM/YYYY"),
              }}
            />
            <FormInput
              data={{
                label: "Updated at",
                type: "text",
                disabled: true,
                value: moment(data.updated_at).format("DD/MM/YYYY HH:mm"),
              }}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="primary"
            loading={loading}
            onClick={() => handleProfile()}
          >
            Submit
          </Button>
        </div>
      </Card>
      <div className="mt-2"></div>
      <Card className="shadow-sm">
        <Title level={4}>
          <SettingOutlined /> Ganti Password
        </Title>
        <div className="flex flex-col gap-2">
          <FormInput
            data={{
              label: "Password Lama",
              type: "password",
              required: true,
              value: dataPass.password,
              onChange: (val: string) =>
                setDataPass({ ...dataPass, password: val }),
            }}
          />
          <FormInput
            data={{
              label: "Password Baru",
              type: "password",
              required: true,
              value: dataPass.newPassword,
              onChange: (val: string) =>
                setDataPass({ ...dataPass, newPassword: val }),
            }}
          />
          <FormInput
            data={{
              label: "Konfirmasi Password",
              type: "password",
              required: true,
              value: dataPass.confirmPassword,
              onChange: (val: string) =>
                setDataPass({ ...dataPass, confirmPassword: val }),
            }}
          />
        </div>
        {dataPass.newPassword !== dataPass.confirmPassword && (
          <div className="text-xs italic text-red-500">
            <p>Confirm password tidak sesuai!</p>
          </div>
        )}
        <div className="flex justify-end">
          <Button
            type="primary"
            disabled={
              !dataPass.password ||
              !dataPass.newPassword ||
              !dataPass.confirmPassword ||
              dataPass.newPassword !== dataPass.confirmPassword
            }
            loading={loading}
            onClick={() => handlePassword()}
          >
            Submit
          </Button>
        </div>
      </Card>
    </div>
  );
}
