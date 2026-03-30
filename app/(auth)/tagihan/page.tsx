"use client";

import { FormInput } from "@/components";
import { useUser } from "@/components/UserContext";
import {
  ExportToExcel,
  FilterData,
  MappingToTagihan,
} from "@/components/utils/CompUtils";
import {
  GetAngsuran,
  GetSisaPokokMargin,
  IDRFormat,
  IDRToNumber,
} from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IDapem,
  IPageProps,
  IPelunasan,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  DollarCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  FormOutlined,
  HistoryOutlined,
  MoneyCollectOutlined,
  PayCircleOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { Angsuran, ESettleStatus, Sumdan } from "@prisma/client";
import {
  App,
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  Modal,
  Progress,
  Select,
  Table,
  TableProps,
  Tag,
  Tooltip,
  Upload,
  UploadProps,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    sumdanId: "",
    paid_status: "",
    backdate: "",
  });
  const [action, setAction] = useState<IActionTable<IDapem>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [cek, setCek] = useState({
    open: false,
    msg: [],
  });
  const [loading, setLoading] = useState(false);
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/tagihan");
  const user = useUser();
  const [selecteds, setSelecteds] = useState<IDapem[]>([]);
  const rowSelection: TableProps<IDapem>["rowSelection"] = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: IDapem[]) => {
      if (selectedRows.length !== 0) {
        const last = selectedRows[selectedRows.length - 1];
        setSelecteds(
          selectedRows.filter(
            (s) =>
              s.ProdukPembiayaan.sumdanId === last.ProdukPembiayaan.sumdanId,
          ),
        );
      } else {
        setSelecteds(selectedRows);
      }
    },
  };

  useEffect(() => {
    (async () => {
      await fetch("/api/sumdan?limit=1000")
        .then((res) => res.json())
        .then((res) => setSumdans(res.data));
    })();
  }, []);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.paid_status)
      params.append("paid_status", pageProps.paid_status);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);

    const res = await fetch(`/api/tagihan?${params.toString()}`);
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
    pageProps.paid_status,
    pageProps.backdate,
  ]);

  const columns: TableProps<IDapem>["columns"] = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      className: "text-center",
      render(value, record, index) {
        return (
          <div>
            <div>{(pageProps.page - 1) * pageProps.limit + index + 1}</div>
            <div className="text-xs opacity-80">{record.id}</div>
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
            <div>{record.Debitur.fullname}</div>
            <div className="text-xs opacity-80">@{record.Debitur.nopen}</div>
          </div>
        );
      },
    },
    {
      title: "Pembiayaan",
      dataIndex: "pembiayaan",
      key: "pembiayaan",
      render(value, record, index) {
        return (
          <div>
            <div>
              <DollarCircleOutlined />{" "}
              <Tag color={"blue"}>{IDRFormat(record.plafond)}</Tag>
            </div>
            <div>
              <HistoryOutlined /> <Tag color={"blue"}>{record.tenor} Bulan</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Akad",
      dataIndex: "pemohon",
      key: "pemohon",
      render(value, record, index) {
        return (
          <div>
            <div>{record.no_contract}</div>
            <div className="text-xs opacity-80">
              {moment(record.date_contract).format("DD/MM/YYY")}
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
        const angs = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin + record.c_margin_sumdan,
          record.margin_type,
          record.rounded,
        ).angsuran;
        const angssumdan = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin_sumdan,
          record.margin_type,
          record.rounded_sumdan,
        ).angsuran;
        const find = record.Angsuran.find((f) =>
          moment(f.date_pay).isSame(pageProps.backdate || new Date(), "month"),
        );
        return (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <Tag color={"blue"}>{IDRFormat(angs)}</Tag>
              <Tag color={"blue"}>{IDRFormat(angssumdan)}</Tag>
            </div>
            <Tag color={"blue"} style={{ marginLeft: 2 }}>
              Ke {find ? find.counter : 0} |{" "}
              {IDRFormat(find ? find.remaining : 0)}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Pokok & margin",
      dataIndex: "pm",
      key: "pm",
      render(value, record, index) {
        const find = record.Angsuran.find((f) =>
          moment(f.date_pay).isSame(pageProps.backdate || new Date(), "month"),
        );
        return (
          <div className="flex flex-col gap-1">
            <Tag color={"blue"} style={{ textAlign: "right" }}>
              {IDRFormat(find ? find.principal : 0)}
            </Tag>
            <Tag color={"blue"} style={{ textAlign: "right" }}>
              {IDRFormat(find ? find.margin : 0)}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Status Tagih",
      dataIndex: "status",
      key: "status",
      render(value, record, index) {
        const find = record.Angsuran.find((f) =>
          moment(f.date_pay).isSame(pageProps.backdate || new Date(), "month"),
        );
        return (
          <>
            {find && (
              <div className="flex gap-1">
                <Tag color={find.date_paid ? "green" : "red"} variant="solid">
                  {find.date_paid ? "PAID" : "UNPAID"}
                </Tag>
                <div className="text-xs opacity-80">
                  <div>
                    <CalendarOutlined />{" "}
                    {moment(find.date_pay).format("DD/MM/YYYY")}
                  </div>
                  <div>
                    <PayCircleOutlined />{" "}
                    {moment(find.date_paid).format("DD/MM/YYYY")}
                  </div>
                </div>
              </div>
            )}
          </>
        );
      },
    },
    {
      title: "Progres",
      dataIndex: "progres",
      key: "progres",
      width: 150,
      render(value, record, index) {
        const filter = record.Angsuran.filter((f) => f.date_paid !== null);
        return (
          <Tooltip title={`${filter.length} / ${record.tenor}`}>
            <Progress
              percent={parseFloat(
                String(((filter.length / record.tenor) * 100).toFixed(2)),
              )}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Tooltip title="Update tagihan">
              <Button
                size="small"
                type="primary"
                icon={<EditOutlined />}
                onClick={() =>
                  setAction({ ...action, upsert: true, selected: record })
                }
              ></Button>
            </Tooltip>
          )}
          {hasAccess("update") && (
            <Tooltip title="Buat Pelunasan">
              <Button
                size="small"
                type="primary"
                icon={<FormOutlined />}
                onClick={() =>
                  setAction({ ...action, delete: true, selected: record })
                }
              ></Button>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const handleProses = async () => {
    setLoading(true);
    await fetch("/api/tagihan", {
      method: "POST",
      body: JSON.stringify(
        selecteds.flatMap((d) =>
          d.Angsuran.find((f) =>
            moment(f.date_pay).isSame(
              pageProps.backdate || new Date(),
              "month",
            ),
          ),
        ),
      ),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: "Data berhasil di update!",
          });
          setAction({ ...action, proses: false });
          await getData();
        } else {
          modal.error({
            title: "ERROR",
            content: res.msg || "Internal server error!",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({ title: "ERROR!!", content: "Internal server Error" });
      });
    setLoading(false);
  };

  return (
    <Card
      title={
        <div className="flex gap-2 font-bold text-xl">
          <MoneyCollectOutlined /> Data Tagihan
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between my-1 gap-2 overflow-auto">
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Button
              size="small"
              icon={<FormOutlined />}
              type="primary"
              onClick={() => setAction({ ...action, proses: true })}
            >
              Proses
            </Button>
          )}
          {hasAccess("update") && (
            <Button
              icon={<CheckCircleOutlined />}
              type="primary"
              size="small"
              onClick={() => setCek({ open: true, msg: [] })}
            >
              Cek Tagihan
            </Button>
          )}
          <FilterData
            children={
              <>
                <div className="my-2">
                  <p>Periode :</p>
                  <DatePicker
                    size="small"
                    picker="month"
                    onChange={(date, dateStr) =>
                      setPageProps({ ...pageProps, backdate: dateStr })
                    }
                    style={{ width: "100%" }}
                  />
                </div>
                {user && !user.sumdanId && (
                  <div className="my-2">
                    <p>Mitra Pembiayaan : </p>
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
                <div>
                  <p>Status Tagihan :</p>
                  <Select
                    size="small"
                    placeholder="Pilih Status..."
                    options={[
                      { label: "Tertagih", value: "paid" },
                      { label: "Tidak Tertagih", value: "unpaid" },
                    ]}
                    onChange={(e) =>
                      setPageProps({ ...pageProps, paid_status: e })
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
                    data: MappingToTagihan(pageProps.data, pageProps.backdate),
                  },
                ],
                "monitoring",
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
            width={170}
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
        rowSelection={rowSelection}
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
          const angs = pageData.reduce(
            (acc, curr) =>
              acc +
              GetAngsuran(
                curr.plafond,
                curr.tenor,
                curr.c_margin + curr.c_margin_sumdan,
                curr.margin_type,
                curr.rounded,
              ).angsuran,
            0,
          );
          const angsSumdan = pageData.reduce(
            (acc, curr) =>
              acc +
              GetAngsuran(
                curr.plafond,
                curr.tenor,
                curr.c_margin_sumdan,
                curr.margin_type,
                curr.rounded_sumdan,
              ).angsuran,
            0,
          );
          const pokok = pageData
            .flatMap((d) =>
              d.Angsuran.find((a) =>
                moment(a.date_pay).isSame(
                  pageProps.backdate || new Date(),
                  "month",
                ),
              ),
            )
            .reduce((acc, curr) => acc + (curr ? curr.principal : 0), 0);
          const margin = pageData
            .flatMap((d) =>
              d.Angsuran.find((a) =>
                moment(a.date_pay).isSame(
                  pageProps.backdate || new Date(),
                  "month",
                ),
              ),
            )
            .reduce((acc, curr) => acc + (curr ? curr.margin : 0), 0);
          const os = pageData
            .flatMap((d) =>
              d.Angsuran.find((a) =>
                moment(a.date_pay).isSame(
                  pageProps.backdate || new Date(),
                  "month",
                ),
              ),
            )
            .reduce((acc, curr) => acc + (curr ? curr.remaining : 0), 0);
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
              <Table.Summary.Cell
                index={4}
                className="text-center"
              ></Table.Summary.Cell>
              <Table.Summary.Cell index={5} className="text-center font-bold">
                <div>
                  {IDRFormat(angs)} - {IDRFormat(angsSumdan)}
                </div>
                <div className="border-t border-gray-500">
                  {IDRFormat(angs - angsSumdan)}
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} className="font-bold text-right">
                <div>{IDRFormat(pokok)}</div>
                <div>{IDRFormat(margin)}</div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
      {action.selected && (
        <UpdateTagihan
          open={action.upsert}
          record={
            action.selected.Angsuran.find((a) =>
              moment(a.date_pay).isSame(
                pageProps.backdate || new Date(),
                "month",
              ),
            ) as Angsuran
          }
          rootrecord={action.selected}
          getData={getData}
          setOpen={(val: boolean) =>
            setAction({ ...action, upsert: val, selected: undefined })
          }
          hook={modal}
          key={"upsert" + action.selected?.id || "upsert"}
        />
      )}
      {action.selected && action.delete && (
        <CreatePelunasan
          open={action.delete}
          record={
            action.selected.Angsuran.find((a) =>
              moment(a.date_pay).isSame(
                pageProps.backdate || new Date(),
                "month",
              ),
            ) as Angsuran
          }
          rootrecord={action.selected}
          getData={getData}
          setOpen={(val: boolean) =>
            setAction({ ...action, delete: val, selected: undefined })
          }
          hook={modal}
          key={"pelunasan" + action.selected?.id || "pelunasan"}
        />
      )}
      {cek.open && (
        <CekTagihan
          open={cek.open}
          setOpen={(open) => setCek({ ...cek, open })}
        />
      )}
      <Modal
        title={"PROSES TAGIHAN"}
        open={action.proses}
        onCancel={() => setAction({ ...action, proses: false })}
        onOk={handleProses}
        loading={loading}
      >
        <p className="m-4">Konfirmasi proses tagihan untuk data yg dipilih?</p>
      </Modal>
    </Card>
  );
}

const UpdateTagihan = ({
  record,
  rootrecord,
  open,
  setOpen,
  getData,
  hook,
}: {
  record: Angsuran;
  rootrecord: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [data, setData] = useState(record);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/tagihan", { method: "PUT", body: JSON.stringify(data) })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: "Tagihan berhasil di update",
          });
          setOpen(false);
          await getData();
        } else {
          hook.error({
            title: "ERROR!",
            content: res.msg || "Internal Server Error!",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ title: "ERROR!", content: "Internal Server Error!" });
      });
    setLoading(false);
  };

  return (
    <Modal
      style={{ top: 30 }}
      title={"Update Data Tagihan " + rootrecord.id}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      loading={loading}
    >
      <div className="flex flex-col gap-2">
        <FormInput
          data={{
            label: "Pemohon",
            disabled: true,
            type: "text",
            value: rootrecord.Debitur.fullname,
          }}
        />
        <FormInput
          data={{
            label: "Angsuran",
            disabled: true,
            type: "text",
            value: `${IDRFormat(record.margin + record.principal)} | ke ${record.counter}`,
          }}
        />
        <FormInput
          data={{
            label: "Jadwal Tagih",
            disabled: true,
            type: "text",
            value: `${moment(record.date_pay).format("DD/MM/YYYY")} | Periode ${moment(record.date_pay).format("MMM YYYY")}`,
          }}
        />
        <FormInput
          data={{
            label: "Tanggal Bayar",
            type: "date",
            value: moment(data.date_paid).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setData({ ...data, date_paid: new Date(e) }),
          }}
        />
        <div className="italic text-xs text-blue-500">
          Isi tanggal bayar untuk update status menjadi tertagih, kosongkan jika
          tidak tertagih!
        </div>
        <FormInput
          data={{
            label: "Sisa Pokok",
            disabled: true,
            type: "text",
            value: IDRFormat(record.remaining),
          }}
        />
      </div>
    </Modal>
  );
};
const CreatePelunasan = ({
  record,
  rootrecord,
  open,
  setOpen,
  getData,
  hook,
}: {
  record: Angsuran;
  rootrecord: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [data, setData] = useState<IPelunasan>({
    id: "",
    amount: 0,
    amount_sumdan: 0,
    penalty: 0,
    type: "JATUHTEMPO",
    desc: "Permohonan pelunasan karna sudah jatuh tempo lunas",
    desc_sumdan: "",
    created_at: new Date(),
    file_sub: null,
    status_paid: "PENDING",
    process_at: null,
    guarantee_status: "MITRA",
    Dapem: rootrecord,
    dapemId: rootrecord.id,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/pelunasan", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content:
              "Pelunasan berhasil ditagihkan. mohon cek di menu pelunasan",
          });
          setOpen(false);
          await getData();
        } else {
          hook.error({
            title: "ERROR!",
            content: res.msg || "Internal Server Error!",
          });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ title: "ERROR!", content: "Internal Server Error!" });
      });
    setLoading(false);
  };

  return (
    <Modal
      style={{ top: 10 }}
      title={"Permohonan Pelunasan " + rootrecord.id}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSubmit}
      loading={loading}
      width={1300}
      okButtonProps={{
        disabled:
          rootrecord.dropping_status === "PAID_OFF" ||
          (rootrecord.Pelunasan &&
            rootrecord.Pelunasan.status_paid !== "REJECTED"),
      }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 sm:w-[40%] flex flex-col gap-2">
          <FormInput
            data={{
              label: "Pemohon",
              type: "text",
              required: true,
              value: `${rootrecord.Debitur.fullname} (${rootrecord.Debitur.nopen})`,
              disabled: true,
            }}
          />
          <FormInput
            data={{
              label: "Nomor Akad",
              type: "text",
              required: true,
              disabled: true,
              value: data.Dapem?.no_contract,
            }}
          />
          <FormInput
            data={{
              label: "Pembiayaan",
              type: "text",
              required: true,
              disabled: true,
              value: `${IDRFormat(data.Dapem.plafond || 0)} / ${data.Dapem.tenor || 0} Bulan`,
            }}
          />
          <FormInput
            data={{
              label: "Alasan",
              type: "select",
              required: true,
              value: data.type,
              onChange: (e: string) =>
                setData({ ...data, type: e as ESettleStatus }),
              options: [
                { label: "LEPAS", value: "LEPAS" },
                { label: "TOPUP", value: "TOPUP" },
                { label: "MENINGGAL", value: "MENINGGAL" },
                { label: "JATUHTEMPO", value: "JATUHTEMPO" },
              ],
            }}
          />
          <FormInput
            data={{
              label: "Nominal Pelunasan",
              type: "text",
              required: true,
              value: IDRFormat(data.amount),
              onChange: (e: string) =>
                setData({ ...data, amount: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Penalty Pelunasan",
              type: "text",
              required: true,
              value: IDRFormat(data.penalty),
              onChange: (e: string) =>
                setData({ ...data, penalty: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Total",
              type: "text",
              disabled: true,
              value: IDRFormat(data.penalty + data.amount),
            }}
          />
          <FormInput
            data={{
              label: "Keterangan",
              type: "textarea",
              required: true,
              value: data.desc,
              onChange: (e: string) => setData({ ...data, desc: e }),
            }}
          />
          <FormInput
            data={{
              label: "Upload Berkas",
              type: "upload",
              required: true,
              value: data.file_sub,
              onChange: (e: string) => setData({ ...data, file_sub: e }),
            }}
          />

          {rootrecord.dropping_status === "PAID_OFF" ||
            (rootrecord.Pelunasan &&
              rootrecord.Pelunasan.status_paid !== "REJECTED" && (
                <p className="italic text-blue-500 my-2 p-1 border rounded">
                  Data ini sudah lunas atau sedang diajukan pelunasan!!. Mohon
                  tunggu proses selesai atau hapus proses sebelumnya di menu
                  Pelunasan Debitur!
                </p>
              ))}
        </div>
        <div className="flex-1">
          <div className="flex flex-col gap-1 mb-1">
            <FormInput
              data={{
                label: "Sisa Pokok",
                type: "text",
                disabled: true,
                value: IDRFormat(GetSisaPokokMargin(rootrecord).principal),
              }}
            />
            <FormInput
              data={{
                label: "Tunggakan",
                type: "text",
                disabled: true,
                value: (() => {
                  const val = GetSisaPokokMargin(rootrecord);
                  return `(${val.prevcount}) P: ${IDRFormat(val.prevvalueprincipal)} | All: ${IDRFormat(val.prevvalueall)}`;
                })(),
              }}
            />
            <FormInput
              data={{
                label: "Penalty (5%)",
                type: "text",
                disabled: true,
                value: IDRFormat(
                  GetSisaPokokMargin(rootrecord).principal * (5 / 100),
                ),
              }}
            />
            <FormInput
              data={{
                label: "Est Total",
                type: "text",
                disabled: true,
                value: (() => {
                  const val = GetSisaPokokMargin(rootrecord);
                  const penalty = val.principal * (5 / 100);
                  return IDRFormat(val.principal + val.prevvalueall + penalty);
                })(),
              }}
            />
          </div>
          <Table
            columns={columnsangsuran}
            dataSource={rootrecord.Angsuran}
            size="small"
            loading={loading}
            rowKey={"id"}
            bordered
            scroll={{ y: "30vh" }}
            pagination={{ pageSize: 12 }}
          />
        </div>
      </div>
    </Modal>
  );
};

const CekTagihan = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [msg, setMsg] = useState<{ name: string; value: string[] }[]>([]);
  const [periode, setPeriode] = useState("");

  const props: UploadProps = {
    name: "file",
    action: `/api/tagihan/cek?periode=${periode}`,
    accept: ".xlsx,.xls",
    maxCount: 1,

    onChange(info) {
      if (info.file.status === "uploading") {
        return;
      }

      if (info.file.status === "done") {
        const res = info.file.response;

        if (res.status === 200) {
          setMsg(res.data);
        } else {
          setMsg([
            {
              name: "ERROR",
              value: [
                "Internal Server Error",
                "Mohon cek file format tagihan terlebih dahulu!",
                "Pastikan formatnya benar!",
              ],
            },
          ]);
        }
      }

      if (info.file.status === "error") {
        setMsg([
          {
            name: "ERROR",
            value: [
              "Internal Server Error",
              "Mohon cek file format tagihan terlebih dahulu!",
              "Pastikan formatnya benar!",
            ],
          },
        ]);
      }
    },
  };

  return (
    <Modal
      title={"CEK TAGIHAN"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <div className="min-h-32">
        <div className="my-1 flex gap-5 items-center">
          <p className="w-52">Download Format</p>
          <a href="/format_upload_tagihan.xlsx" download>
            <Button type="primary" size="small" icon={<DownloadOutlined />}>
              Download
            </Button>
          </a>
        </div>
        <div className="my-1 flex gap-5 items-center">
          <p className="w-52">Periode Tagihan</p>
          <DatePicker
            picker="month"
            onChange={(val, datestr) => setPeriode(datestr || "")}
            size="small"
          />
        </div>
        <div className="my-1 flex items-center gap-5">
          <span className="w-52">Upload File</span>
          <Upload {...props} disabled={!periode}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              size="small"
              disabled={!periode}
            >
              Browse
            </Button>
          </Upload>
        </div>
        {msg.length > 0 && (
          <div className="mt-4 text-xs">
            <Divider style={{ marginTop: 5, marginBottom: 5 }} />
            <p className="font-bold mb-2">Hasil Cek Tagihan:</p>
            <ul className="list-decimal list-inside">
              {msg.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <p className="w-52">{m.name}</p>
                  <p className="w-5">:</p>
                  <div className="flex-1">
                    <ul className="list-disc list-inside">
                      {m.value.length !== 0 &&
                        m.value.map((mc, ind) => <li key={ind}>{mc}</li>)}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

const columnsangsuran: TableProps<Angsuran>["columns"] = [
  {
    title: "Ke",
    dataIndex: "counter",
    key: "counter",
    width: 70,
    className: "text-xs",
  },
  {
    title: "Jadwal Bayar",
    dataIndex: "date_pay",
    key: "datepay",
    className: "text-xs",
    render(value, record, index) {
      return <>{moment(value).format("DD/MM/YYYY")}</>;
    },
  },
  {
    title: "Pokok",
    dataIndex: "principal",
    key: "principal",
    className: "text-xs",
    render(value, record, index) {
      return <>{IDRFormat(value)}</>;
    },
  },
  {
    title: "Margin",
    dataIndex: "margin",
    key: "margin",
    className: "text-xs",
    render(value, record, index) {
      return <>{IDRFormat(value)}</>;
    },
  },
  {
    title: "Tanggal Bayar",
    dataIndex: "date_paid",
    key: "datepaid",
    className: "text-xs",
    render(value, record, index) {
      return <>{value && moment(value).format("DD/MM/YYYY")}</>;
    },
  },
  {
    title: "Sisa Pokok",
    dataIndex: "remaining",
    key: "remaining",
    className: "text-xs",
    render(value, record, index) {
      return <>{IDRFormat(value)}</>;
    },
  },
];
