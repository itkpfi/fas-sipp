"use client";

import { FormInput, ViewFiles } from "@/components";
import { printContract } from "@/components/pdfutils/akad/Akad";
import { printForm } from "@/components/pdfutils/etc/printForm";
import { printMonitoring } from "@/components/pdfutils/etc/printMonitoring";
import { useUser } from "@/components/UserContext";
import {
  ExportToExcel,
  FilterData,
  GetDroppingStatusTag,
  GetStatusTag,
  MappingToExcelDapem,
} from "@/components/utils/CompUtils";
import { DetailDapem } from "@/components/utils/LayoutUtils";
import {
  GetAngsuran,
  GetRoman,
  IDRFormat,
} from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IDapem,
  IDesc,
  IPageProps,
  IViewFiles,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileFilled,
  FolderOutlined,
  PayCircleOutlined,
  PrinterOutlined,
  ReadOutlined,
  RobotOutlined,
  SearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { JenisPembiayaan, Sumdan } from "@prisma/client";
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
  Tooltip,
  Typography,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;

interface IActionTableAkad<T> extends IActionTable<T> {
  cetakAkad: boolean;
}

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    sumdanId: "",
    jenisPembiayaanId: "",
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IActionTableAkad<IDapem>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
    cetakAkad: false,
  });
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const [jeniss, setJeniss] = useState<JenisPembiayaan[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/monitoring");
  const user = useUser();
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });

  const handleResetFilters = () => {
    setPageProps((prev) => ({
      ...prev,
      page: 1,
      sumdanId: "",
      jenisPembiayaanId: "",
    }));
  };

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("dropping_status", "PENDING");
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.jenisPembiayaanId)
      params.append("jenisPembiayaanId", pageProps.jenisPembiayaanId);

    const res = await fetch(`/api/dapem?${params.toString()}`);
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
    pageProps.sumdanId,
    pageProps.jenisPembiayaanId,
  ]);

  useEffect(() => {
    (async () => {
      await fetch("/api/sumdan")
        .then((res) => res.json())
        .then((res) => setSumdans(res.data));
      await fetch("/api/jenis")
        .then((res) => res.json())
        .then((res) => setJeniss(res.data));
    })();
  }, []);

  const columns: TableProps<IDapem>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render(value, record, index) {
        return (
          <div>
            <div>{(pageProps.page - 1) * pageProps.limit + index + 1}</div>
            <div className="opacity-80 text-xs">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: "Pemohon",
      dataIndex: "pemohon",
      key: "pemohon",
      render(value, record, index) {
        return (
          <div>
            <p className="font-bold">{record.Debitur.fullname}</p>
            <div className="text-xs opacity-80">
              <p>@{record.Debitur.nopen}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Permohonan",
      dataIndex: "permohonan",
      key: "permohonan",
      render(value, record, index) {
        return (
          <div>
            <div>
              Plafond : <Tag color={"blue"}>{IDRFormat(record.plafond)}</Tag>
            </div>
            <div>
              Tenor : <Tag color={"blue"}>{record.tenor} Bulan</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Angsuran",
      dataIndex: "angsuran",
      key: "angsuran",
      render(value, record, index) {
        const total = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin + record.c_margin_sumdan,
          record.margin_type,
          record.rounded,
        ).angsuran;
        const mitra = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin_sumdan,
          record.margin_type,
          record.rounded_sumdan,
        ).angsuran;
        return (
          <div className="text-xs">
            <div>
              Total : <Tag color={"blue"}>{IDRFormat(total)}</Tag>
            </div>
            <div>
              Mitra : <Tag color={"blue"}> {IDRFormat(mitra)}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Produk Pembiayaan",
      dataIndex: "produk",
      key: "produk",
      render(value, record, index) {
        return (
          <div>
            <p>
              {record.ProdukPembiayaan.name}{" "}
              <span>({record.ProdukPembiayaan.Sumdan.code})</span>
            </p>
            <p className="opacity-80 text-xs">{record.JenisPembiayaan.name}</p>
          </div>
        );
      },
    },
    {
      title: "AO & UP",
      dataIndex: "aoup",
      key: "aoup",
      render(value, record, index) {
        return (
          <div>
            <div>{record.AO.fullname}</div>
            <div className="text-xs opacity-80">
              {record.AO.Cabang.name} | {record.AO.Cabang.Area.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status VERIFIKASI",
      dataIndex: "verif_status",
      key: "verif_status",
      width: 250,
      render: (_, record, i) => {
        const temp = record.verif_desc
          ? (JSON.parse(record.verif_desc) as IDesc)
          : null;
        return (
          <div className="flex gap-1">
            {GetStatusTag(record.verif_status)}
            {temp && (
              <Paragraph
                ellipsis={{
                  rows: 2,
                  expandable: "collapsible",
                }}
                style={{ fontSize: 11 }}
              >
                {temp.desc}
                <p>
                  (By {temp.name} at {moment(temp.date).format("DD/MM/YYYY")})
                </p>
              </Paragraph>
            )}
          </div>
        );
      },
    },
    {
      title: "Status SLIK",
      dataIndex: "slik_status",
      key: "slik_status",
      width: 250,
      render: (_, record, i) => {
        const temp = record.slik_desc
          ? (JSON.parse(record.slik_desc) as IDesc)
          : null;
        return (
          <div className="flex gap-1">
            {GetStatusTag(record.slik_status)}
            {temp && (
              <Paragraph
                ellipsis={{
                  rows: 2,
                  expandable: "collapsible",
                }}
                style={{ fontSize: 11 }}
              >
                {temp.desc}
                <p>
                  (By {temp.name} at {moment(temp.date).format("DD/MM/YYYY")})
                </p>
              </Paragraph>
            )}
          </div>
        );
      },
    },
    {
      title: "Status APPROVAL",
      dataIndex: "approvel_status",
      key: "approvel_status",
      width: 250,
      render: (_, record, i) => {
        const temp = record.approv_desc
          ? (JSON.parse(record.approv_desc) as IDesc)
          : null;
        return (
          <div className="flex gap-1">
            {GetStatusTag(record.approv_status)}
            {temp && (
              <Paragraph
                ellipsis={{
                  rows: 2,
                  expandable: "collapsible",
                }}
                style={{ fontSize: 11 }}
              >
                {temp.desc}
                <p>
                  (By {temp.name} at {moment(temp.date).format("DD/MM/YYYY")})
                </p>
              </Paragraph>
            )}
          </div>
        );
      },
    },
    {
      title: "Status Dropping",
      dataIndex: "dropping_status",
      key: "dropping_status",
      width: 180,
      render: (_, record, i) => {
        return (
          <div className="flex gap-1">
            {GetDroppingStatusTag(record.dropping_status)}
            {record.Dropping && record.Dropping.process_at && (
              <div className="text-xs">
                {moment(record.Dropping.process_at).format("DD/MM/YYYY HH:mm")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Berkas Akad",
      dataIndex: "akad",
      key: "akad",
      render(value, record, index) {
        return (
          <div>
            <div className="flex gap-2">
              <Button
                icon={<FileFilled />}
                size="small"
                disabled={!record.file_contract}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      { name: "Berkas Akad", url: record.file_contract || "" },
                    ],
                  })
                }
              ></Button>
              {hasAccess("update") && (
                <Button
                  icon={<PrinterOutlined />}
                  type="primary"
                  size="small"
                  onClick={() =>
                    setSelected({
                      ...selected,
                      selected: record,
                      cetakAkad: true,
                    })
                  }
                ></Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Nomor Akad",
      dataIndex: "dataakad",
      key: "dataakad",
      render(value, record, index) {
        return (
          <div>
            {record.no_contract && <div>{record.no_contract}</div>}
            {record.date_contract && (
              <div className="text-xs opacity-80">
                {moment(record.date_contract).format("DD/MM/YYYY")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Mutasi & Takeover",
      dataIndex: "produk",
      key: "produk",
      width: 350,
      render(value, record, index) {
        return (
          <div>
            {record.JenisPembiayaan.status_mutasi && (
              <div style={{ fontSize: 9 }}>
                <SwapOutlined />{" "}
                <Tag style={{ fontSize: 9 }} color={"red"}>
                  {record.mutasi_from}
                </Tag>{" "}
                <ArrowRightOutlined style={{ fontSize: 9 }} />{" "}
                <Tag style={{ fontSize: 9 }} color={"blue"}>
                  {record.mutasi_to}
                </Tag>
              </div>
            )}
            {record.JenisPembiayaan.status_takeover && (
              <div style={{ fontSize: 9 }}>
                <PayCircleOutlined />{" "}
                <Tag color={"blue"} style={{ fontSize: 9 }}>
                  {record.takeover_from} (
                  {moment(record.takeover_date).format("DD/MM/YYYY")})
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render(value, record, index) {
        return (
          <div>
            <div>{record.CreatedBy.fullname}</div>
            <div className="opacity-80 text-xs">
              {moment(record.created_at).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1 flex-wrap justify-center">
          {hasAccess("write") && (
            <Button
              icon={<PrinterOutlined />}
              type="primary"
              size="small"
              onClick={() => printForm(record)}
            ></Button>
          )}
          {hasAccess("update") && (
            <Link href={`/monitoring/upsert/${record.id}`}>
              <Button
                icon={<EditOutlined />}
                size="small"
                type="primary"
              ></Button>
            </Link>
          )}
          {hasAccess("update") &&
            ["DRAFT", "CANCEL"].includes(record.dropping_status) && (
              <Tooltip title={"Ajukan permohonan ini? (Naikan ke verifikasi)"}>
                <Button
                  icon={<CheckCircleOutlined />}
                  size="small"
                  type="primary"
                  onClick={() =>
                    setSelected({ ...selected, proses: true, selected: record })
                  }
                ></Button>
              </Tooltip>
            )}
          {hasAccess("delete") && (
            <Button
              icon={<DeleteOutlined />}
              size="small"
              type="primary"
              danger
              onClick={() =>
                setSelected({ ...selected, delete: true, selected: record })
              }
              disabled={["APPROVED", "PAID_OFF"].includes(
                record.dropping_status,
              )}
            ></Button>
          )}
          <Tooltip
            title={`Detail Data ${record.Debitur.fullname} (${record.nopen})`}
          >
            <Button
              icon={<FolderOutlined />}
              type="primary"
              size="small"
              onClick={() =>
                setSelected({ ...selected, upsert: true, selected: record })
              }
            ></Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <ReadOutlined /> Monitoring Pembiayaan
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterData
            buttonSize="middle"
            buttonClassName="app-master-action"
            title="Filter Pending Data"
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
                    {user && !user.sumdanId && (
                      <div className="app-filter-field">
                        <p>Mitra pembiayaan</p>
                        <Select
                          className="app-master-select"
                          size="middle"
                          placeholder="Pilih Mitra..."
                          options={sumdans.map((s) => ({
                            label: s.code,
                            value: s.id,
                          }))}
                          onChange={(e) =>
                            setPageProps({
                              ...pageProps,
                              page: 1,
                              sumdanId: e || "",
                            })
                          }
                          value={pageProps.sumdanId || undefined}
                          allowClear
                          style={{ width: "100%" }}
                        />
                      </div>
                    )}
                    <div className="app-filter-field">
                      <p>Jenis pembiayaan</p>
                      <Select
                        className="app-master-select"
                        size="middle"
                        placeholder="Pilih Jenis..."
                        options={jeniss.map((s) => ({
                          label: s.name,
                          value: s.id,
                        }))}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            jenisPembiayaanId: e || "",
                          })
                        }
                        value={pageProps.jenisPembiayaanId || undefined}
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </>
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            icon={<PrinterOutlined />}
            size="middle"
            type="primary"
            className="app-master-action"
            onClick={() =>
              ExportToExcel(
                [
                  {
                    sheetname: "alldata",
                    data: MappingToExcelDapem(pageProps.data),
                  },
                ],
                "pendingdata",
              )
            }
          >
            Excel
          </Button>
          <Button
            icon={<PrinterOutlined />}
            size="middle"
            type="primary"
            className="app-master-action"
            onClick={() =>
              printMonitoring(pageProps.data, sumdans, pageProps.backdate)
            }
          >
            PDF
          </Button>
          {hasAccess("write") && (
            <Button
              icon={<PrinterOutlined />}
              type="primary"
              size="middle"
              className="app-master-action"
              onClick={() => printForm()}
            >
              Form
            </Button>
          )}
          <div className="app-master-toolbar-search md:max-w-xs">
            <Input
              size="middle"
              className="app-master-search"
              style={{ width: "100%" }}
              placeholder="Cari nama..."
              prefix={<SearchOutlined className="text-slate-400" />}
              allowClear
              onChange={(e) =>
                setPageProps({ ...pageProps, page: 1, search: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <Table
        className="app-master-table"
        columns={columns}
        dataSource={pageProps.data}
        size="middle"
        loading={loading}
        rowKey={"id"}
        scroll={{ x: "max-content", y: "60vh" }}
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
        summary={(pageData) => {
          const angsuran = pageData.reduce(
            (acc, item) =>
              acc +
              GetAngsuran(
                item.plafond,
                item.tenor,
                item.c_margin + item.c_margin_sumdan,
                item.margin_type,
                item.rounded,
              ).angsuran,
            0,
          );
          const angssudan = pageData.reduce(
            (acc, item) =>
              acc +
              GetAngsuran(
                item.plafond,
                item.tenor,
                item.c_margin_sumdan,
                item.margin_type,
                item.rounded_sumdan,
              ).angsuran,
            0,
          );

          return (
            <Table.Summary.Row className="text-xs bg-blue-400">
              <Table.Summary.Cell index={0} colSpan={2} className="text-center">
                <b>SUMMARY</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} className="text-center">
                <b>
                  {IDRFormat(
                    pageData.reduce((acc, item) => acc + item.plafond, 0),
                  )}{" "}
                </b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} className="text-center font-bold">
                <div>
                  {IDRFormat(angsuran)} - {IDRFormat(angssudan)}
                </div>
                <div className="border-t border-gray-500">
                  {IDRFormat(angsuran - angssudan)}
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />

      {selected.selected && selected.proses && (
        <SendSubmission
          data={selected.selected}
          open={selected.proses}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, proses: val, selected: undefined })
          }
          getData={getData}
          hook={modal}
          key={"send" + selected.selected.id}
        />
      )}
      {selected.selected && selected.delete && (
        <DeleteSubmission
          open={selected.delete}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, delete: val })
          }
          getData={getData}
          data={selected.selected}
          hook={modal}
          key={"delete" + selected.selected.id}
        />
      )}
      {selected.selected && selected.cetakAkad && (
        <PrintContractSubmission
          open={selected.cetakAkad}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, cetakAkad: val })
          }
          getData={getData}
          data={selected.selected}
          hook={modal}
          key={"contract" + selected.selected.id}
        />
      )}
      {selected.selected && selected.upsert && (
        <DetailDapem
          open={selected.upsert}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, upsert: val })
          }
          data={selected.selected}
          key={"detail" + selected.selected.id}
          allowprogres
        />
      )}
      <ViewFiles
        setOpen={(v: boolean) => setViews({ ...views, open: v })}
        data={{ ...views }}
      />
    </Card>
  );
}

const SendSubmission = ({
  data,
  open,
  setOpen,
  getData,
  hook,
}: {
  data: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/dapem?id=" + data.id, {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        verif_status: "PENDING",
        dropping_status: "PENDING",
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR!!", content: res.msg });
        }
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Konfirmasi Permohonan"
      loading={loading}
      onOk={handleSubmit}
    >
      <div className="my-4">
        <p>
          Ajukan permohonan ini ke verifikasi{" "}
          <span className="font-bold">*{data.id}*</span>?
        </p>
        <p className="italic text-xs text-blue-500 mt-4">
          Mohon cek kembali data yang telah diinput, pastikan sudah lengkap dan
          siap di verifikasi!
        </p>
      </div>
    </Modal>
  );
};

const DeleteSubmission = ({
  data,
  open,
  setOpen,
  getData,
  hook,
}: {
  data: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/dapem?id=" + data.id, { method: "DELETE" })
      .then((res) => res.json())
      .then(async (res) => {
        const { msg, status } = res;
        if (status === 200) {
          await getData();
          setOpen(false);
        } else {
          hook.error({ content: msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          content: `Internal Server Error!!. Hapus data permohonan kredit ${data.id}) gagal`,
        });
      });
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    await fetch("/api/dapem?id=" + data.id, {
      method: "PUT",
      body: JSON.stringify({ ...data, dropping_status: "CANCEL" }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR!!", content: res.msg });
        }
      });
    setLoading(false);
  };
  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Konfirmasi Hapus Permohonan"
      loading={loading}
      footer={[]}
    >
      <div className="my-4">
        <p>
          Hapus Data Pembiayaan ini{" "}
          <span className="font-bold">*{data.id}*</span>?
        </p>
        <div className="mt-4 text-xs italic text-blue-500">
          <p>Hapus : Hapus dari monitoring!</p>
          <p>Batalkan : Update status menjadi CANCEL!</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button danger onClick={() => handleDelete()}>
          Hapus Pengajuan
        </Button>
        <Button danger onClick={() => handleCancel()}>
          Batalkan Pengajuan
        </Button>
        <Button onClick={() => setOpen(false)}>Tutup</Button>
      </div>
    </Modal>
  );
};

const PrintContractSubmission = ({
  open,
  setOpen,
  data,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  data: IDapem;
  getData: Function;
  hook: HookAPI;
}) => {
  const [temp, setTemp] = useState<IDapem>(data);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/akad", {
      method: "POST",
      body: JSON.stringify({
        id: data.id,
        date_contract: temp.date_contract,
        no_contract: temp.no_contract,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { msg, status, data } = res;
        if (status === 200) {
          await getData();
          printContract({ ...temp, Angsuran: data } as IDapem);
        } else {
          hook.error({ content: msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ content: `Internal Server Error!!. Generate PK gagal` });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={"Cetak Akad " + data.id}
      loading={loading}
      onOk={handleSubmit}
      okButtonProps={{
        disabled: !temp.date_contract || !temp.no_contract,
      }}
    >
      <div className="flex flex-col gap-2">
        <FormInput
          data={{
            label: "Pemohon",
            type: "text",
            required: true,
            value: `${data.Debitur.fullname} (${data.nopen})`,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Tanggal Akad",
            type: "date",
            required: true,
            value: moment(temp.date_contract).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setTemp({ ...temp, date_contract: new Date(e) }),
          }}
        />
        <FormInput
          data={{
            label: "Nomor Akad",
            type: "text",
            required: true,
            value: temp.no_contract,
            onChange: (e: string) => setTemp({ ...temp, no_contract: e }),
            suffix: (
              <Button
                size="small"
                icon={<RobotOutlined />}
                type="primary"
                onClick={() =>
                  setTemp({
                    ...temp,
                    no_contract: `${data.id}/FAS-PKPP/${GetRoman(new Date(temp.date_contract || new Date()).getMonth() + 1)}/${moment(temp.date_contract || new Date()).format("YYYY")}`,
                  })
                }
              ></Button>
            ),
          }}
        />
        <FormInput
          data={{
            label: "Jenis Margin",
            type: "text",
            required: true,
            value: `${data.c_margin + data.c_margin_sumdan}% (${data.margin_type})`,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Mitra",
            type: "text",
            required: true,
            value: data.ProdukPembiayaan.Sumdan.name,
            disabled: true,
          }}
        />
      </div>
    </Modal>
  );
};
