"use client";

import { FormInput } from "@/components";
import { printPKWT } from "@/components/pdfutils/pkwt/PKWTStandar";
import { FilterData } from "@/components/utils/CompUtils";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import { IActionTable, IPageProps, UserType } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  BankOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  SaveOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Cabang, Role, Sumdan, User } from "@prisma/client";
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Table,
  TableProps,
  Tag,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [upsert, setUpsert] = useState<IActionTable<UserType>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [pageProps, setPageProps] = useState<IPageProps<UserType>>({
    page: 1,
    limit: 10,
    total: 0,
    data: [],
    search: "",
    roleId: "",
    pkwt_status: "",
    position: "",
    sumdanId: "",
  });
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [cabangs, setCabangs] = useState<Cabang[]>([]);
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/master/users");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.roleId) params.append("roleId", pageProps.roleId);
    if (pageProps.pkwt_status)
      params.append("pkwt_status", pageProps.pkwt_status);
    if (pageProps.position) params.append("position", pageProps.position);
    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);

    const res = await fetch(`/api/user?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [
    pageProps.page,
    pageProps.limit,
    pageProps.search,
    pageProps.roleId,
    pageProps.pkwt_status,
    pageProps.position,
    pageProps.sumdanId,
  ]);

  const handleResetFilters = () => {
    setPageProps((prev) => ({
      ...prev,
      page: 1,
      roleId: "",
      pkwt_status: "",
      position: "",
      sumdanId: "",
    }));
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/roles");
      const resJson = await res.json();
      setRoles(resJson.data);
      const resC = await fetch("/api/unit");
      const resCJson = await resC.json();
      setCabangs(resCJson.data);
      const resS = await fetch("/api/sumdan");
      const resSJson = await resS.json();
      setSumdans(resSJson.data);
    })();
  }, []);

  const columns: TableProps<UserType>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Nama Lengkap",
      dataIndex: "fullname",
      key: "fullname",
      sorter: (a, b) => a.fullname.localeCompare(b.fullname),
      render(value, record, index) {
        return (
          <div>
            <p>{record.fullname}</p>
            <div className="text-xs text-blue-400">
              @{record.username}
              <div>NIK: {record.nik}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Kontak",
      dataIndex: "kontak",
      key: "kontak",
      render(value, record, index) {
        return (
          <div className="text-xs text-blue-400">
            <div>
              <MailOutlined /> {record.email}
            </div>
            <div>
              <PhoneOutlined /> {record.phone}
            </div>
            <div>
              <Tag color={"blue"}>{record.Role.name}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Unit Pelayanan",
      dataIndex: "tambahan",
      key: "tambahan",
      sorter: (a, b) => a.fullname.localeCompare(b.fullname),
      render(value, record, index) {
        return (
          <div>
            <Tag color={"blue"}>{record.position}</Tag>
            <div className="text-xs text-blue-400">
              <div>
                <EnvironmentOutlined /> {record.Cabang.name}
              </div>
              {record.Sumdan && (
                <div>
                  <BankOutlined /> {record.Sumdan.name}
                </div>
              )}
              {record.target && (
                <div>
                  <DollarCircleOutlined /> Target: {IDRFormat(record.target)}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "PKWT Status",
      dataIndex: "expiredAt",
      render: (_, record) => (
        <div className="flex gap-2">
          <div>
            <div className="font-bold">{record.pkwt_status}</div>
            <div className="text-xs opacity-80">
              {moment(record.start_pkwt).format("DD/MM/YYYY")}
            </div>
            <div className="text-xs opacity-80">
              {moment(record.end_pkwt).format("DD/MM/YYYY")}
            </div>
          </div>
          {record.end_pkwt && (
            <div className="border rounded p-2">
              <CountdownCell date={record.end_pkwt.toString()} />
            </div>
          )}
        </div>
      ),
      shouldCellUpdate: () => false,
    },
    {
      title: "NIP & Salary",
      dataIndex: "salary",
      key: "salary",
      render(value, record, index) {
        return (
          <div className="text-xs text-blue-400">
            <div>NIP: {record.nip}</div>
            <div>Salary: {IDRFormat(record.salary)}</div>
            <div>T_Transport: {IDRFormat(record.t_transport)}</div>
          </div>
        );
      },
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => moment(date).format("DD-MM-YYYY"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          {hasAccess("write") && (
            <Button
              icon={<PrinterOutlined />}
              onClick={() => printPKWT(record)}
              size="small"
              type="primary"
            ></Button>
          )}
          {hasAccess("update") && (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, upsert: true, selected: record })
              }
              size="small"
              type="primary"
            ></Button>
          )}
          {hasAccess("delete") && (
            <Button
              icon={<DeleteOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, delete: true, selected: record })
              }
              size="small"
              type="primary"
              danger
            ></Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <UserOutlined /> Users Management
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {hasAccess("write") && (
            <Button
              size="middle"
              type="primary"
              icon={<PlusCircleOutlined />}
              className="app-master-action"
              onClick={() =>
                setUpsert({ ...upsert, upsert: true, selected: undefined })
              }
            >
              Add User
            </Button>
          )}
          <FilterData
            buttonSize="middle"
            buttonClassName="app-master-action"
            bodyClassName="space-y-4"
            children={
              <>
                <div className="app-report-panel space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Filter utama
                      </p>
                    </div>
                    <Button size="small" onClick={handleResetFilters}>
                      Reset
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Role User
                      </p>
                      <Select
                        className="app-master-select"
                        style={{ width: "100%" }}
                        options={roles.map((r) => ({
                          label: r.name,
                          value: r.id,
                        }))}
                        value={pageProps.roleId || undefined}
                        onChange={(e) =>
                          setPageProps((prev) => ({
                            ...prev,
                            page: 1,
                            roleId: e || "",
                          }))
                        }
                        placeholder="Pilih role user"
                        size="middle"
                        allowClear
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Status PKWT
                      </p>
                      <Select
                        className="app-master-select"
                        style={{ width: "100%" }}
                        options={[
                          { label: "TIERING", value: "TIERING" },
                          { label: "BARU", value: "BARU" },
                          { label: "LANJUT", value: "LANJUT" },
                          { label: "TETAP", value: "TETAP" },
                        ]}
                        value={pageProps.pkwt_status || undefined}
                        onChange={(e) =>
                          setPageProps((prev) => ({
                            ...prev,
                            page: 1,
                            pkwt_status: e || "",
                          }))
                        }
                        placeholder="Pilih status PKWT"
                        size="middle"
                        allowClear
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Posisi
                      </p>
                      <Select
                        className="app-master-select"
                        style={{ width: "100%" }}
                        options={[
                          { label: "MOC", value: "MOC" },
                          { label: "SPV", value: "SPV" },
                          { label: "KORWIL", value: "KORWIL" },
                          { label: "ADMIN", value: "ADMIN" },
                          {
                            label: "KEPALA OPERASIONAL",
                            value: "KEPALA OPERASIONAL",
                          },
                          {
                            label: "STAFF OPERASIONAL",
                            value: "STAFF OPERASIONAL",
                          },
                          { label: "KEPALA BISNIS", value: "KEPALA BISNIS" },
                          { label: "STAFF BISNIS", value: "STAFF BISNIS" },
                          {
                            label: "MANAJER KEUANGAN",
                            value: "MANAJER KEUANGAN",
                          },
                          { label: "STAFF KEUANGAN", value: "STAFF KEUANGAN" },
                          {
                            label: "KEPALA VERIFIKASI",
                            value: "KEPALA VERIFIKASI",
                          },
                          {
                            label: "STAFF VERIFIKASI",
                            value: "STAFF VERIFIKASI",
                          },
                          { label: "KEPALA DOKUMEN", value: "KEPALA DOKUMEN" },
                          { label: "STAFF DOKUMEN", value: "STAFF DOKUMEN" },
                          { label: "KEPALA IT", value: "KEPALA IT" },
                          { label: "STAFF IT", value: "STAFF IT" },
                          { label: "FUNDING", value: "FUNDING" },
                          {
                            label: "GENERAL AFFAIRS",
                            value: "GENERAL AFFAIRS",
                          },
                        ]}
                        value={pageProps.position || undefined}
                        onChange={(e) =>
                          setPageProps((prev) => ({
                            ...prev,
                            page: 1,
                            position: e || "",
                          }))
                        }
                        placeholder="Pilih posisi user"
                        size="middle"
                        allowClear
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Mitra
                      </p>
                      <Select
                        className="app-master-select"
                        style={{ width: "100%" }}
                        options={sumdans.map((s) => ({
                          label: `${s.code} - ${s.name}`,
                          value: s.id,
                        }))}
                        value={pageProps.sumdanId || undefined}
                        onChange={(e) =>
                          setPageProps((prev) => ({
                            ...prev,
                            page: 1,
                            sumdanId: e || "",
                          }))
                        }
                        placeholder="Pilih mitra pembiayaan"
                        size="middle"
                        allowClear
                      />
                    </div>
                  </div>
                </div>
              </>
            }
          />
        </div>
        <div className="app-master-toolbar-search flex justify-end">
          <Input
            size="middle"
            className="app-master-search"
            placeholder="Cari user..."
            prefix={<SearchOutlined className="text-slate-400" />}
            allowClear
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
        </div>
      </div>

      <Table
        className="app-master-table"
        columns={columns}
        dataSource={pageProps.data}
        size="middle"
        loading={loading}
        rowKey={"id"}
        pagination={{
          current: pageProps.page,
          pageSize: pageProps.limit,
          total: pageProps.total,
          onChange: (page, pageSize) => {
            setPageProps((prev) => ({
              ...prev,
              page,
              limit: pageSize,
            }));
          },
          pageSizeOptions: [50, 100, 500, 1000],
        }}
      />
      <UpsertUser
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        modal={modal}
        roles={roles}
        cabangs={cabangs}
        sumdans={sumdans}
        key={upsert.selected ? "upsert" + upsert.selected.id : "create"}
      />
      <DeleteUser
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        record={upsert.selected}
        key={upsert.selected ? "delete" + upsert.selected.id : "delete"}
        modal={modal}
      />
    </Card>
  );
}

function UpsertUser({
  record,
  open,
  setOpen,
  getData,
  modal,
  roles,
  cabangs,
  sumdans,
}: {
  record?: User;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
  roles: Role[];
  cabangs: Cabang[];
  sumdans: Sumdan[];
}) {
  const [data, setData] = useState(record ? record : defaultUser);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    if ("Cabang" in data) {
      delete data.Cabang;
    }
    if ("Role" in data) {
      delete data.Role;
    }
    if ("Sumdan" in data) {
      delete data.Sumdan;
    }
    await fetch("/api/user", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: `Data berhasil ${record ? "di Update" : "ditambahkan"}!`,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          modal.error({
            title: "ERROR",
            content: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      title={record ? "Update User " + record.fullname : "Add New User"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
      style={{ top: 20 }}
      width={1200}
    >
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 flex flex-col gap-3">
          <div className="hidden">
            <FormInput
              data={{
                label: "USER ID",
                mode: "horizontal",
                type: "text",
                value: data.id,
                onChange: (e: string) => setData({ ...data, id: e }),
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Role User",
              mode: "horizontal",
              required: true,
              type: "select",
              value: data.roleId,
              onChange: (e: string) => setData({ ...data, roleId: e }),
              options: roles.map((r) => ({ label: r.name, value: r.id })),
            }}
          />
          <FormInput
            data={{
              label: "Cabang",
              mode: "horizontal",
              required: true,
              type: "select",
              value: data.cabangId,
              onChange: (e: string) => setData({ ...data, cabangId: e }),
              options: cabangs.map((r) => ({ label: r.name, value: r.id })),
            }}
          />
          <FormInput
            data={{
              label: "Mitra",
              mode: "horizontal",
              type: "select",
              value: data.sumdanId,
              onChange: (e: string) => setData({ ...data, sumdanId: e }),
              options: sumdans.map((r) => ({ label: r.name, value: r.id })),
            }}
          />
          <FormInput
            data={{
              label: "Nama Lengkap",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.fullname,
              onChange: (e: string) => setData({ ...data, fullname: e }),
            }}
          />
          <FormInput
            data={{
              label: "Nomor NIK",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.nik,
              onChange: (e: string) => setData({ ...data, nik: e }),
            }}
          />
          <FormInput
            data={{
              label: "Username",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.username,
              onChange: (e: string) => setData({ ...data, username: e }),
            }}
          />
          <FormInput
            data={{
              label: "Email",
              mode: "horizontal",
              type: "text",
              value: data.email,
              onChange: (e: string) => setData({ ...data, email: e }),
            }}
          />
          <FormInput
            data={{
              label: "Password",
              mode: "horizontal",
              type: "password",
              required: true,
              value: data.password,
              onChange: (e: string) => setData({ ...data, password: e }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <FormInput
            data={{
              label: "No Telepon",
              mode: "horizontal",
              type: "text",
              value: data.phone,
              onChange: (e: string) => setData({ ...data, phone: e }),
            }}
          />
          <FormInput
            data={{
              label: "Posisi",
              mode: "horizontal",
              type: "select",
              value: data.position,
              onChange: (e: string) => setData({ ...data, position: e }),
              options: [
                { label: "MOC", value: "MOC" },
                { label: "SPV", value: "SPV" },
                { label: "KORWIL", value: "KORWIL" },
                { label: "ADMIN", value: "ADMIN" },
                { label: "KEPALA OPERASIONAL", value: "KEPALA OPERASIONAL" },
                { label: "STAFF OPERASIONAL", value: "STAFF OPERASIONAL" },
                { label: "KEPALA BISNIS", value: "KEPALA BISNIS" },
                { label: "STAFF BISNIS", value: "STAFF BISNIS" },
                { label: "MANAJER KEUANGAN", value: "MANAJER KEUANGAN" },
                { label: "STAFF KEUANGAN", value: "STAFF KEUANGAN" },
                { label: "KEPALA VERIFIKASI", value: "KEPALA VERIFIKASI" },
                { label: "STAFF VERIFIKASI", value: "STAFF VERIFIKASI" },
                { label: "KEPALA DOKUMEN", value: "KEPALA DOKUMEN" },
                { label: "STAFF DOKUMEN", value: "STAFF DOKUMEN" },
                { label: "KEPALA IT", value: "KEPALA IT" },
                { label: "STAFF IT", value: "STAFF IT" },
                { label: "FUNDING", value: "FUNDING" },
                { label: "GENERAL AFFAIRS", value: "GENERAL AFFAIRS" },
              ],
            }}
          />
          <FormInput
            data={{
              label: "Salary",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.salary),
              onChange: (e: string) =>
                setData({ ...data, salary: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Tunj Transport",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.t_transport),
              onChange: (e: string) =>
                setData({ ...data, t_transport: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Target Perbulan",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.target),
              onChange: (e: string) =>
                setData({ ...data, target: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Status PKWT",
              mode: "horizontal",
              type: "select",
              options: [
                { label: "TIERING", value: "TIERING" },
                { label: "BARU", value: "BARU" },
                { label: "LANJUT", value: "LANJUT" },
                { label: "TETAP", value: "TETAP" },
              ],
              value: data.pkwt_status,
              onChange: (e: string) => setData({ ...data, pkwt_status: e }),
            }}
          />
          <FormInput
            data={{
              label: "Awal PKWT",
              mode: "horizontal",
              type: "date",
              value: moment(data.start_pkwt).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({ ...data, start_pkwt: new Date(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Akhir PKWT",
              mode: "horizontal",
              type: "date",
              value: moment(data.end_pkwt).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({ ...data, end_pkwt: new Date(e) }),
            }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          icon={<SaveOutlined />}
          type="primary"
          onClick={() => handleSave()}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
}

export function DeleteUser({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: User;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/user?id=${record?.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          modal.success({
            title: "SUCCESS",
            content: data.msg,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          modal.error({
            title: "ERROR",
            content: data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };
  return (
    <Modal
      loading={loading}
      footer={[]}
      open={open}
      onCancel={() => setOpen(false)}
      width={400}
      style={{ top: 20 }}
      title={"Delete User " + record?.fullname}
    >
      <p>Are you sure you want to delete this user?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultUser: User = {
  id: "",
  fullname: "",
  username: "",
  email: null,
  phone: null,
  address: null,
  password: "",
  cabangId: "",
  roleId: "",
  sumdanId: null,
  nip: "",
  target: 0,
  position: null,
  start_pkwt: new Date(),
  end_pkwt: new Date(),
  pkwt_status: "BARU",
  nik: null,
  salary: 0,
  t_transport: 0,
  t_position: 0,
  ptkp: null,

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};

export function CountdownCell({ date }: { date: string }) {
  const [now, setNow] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const deadline = moment(date); // pastikan format benar
  const diffDays = deadline.diff(now, "days");

  const days = Math.max(diffDays, 0);

  let color = "#1677ff";
  if (diffDays <= 7) color = "#ff4d4f";
  else if (diffDays <= 30) color = "#faad14";

  return (
    <div style={{ color, fontWeight: 600 }} className="text-center">
      <div>{days} </div>
      <div>hari</div>
    </div>
  );
}
