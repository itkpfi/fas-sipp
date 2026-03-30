"use client";

import { useUser } from "@/components/UserContext";
import {
  ExportToExcel,
  FilterData,
  GetStatusTag,
  MappingToProsesDapem,
  ProsesPembiayaan,
} from "@/components/utils/CompUtils";
import { DetailDapem } from "@/components/utils/LayoutUtils";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { IActionTable, IDapem, IDesc, IPageProps } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";

import {
  ArrowRightOutlined,
  FileProtectOutlined,
  FolderOutlined,
  FormOutlined,
  PayCircleOutlined,
  PrinterOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { JenisPembiayaan, Sumdan } from "@prisma/client";
import {
  App,
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Table,
  TableProps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    sumdanId: "",
    jenisPembiayaanId: "",
    approv_status: "",
    backdate: "",
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IActionTable<IDapem>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const [jeniss, setJeniss] = useState<JenisPembiayaan[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/proses/approv");
  const user = useUser();

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("approv_status", pageProps.approv_status || "all");

    if (pageProps.search) params.append("search", pageProps.search);
    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.jenisPembiayaanId)
      params.append("jenisPembiayaanId", pageProps.jenisPembiayaanId);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);

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
    pageProps.approv_status,
    pageProps.jenisPembiayaanId,
    pageProps.backdate,
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
        <div className="flex gap-2">
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
          {hasAccess("proses") && (
            <Button
              size="small"
              type="primary"
              icon={<FormOutlined />}
              onClick={() =>
                setSelected({ ...selected, proses: true, selected: record })
              }
            ></Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      title={
        <div className="flex gap-2 font-bold text-xl">
          <FileProtectOutlined /> Approval Pembiayaan
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between my-1 gap-2 overflow-auto">
        <div className="flex gap-2">
          <FilterData
            children={
              <>
                <div className="my-2">
                  <p>Periode :</p>
                  <RangePicker
                    size="small"
                    onChange={(date, dateStr) =>
                      setPageProps({ ...pageProps, backdate: dateStr })
                    }
                    style={{ width: "100%" }}
                  />
                </div>
                {user && !user.sumdanId && (
                  <div className="my-2">
                    <p>Mitra pembiayaan :</p>
                    <Select
                      size="small"
                      placeholder="Pilih Mitra..."
                      options={sumdans.map((s) => ({
                        label: s.code,
                        value: s.id,
                      }))}
                      onChange={(e) =>
                        setPageProps({ ...pageProps, sumdanId: e })
                      }
                      allowClear
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
                <div className="my-2">
                  <p>Jenis pembiayaan :</p>
                  <Select
                    size="small"
                    placeholder="Pilih Jenis..."
                    options={jeniss.map((s) => ({
                      label: s.name,
                      value: s.id,
                    }))}
                    onChange={(e) =>
                      setPageProps({ ...pageProps, jenisPembiayaanId: e })
                    }
                    allowClear
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="my-2">
                  <p>Status pembiayaan</p>
                  <Select
                    size="small"
                    placeholder="Pilih Status..."
                    options={[
                      { label: "PENDING", value: "PENDING" },
                      { label: "APPROVED", value: "APPROVED" },
                      { label: "REJECTED", value: "REJECTED" },
                    ]}
                    onChange={(e) =>
                      setPageProps({ ...pageProps, approv_status: e })
                    }
                    allowClear
                    style={{ width: "100%" }}
                  />
                </div>
              </>
            }
          />
        </div>
        <div className="flex gap-2 items-center">
          <Button
            icon={<PrinterOutlined />}
            size="small"
            type="primary"
            onClick={() =>
              ExportToExcel(
                [
                  {
                    sheetname: "alldata",
                    data: MappingToProsesDapem(pageProps.data),
                  },
                  {
                    sheetname: "antri",
                    data: MappingToProsesDapem(
                      pageProps.data.filter(
                        (d) => d.approv_status === "PENDING",
                      ),
                    ),
                  },
                  {
                    sheetname: "setuju",
                    data: MappingToProsesDapem(
                      pageProps.data.filter(
                        (d) => d.approv_status === "APPROVED",
                      ),
                    ),
                  },
                  {
                    sheetname: "tolak",
                    data: MappingToProsesDapem(
                      pageProps.data.filter(
                        (d) => d.approv_status === "REJECTED",
                      ),
                    ),
                  },
                ],
                "proses_permohonan",
              )
            }
          >
            Excel
          </Button>
          <Input.Search
            size="small"
            style={{ width: 170 }}
            placeholder="Cari nama..."
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={pageProps.data}
        size="small"
        loading={loading}
        rowKey={"id"}
        bordered
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
      {selected.selected && selected.upsert && (
        <DetailDapem
          open={selected.upsert}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, upsert: val })
          }
          data={selected.selected}
          key={"detail" + selected.selected.id}
        />
      )}
      {selected.selected && selected.proses && (
        <ProsesPembiayaan
          data={selected.selected}
          open={selected.proses}
          setOpen={(e: boolean) => setSelected({ ...selected, proses: e })}
          hook={modal}
          user={user ? user.fullname : "No Name"}
          getData={getData}
          name="approv"
          nextname="dropping_status"
          nextnameValue="PROCCESS"
        />
      )}
    </Card>
  );
}
