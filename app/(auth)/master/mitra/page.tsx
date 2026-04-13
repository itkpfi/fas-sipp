"use client";

import { FormInput } from "@/components";
import {
  IDRFormat,
  IDRToNumber,
  serializeForApi,
} from "@/components/utils/PembiayaanUtil";
import { IActionTable, IPageProps } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  BankOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Angsuran, Dapem, ProdukPembiayaan, Sumdan } from "@prisma/client";
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  Progress,
  Table,
  TableProps,
  Typography,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;

interface IDapem extends Dapem {
  Angsuran: Angsuran[];
}
interface IProduk extends ProdukPembiayaan {
  Dapem: IDapem[];
}
interface ISumdan extends Sumdan {
  ProdukPembiayaan: IProduk[];
}

export default function Page() {
  const [upsert, setUpsert] = useState<IActionTable<ISumdan>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [pageProps, setPageProps] = useState<IPageProps<ISumdan>>({
    page: 1,
    limit: 10,
    total: 0,
    data: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/master/mitra");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("include", "true");
    if (pageProps.search) {
      params.append("search", pageProps.search);
    }
    const res = await fetch(`/api/sumdan?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: serializeForApi(json.data),
      total: json.total,
    }));
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit, pageProps.search]);

  const columns: TableProps<ISumdan>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Nama Mitra",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render(value, record, index) {
        return (
          <div>
            <p>{record.name}</p>
            <p className="text-xs font-medium text-slate-500">@{record.code}</p>
          </div>
        );
      },
    },
    {
      title: "Kontak",
      dataIndex: "code",
      key: "code",
      render(value, record, index) {
        return (
          <div>
            <div className="text-xs text-slate-500">
              <p>
                <EnvironmentOutlined /> {record.address}
              </p>
              <p>
                <PhoneOutlined /> {record.phone}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Kriteria",
      dataIndex: "rt",
      key: "rt",
      render(value, record, index) {
        return (
          <div>
            <div className="text-xs text-slate-500">
              <p>Rounded : {IDRFormat(record.rounded)}</p>
              <p>DSR : {IDRFormat(record.dsr)}</p>
              <p>TBO : {record.tbo} Bulan</p>
              <p>Limit : {IDRFormat(Number(record.limit))}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Biaya",
      dataIndex: "cost",
      key: "cost",
      render(value, record, index) {
        return (
          <div>
            <div className="text-xs text-slate-500">
              <p>Margin : {record.c_margin} %</p>
              <p>Admin : {record.c_adm} %</p>
              <p>Tatalaksana : {IDRFormat(record.c_gov)}</p>
              <p>Rekening : {IDRFormat(record.c_account)}</p>
              <p>Materai : {IDRFormat(record.c_stamps)}</p>
              <p>Data Informasi : {IDRFormat(record.c_information)}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Limit",
      dataIndex: "limit",
      key: "limit",
      render(value, record, index) {
        const total = record.ProdukPembiayaan.flatMap((d) => d.Dapem).reduce(
          (acc, curr) => acc + curr.plafond,
          0,
        );
        const os = record.ProdukPembiayaan.flatMap((d) =>
          d.Dapem.filter((dp) => dp.dropping_status === "APPROVED").flatMap(
            (dpa) => dpa.Angsuran,
          ),
        )
          .filter((a) => a.date_paid !== null)
          .sort((a, b) => b.counter - a.counter)[0].remaining;
        return (
          <div className="flex flex-col">
            <Progress
              percent={Number(
                ((total / Number(record.limit)) * 100).toFixed(2),
              )}
            />
            <div className="text-xs opacity-80">
              {IDRFormat(total)} | {IDRFormat(Number(record.limit))}
            </div>
            <div className="text-xs opacity-80 text-center">
              OS {IDRFormat(os)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      dataIndex: "desc",
      key: "desc",
      render(value, record, index) {
        return (
          <Paragraph
            ellipsis={{
              rows: 1,
              expandable: "collapsible",
            }}
            style={{ fontSize: 11, width: 150 }}
          >
            {record.description}
          </Paragraph>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
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
          <BankOutlined /> Mitra Pembiayaan
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
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
            Add New
          </Button>
        )}
        <div className="app-master-toolbar-search">
          <Input
            size="middle"
            className="app-master-search"
            placeholder="Cari nama..."
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
        expandable={{
          expandedRowRender: (record) => {
            return (
              <div className="ms-15">
                <TableProduk
                  records={record}
                  getData={getData}
                  modal={modal}
                  hasAccess={hasAccess}
                />
              </div>
            );
          },
        }}
      />
      <UpsertSumdan
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        modal={modal}
        key={upsert.selected ? "upsert" + upsert.selected.id : "create"}
      />
      <DeleteSumdan
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

function UpsertSumdan({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: ISumdan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [data, setData] = useState(record ? record : defaultSumdan);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { ProdukPembiayaan, ...saved } = data;
    await fetch("/api/sumdan", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(
        serializeForApi({ ...saved, limit: Number(saved.limit) }),
      ),
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
      title={record ? "Update Mitra " + record.name : "Add New Mitra"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
      width={1200}
      style={{ top: 10 }}
    >
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-1">
          <div className="hidden">
            <FormInput
              data={{
                label: "ID",
                mode: "horizontal",
                type: "text",
                value: data.id,
                onChange: (e: string) => setData({ ...data, id: e }),
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Nama Mitra",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.name,
              onChange: (e: string) => setData({ ...data, name: e }),
            }}
          />
          <FormInput
            data={{
              label: "Kode Mitra",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.code,
              onChange: (e: string) => setData({ ...data, code: e }),
            }}
          />
          <FormInput
            data={{
              label: "No Telepon",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.phone,
              onChange: (e: string) => setData({ ...data, phone: e }),
            }}
          />
          <FormInput
            data={{
              label: "Email",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.email,
              onChange: (e: string) => setData({ ...data, email: e }),
            }}
          />
          <FormInput
            data={{
              label: "Alamat",
              mode: "horizontal",
              required: true,
              type: "textarea",
              value: data.address,
              onChange: (e: string) => setData({ ...data, address: e }),
            }}
          />
          <FormInput
            data={{
              label: "No SK",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.sk_no,
              onChange: (e: string) => setData({ ...data, sk_no: e }),
            }}
          />
          <FormInput
            data={{
              label: "Tanggal SK",
              mode: "horizontal",
              required: true,
              type: "date",
              value: moment(data.sk_date).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({ ...data, sk_date: new Date(e) }),
            }}
          />
          <FormInput
            data={{
              label: "PIC 1",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.pic1,
              onChange: (e: string) => setData({ ...data, pic1: e }),
            }}
          />
          <FormInput
            data={{
              label: "PIC 2",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.pic2,
              onChange: (e: string) => setData({ ...data, pic2: e }),
            }}
          />
          <FormInput
            data={{
              label: "Keterangan",
              mode: "horizontal",
              required: true,
              type: "textarea",
              value: data.description,
              onChange: (e: string) => setData({ ...data, description: e }),
            }}
          />
          <FormInput
            data={{
              label: "Logo Mitra",
              mode: "horizontal",
              type: "upload",
              accept: "image/png,image/jpg,image/jpeg",
              value: data.logo,
              onChange: (e: string) => setData({ ...data, logo: e }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <FormInput
            data={{
              label: "Biaya Tatalaksana",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.c_gov || 0),
              onChange: (e: any) => setData({ ...data, c_gov: IDRToNumber(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Biaya Buka Rekening",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.c_account || 0),
              onChange: (e: any) =>
                setData({ ...data, c_account: IDRToNumber(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Biaya Provisi",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.c_provisi),
              onChange: (e: any) =>
                setData({ ...data, c_provisi: IDRToNumber(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Biaya Data Informasi",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.c_information),
              onChange: (e: any) =>
                setData({ ...data, c_information: IDRToNumber(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Biaya Materai",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.c_stamps),
              onChange: (e: any) =>
                setData({ ...data, c_stamps: IDRToNumber(e) }),
            }}
          />

          <FormInput
            data={{
              label: "Biaya Admin",
              mode: "horizontal",
              type: "number",
              value: data.c_adm,
              onChange: (e: any) => setData({ ...data, c_adm: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Suku Bunga",
              mode: "horizontal",
              type: "number",
              value: data.c_margin,
              onChange: (e: any) =>
                setData({ ...data, c_margin: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "TBO Berkas",
              mode: "horizontal",
              type: "number",
              value: data.tbo,
              onChange: (e: any) => setData({ ...data, tbo: parseInt(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Pembulatan",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.rounded || 0),
              onChange: (e: any) =>
                setData({ ...data, rounded: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Pembulatan Mitra",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(data.rounded_sumdan || 0),
              onChange: (e: any) =>
                setData({ ...data, rounded_sumdan: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "DebtService Ratio",
              mode: "horizontal",
              type: "number",
              value: data.dsr,
              onChange: (e: any) => setData({ ...data, dsr: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Limit Pembiayaan",
              mode: "horizontal",
              type: "text",
              value: IDRFormat(Number(data.limit) || 0),
              onChange: (e: any) =>
                setData({ ...data, limit: BigInt(IDRToNumber(e || "0")) }),
            }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-4">
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

export function DeleteSumdan({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: ISumdan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/sumdan?id=${record?.id}`, {
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
      title={"Delete Sumber Dana " + record?.name}
    >
      <p>Are you sure you want to delete this sumber dana?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

function TableProduk({
  records,
  getData,
  modal,
  hasAccess,
}: {
  records: ISumdan;
  getData: Function;
  modal: HookAPI;
  hasAccess: Function;
}) {
  const [upsert, setUpsert] = useState<IActionTable<ProdukPembiayaan>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });

  const columns: TableProps<ProdukPembiayaan>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 120,
    },
    {
      title: "Produk",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Kriteria",
      dataIndex: "kriteria",
      key: "kriteria",
      render(value, record, index) {
        return (
          <div className="text-xs text-slate-500">
            <p>
              Usia Pengajuan : {record.min_age} - {record.max_age}
            </p>
            <p>Usia Lunas : {record.max_paid}</p>
            <p>Tenor : {record.max_tenor}</p>
            <p>Plafond : {IDRFormat(record.max_plafond)}</p>
          </div>
        );
      },
    },
    {
      title: "Biaya - Biaya",
      dataIndex: "biaya",
      key: "biaya",
      render(value, record, index) {
        return (
          <div className="text-xs text-slate-500">
            <div>
              Margin : {record.c_margin} % ({record.c_margin + records.c_margin}
              %)
            </div>
            <div>
              Admin : {record.c_adm} % ({record.c_adm + records.c_adm}%)
            </div>
            <div>Asuransi : {record.c_insurance}%</div>
            <div>Janis Margin : {record.margin_type}</div>
          </div>
        );
      },
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => (
        <div className="text-xs">{moment(date).format("DD-MM-YYYY")}</div>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
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
    <div className="space-y-3">
      {hasAccess("write") && (
        <Button
          icon={<PlusCircleOutlined />}
          size="middle"
          type="primary"
          className="app-master-action"
          onClick={() =>
            setUpsert({ ...upsert, upsert: true, selected: undefined })
          }
        >
          Add Produk
        </Button>
      )}
      <Table
        className="app-master-table"
        columns={columns}
        dataSource={records.ProdukPembiayaan}
        rowKey={"id"}
        pagination={false}
        size="middle"
      />
      <UpsertProduk
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        modal={modal}
        sumdan={records}
        key={upsert.selected ? "upsert" + upsert.selected.id : "createproduk"}
      />
      <DeleteProduk
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        modal={modal}
        record={upsert.selected}
        key={upsert.selected ? "delete" + upsert.selected.id : "deleteproduk"}
      />
    </div>
  );
}

function UpsertProduk({
  record,
  open,
  setOpen,
  getData,
  modal,
  sumdan,
}: {
  record?: ProdukPembiayaan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
  sumdan: Sumdan;
}) {
  const [data, setData] = useState(record ? record : defaultProduk);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/produk", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify({ ...data, sumdanId: sumdan.id }),
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
      title={`${sumdan.code} | ${
        record ? "Update Produk " + record.name : "Add New Produk"
      }`}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
      width={1200}
      style={{ top: 20 }}
    >
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-1">
          <div className="hidden">
            <FormInput
              data={{
                label: "ID",
                mode: "horizontal",
                type: "text",
                value: data.id,
                onChange: (e: string) => setData({ ...data, id: e }),
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Produk Pembiayaan",
              mode: "horizontal",
              required: true,
              type: "text",
              value: data.name,
              onChange: (e: string) => setData({ ...data, name: e }),
            }}
          />
          <FormInput
            data={{
              label: "Min Usia",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.min_age,
              onChange: (e: any) => setData({ ...data, min_age: parseInt(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Maks Usia",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.max_age,
              onChange: (e: any) => setData({ ...data, max_age: parseInt(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Usia Lunas",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.max_paid,
              onChange: (e: any) => setData({ ...data, max_paid: parseInt(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Max Tenor",
              mode: "horizontal",
              required: true,
              type: "number",
              value: data.max_tenor,
              onChange: (e: any) =>
                setData({ ...data, max_tenor: parseInt(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Max Plafond",
              mode: "horizontal",
              required: true,
              type: "text",
              value: IDRFormat(data.max_plafond),
              onChange: (e: any) =>
                setData({ ...data, max_plafond: IDRToNumber(e) }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <FormInput
            data={{
              label: "Margin",
              mode: "horizontal",
              type: "number",
              required: true,
              value: data.c_margin,
              suffix: `${sumdan.c_margin + data.c_margin}%`,
              onChange: (e: any) =>
                setData({ ...data, c_margin: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Admin",
              mode: "horizontal",
              type: "number",
              required: true,
              value: data.c_adm,
              suffix: `${sumdan.c_adm + data.c_adm}%`,
              onChange: (e: any) => setData({ ...data, c_adm: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Asuransi",
              mode: "horizontal",
              type: "number",
              required: true,
              value: data.c_insurance,
              onChange: (e: any) =>
                setData({ ...data, c_insurance: parseFloat(e) }),
            }}
          />
          <FormInput
            data={{
              label: "Jenis Margin",
              mode: "horizontal",
              type: "select",
              required: true,
              options: [
                { label: "FLAT", value: "FLAT" },
                { label: "ANUITAS", value: "ANUITAS" },
              ],
              value: data.margin_type,
              onChange: (e: any) => setData({ ...data, margin_type: e }),
            }}
          />
        </div>
      </div>
      <div className="flex justify-end gap-4 mt-2">
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

export function DeleteProduk({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: ProdukPembiayaan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/produk?id=${record?.id}`, {
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
      title={"Delete Produk " + record?.name}
    >
      <p>Are you sure you want to delete this produk?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultProduk: ProdukPembiayaan = {
  id: "",
  name: "",
  c_margin: 0,
  min_age: 0,
  max_age: 0,
  max_paid: 0,
  c_adm: 0,
  c_insurance: 0,
  max_tenor: 0,
  max_plafond: 0,
  margin_type: "ANUITAS",

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  sumdanId: "",
};

const defaultSumdan: ISumdan = {
  id: "",
  name: "",
  code: "",
  address: null,
  phone: null,
  email: null,
  description: null,
  logo: null,
  tbo: 3,
  rounded: 1000,
  rounded_sumdan: 1,
  c_margin: 0,
  c_adm: 0,
  limit: BigInt(0),
  dsr: 0,
  c_gov: 0,
  c_account: 0,
  c_stamps: 0,
  c_information: 0,
  c_provisi: 0,
  sk_no: "",
  sk_date: new Date(),
  ProdukPembiayaan: [],
  pic1: null,
  pic2: null,

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};
