"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ProfileOutlined,
  BarChartOutlined,
  SearchOutlined,
  ReloadOutlined,
  PayCircleOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Statistic,
  Table,
  TableProps,
  Tag,
  Tooltip,
  message,
} from "antd";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";

interface IAngsuranDetail {
  id: string;
  counter: number;
  principal: number;
  margin: number;
  date_pay: string;
  date_paid: string | null;
  remaining: number;
  inst_sumdan: number;
  fee_banpot: number;
}

interface IPelunasanDetail {
  id: string;
  amount: number;
  type: string;
  process_at: string | null;
}

interface ITagihan {
  id: string;
  nopen: string;
  fullname: string;
  plafond: number;
  tenor: number;
  noKontrak: string;
  totalAngsuran: number;
  angsuranBelumBayar: number;
  angsuranSudahBayar: number;
  angsuranList: IAngsuranDetail[];
  pelunasan: IPelunasanDetail | null;
  createdAt: string;
}

type TStatusFilter = "all" | "overdue" | "active" | "paid" | "waiting";

const getSortedAngsuran = (angsuranList: IAngsuranDetail[] = []) =>
  [...angsuranList].sort((a, b) => {
    const diff = moment(a.date_pay).valueOf() - moment(b.date_pay).valueOf();
    return diff !== 0 ? diff : a.counter - b.counter;
  });

const isAngsuranOverdue = (record: IAngsuranDetail) =>
  !record.date_paid &&
  moment().startOf("day").isAfter(moment(record.date_pay).startOf("day"));

const getNextUnpaidAngsuran = (record: ITagihan) =>
  getSortedAngsuran(record.angsuranList).find((item) => !item.date_paid) ?? null;

const getTagihanStatusMeta = (record: ITagihan) => {
  const unpaidAngsuran = getSortedAngsuran(record.angsuranList).filter(
    (item) => !item.date_paid,
  );

  if (unpaidAngsuran.length === 0) {
    return { value: "paid" as const, label: "LUNAS", color: "success" as const };
  }

  if (unpaidAngsuran.some(isAngsuranOverdue)) {
    return {
      value: "overdue" as const,
      label: "OVERDUE",
      color: "error" as const,
    };
  }

  if (record.angsuranSudahBayar > 0) {
    return {
      value: "active" as const,
      label: "BERJALAN",
      color: "processing" as const,
    };
  }

  return {
    value: "waiting" as const,
    label: "BELUM MULAI",
    color: "default" as const,
  };
};

export default function Page() {
  const [data, setData] = useState<ITagihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ITagihan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { hasAccess } = useAccess("/tagihan/data-tagihan");
  const { modal } = App.useApp();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedRowKeys([]);
  }, [search, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tagihan-data");
      const result = await res.json();
      if (result.success) {
        const nextData = (result.data ?? []) as ITagihan[];
        setData(nextData);
        return nextData;
      }

      message.error("Gagal memuat data tagihan");
      return [] as ITagihan[];
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Terjadi kesalahan saat memuat data");
      return [] as ITagihan[];
    } finally {
      setLoading(false);
    }
  };

  const syncSelectedRecord = (nextData: ITagihan[]) => {
    if (!selectedRecord) return;

    const updatedRecord = nextData.find((item) => item.id === selectedRecord.id) ?? null;
    setSelectedRecord(updatedRecord);
    if (!updatedRecord) setDetailOpen(false);
  };

  const handleView = (record: ITagihan) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((record) => {
      const status = getTagihanStatusMeta(record);
      const matchesStatus = statusFilter === "all" || status.value === statusFilter;
      const matchesKeyword =
        keyword.length === 0 ||
        [record.nopen, record.fullname, record.noKontrak]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));

      return matchesStatus && matchesKeyword;
    });
  }, [data, search, statusFilter]);

  const selectedRecords = useMemo(
    () => filteredData.filter((record) => selectedRowKeys.includes(record.id)),
    [filteredData, selectedRowKeys],
  );

  const actionableSelected = useMemo(
    () =>
      selectedRecords
        .map((record) => ({ record, nextAngsuran: getNextUnpaidAngsuran(record) }))
        .filter(
          (
            item,
          ): item is {
            record: ITagihan;
            nextAngsuran: IAngsuranDetail;
          } => Boolean(item.nextAngsuran),
        ),
    [selectedRecords],
  );

  const submitPaymentProcess = async (
    angsuranList: IAngsuranDetail[],
    successMessage: string,
  ) => {
    if (angsuranList.length === 0) {
      message.warning("Tidak ada angsuran yang bisa diproses");
      return;
    }

    try {
      const res = await fetch("/api/tagihan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(angsuranList),
      });
      const result = await res.json();

      if (!res.ok || result.status !== 200) {
        throw new Error(result.msg || "Gagal memproses pembayaran");
      }

      message.success(successMessage);
      setSelectedRowKeys([]);
      const nextData = await fetchData();
      syncSelectedRecord(nextData);
    } catch (error) {
      console.error(error);
      message.error("Gagal memproses pembayaran tagihan");
    }
  };

  const handleProcessSingle = (record: ITagihan) => {
    const nextAngsuran = getNextUnpaidAngsuran(record);
    if (!nextAngsuran) {
      message.info("Semua angsuran debitur ini sudah lunas");
      return;
    }

    modal.confirm({
      title: "Proses pembayaran angsuran berikutnya?",
      content: (
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Debitur <span className="font-semibold text-slate-900">{record.fullname}</span>
          </p>
          <p>
            Akan diproses angsuran ke-
            <span className="font-semibold text-slate-900"> {nextAngsuran.counter}</span>
            {" "}dengan nominal
            <span className="font-semibold text-slate-900">
              {" "}
              {IDRFormat(nextAngsuran.principal + nextAngsuran.margin)}
            </span>
            .
          </p>
        </div>
      ),
      okText: "Proses Bayar",
      cancelText: "Batal",
      onOk: () =>
        submitPaymentProcess(
          [nextAngsuran],
          `Pembayaran ${record.fullname} berhasil diproses`,
        ),
    });
  };

  const handleProcessBulk = () => {
    if (actionableSelected.length === 0) {
      message.warning("Pilih data yang masih punya angsuran belum dibayar");
      return;
    }

    modal.confirm({
      title: "Proses pembayaran data terpilih?",
      content: (
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Total data dipilih:
            <span className="font-semibold text-slate-900"> {selectedRecords.length}</span>
          </p>
          <p>
            Yang akan diproses sekarang:
            <span className="font-semibold text-slate-900"> {actionableSelected.length}</span>
            {" "}angsuran berikutnya.
          </p>
          {selectedRecords.length !== actionableSelected.length && (
            <p className="text-xs text-amber-600">
              Beberapa data dilewati karena seluruh angsurannya sudah lunas.
            </p>
          )}
        </div>
      ),
      okText: "Proses Terpilih",
      cancelText: "Batal",
      onOk: () =>
        submitPaymentProcess(
          actionableSelected.map((item) => item.nextAngsuran),
          `${actionableSelected.length} pembayaran berhasil diproses`,
        ),
    });
  };

  const rowSelection: TableProps<ITagihan>["rowSelection"] = hasAccess("update")
    ? {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys as string[]),
        getCheckboxProps: (record) => ({
          disabled: !getNextUnpaidAngsuran(record),
        }),
      }
    : undefined;

  const columns: TableProps<ITagihan>["columns"] = [
    {
      title: "No",
      width: 60,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "NOPEN",
      dataIndex: "nopen",
      width: 120,
    },
    {
      title: "Nama Debitur",
      dataIndex: "fullname",
      width: 220,
    },
    {
      title: "No Kontrak",
      dataIndex: "noKontrak",
      width: 220,
    },
    {
      title: "Plafond",
      dataIndex: "plafond",
      width: 140,
      align: "right",
      render: (value: number) => IDRFormat(value),
    },
    {
      title: "Tenor",
      dataIndex: "tenor",
      width: 90,
      align: "center",
      render: (value: number) => `${value} Bln`,
    },
    {
      title: "Total Tagihan",
      dataIndex: "totalAngsuran",
      width: 120,
      align: "center",
    },
    {
      title: "Sudah Bayar",
      dataIndex: "angsuranSudahBayar",
      width: 110,
      align: "center",
      render: (value: number) => <Tag color="success">{value}</Tag>,
    },
    {
      title: "Belum Bayar",
      dataIndex: "angsuranBelumBayar",
      width: 110,
      align: "center",
      render: (value: number) => <Tag color={value > 0 ? "error" : "default"}>{value}</Tag>,
    },
    {
      title: "Status Tagihan",
      width: 140,
      align: "center",
      render: (_, record) => {
        const status = getTagihanStatusMeta(record);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: "Tagihan Berikutnya",
      width: 220,
      render: (_, record) => {
        const nextAngsuran = getNextUnpaidAngsuran(record);

        if (!nextAngsuran) {
          return <Tag color="success">Semua angsuran lunas</Tag>;
        }

        return (
          <div className="space-y-1 text-sm">
            <div className="font-medium text-slate-900">
              Ke-{nextAngsuran.counter} · {IDRFormat(nextAngsuran.principal + nextAngsuran.margin)}
            </div>
            <div className="text-xs text-slate-500">
              Jatuh tempo {moment(nextAngsuran.date_pay).format("DD-MM-YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      width: 130,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        const nextAngsuran = getNextUnpaidAngsuran(record);

        return (
          <div className="flex items-center justify-center gap-2">
            {hasAccess("update") && (
              <Tooltip title="Proses bayar angsuran berikutnya">
                <Button
                  size="small"
                  className="app-table-action-btn"
                  icon={<PayCircleOutlined />}
                  onClick={() => handleProcessSingle(record)}
                  disabled={!nextAngsuran}
                />
              </Tooltip>
            )}
            <Tooltip title="Lihat detail tagihan">
              <Button
                size="small"
                className="app-table-action-btn"
                icon={<EyeOutlined />}
                onClick={() => handleView(record)}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Card
        className="app-master-card"
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileTextOutlined /> Data Tagihan
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {hasAccess("update") && (
                <Button
                  type="primary"
                  size="middle"
                  className="app-master-action"
                  icon={<CheckCircleOutlined />}
                  onClick={handleProcessBulk}
                  disabled={actionableSelected.length === 0}
                >
                  Proses Terpilih
                </Button>
              )}
              <Button
                size="middle"
                className="app-master-action"
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setSelectedRowKeys([]);
                }}
              >
                Reset
              </Button>
              {selectedRowKeys.length > 0 && (
                <div className="app-soft-pill w-fit !bg-slate-50 !text-slate-600 !shadow-none">
                  Dipilih {selectedRowKeys.length} data
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                size="middle"
                className="app-master-select min-w-[12rem]"
                options={[
                  { label: "Semua status", value: "all" },
                  { label: "Overdue", value: "overdue" },
                  { label: "Berjalan", value: "active" },
                  { label: "Sudah lunas", value: "paid" },
                  { label: "Belum mulai", value: "waiting" },
                ]}
              />
              <div className="app-master-toolbar-search">
                <Input
                  size="middle"
                  className="app-master-search"
                  placeholder="Cari nopen, debitur, kontrak..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Ringkasan tagihan dan detail angsuran aktif per debitur. Checklist baris untuk
              memproses angsuran unpaid berikutnya secara massal.
            </p>
            <div className="app-soft-pill w-fit !bg-slate-50 !text-slate-600 !shadow-none">
              Total data {filteredData.length}
            </div>
          </div>
        </div>

        <Table
          className="app-master-table"
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          size="middle"
          rowSelection={rowSelection}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} data`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {selectedRecord && (
        <ModalDetailTagihan
          data={selectedRecord}
          open={detailOpen}
          setOpen={setDetailOpen}
          canUpdate={hasAccess("update")}
          onProcessAngsuran={(angsuran) =>
            modal.confirm({
              title: "Proses pembayaran angsuran ini?",
              content: (
                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    Debitur <span className="font-semibold text-slate-900">{selectedRecord.fullname}</span>
                  </p>
                  <p>
                    Angsuran ke-
                    <span className="font-semibold text-slate-900"> {angsuran.counter}</span>
                    {" "}dengan nominal
                    <span className="font-semibold text-slate-900">
                      {" "}
                      {IDRFormat(angsuran.principal + angsuran.margin)}
                    </span>
                    .
                  </p>
                </div>
              ),
              okText: "Proses Bayar",
              cancelText: "Batal",
              onOk: () =>
                submitPaymentProcess(
                  [angsuran],
                  `Angsuran ${selectedRecord.fullname} berhasil diproses`,
                ),
            })
          }
        />
      )}
    </div>
  );
}

const ModalDetailTagihan = ({
  data,
  open,
  setOpen,
  canUpdate,
  onProcessAngsuran,
}: {
  data: ITagihan;
  open: boolean;
  setOpen: (open: boolean) => void;
  canUpdate: boolean;
  onProcessAngsuran: (angsuran: IAngsuranDetail) => void;
}) => {
  const getAngsuranStatus = (record: IAngsuranDetail) => {
    if (record.date_paid) {
      return {
        label: "LUNAS",
        color: "success" as const,
        icon: <CheckCircleOutlined />,
      };
    }

    if (isAngsuranOverdue(record)) {
      return {
        label: "OVERDUE",
        color: "error" as const,
        icon: <ClockCircleOutlined />,
      };
    }

    return {
      label: "BELUM JATUH TEMPO",
      color: "processing" as const,
      icon: <CalendarOutlined />,
    };
  };

  const angsuranColumns: TableProps<IAngsuranDetail>["columns"] = [
    {
      title: "Ke",
      width: 50,
      align: "center",
      render: (_, record) => record.counter,
    },
    {
      title: "Tanggal Jatuh Tempo",
      width: 150,
      align: "center",
      render: (_, record) => moment(record.date_pay).format("DD-MM-YYYY"),
    },
    {
      title: "Pokok",
      width: 130,
      align: "right",
      render: (_, record) => IDRFormat(record.principal),
    },
    {
      title: "Margin",
      width: 130,
      align: "right",
      render: (_, record) => IDRFormat(record.margin),
    },
    {
      title: "Angsuran",
      width: 130,
      align: "right",
      render: (_, record) => IDRFormat(record.principal + record.margin),
    },
    {
      title: "Status",
      width: 140,
      align: "center",
      render: (_, record) => {
        const status = getAngsuranStatus(record);

        return (
          <Tag icon={status.icon} color={status.color}>
            {status.label}
          </Tag>
        );
      },
    },
  ];

  if (canUpdate) {
    angsuranColumns.push({
      title: "Aksi",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Tooltip title={record.date_paid ? "Angsuran sudah lunas" : "Proses bayar angsuran"}>
          <Button
            size="small"
            className="app-table-action-btn"
            icon={<PayCircleOutlined />}
            onClick={() => onProcessAngsuran(record)}
            disabled={Boolean(record.date_paid)}
          />
        </Tooltip>
      ),
    });
  }

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={[
        <Button
          key="close"
          onClick={() => setOpen(false)}
          size="middle"
          className="app-master-action"
        >
          Tutup
        </Button>,
      ]}
      width={1080}
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <ProfileOutlined /> Detail Tagihan
        </div>
      }
    >
      <div className="space-y-4">
        <Card
          className="app-card-muted !rounded-2xl !shadow-none"
          title={
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <ProfileOutlined /> Informasi Debitur
            </div>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
                <span className="font-semibold text-slate-600">NOPEN</span>
                <span className="text-right font-medium text-slate-900">{data.nopen}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
                <span className="font-semibold text-slate-600">Nama Debitur</span>
                <span className="text-right font-medium text-slate-900">{data.fullname}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
                <span className="font-semibold text-slate-600">No Kontrak</span>
                <span className="text-right font-medium text-slate-900">{data.noKontrak}</span>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
                <span className="font-semibold text-slate-600">Plafond</span>
                <span className="text-right font-bold text-emerald-600">
                  {IDRFormat(data.plafond)}
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
                <span className="font-semibold text-slate-600">Tenor</span>
                <span className="text-right font-medium text-slate-900">{data.tenor} Bulan</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
                <span className="font-semibold text-slate-600">Tanggal Pinjaman</span>
                <span className="text-right font-medium text-slate-900">
                  {moment(data.createdAt).format("DD-MM-YYYY")}
                </span>
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          className="app-card-muted !rounded-2xl !shadow-none"
          title={
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BarChartOutlined /> Statistik Tagihan
            </div>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Statistic
                  title="Total Tagihan"
                  value={data.totalAngsuran}
                  valueStyle={{ color: "#0f172a" }}
                />
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <Statistic
                  title="Sudah Dibayar"
                  value={data.angsuranSudahBayar}
                  valueStyle={{ color: "#059669" }}
                  prefix={<CheckCircleOutlined />}
                />
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3">
                <Statistic
                  title="Belum Dibayar"
                  value={data.angsuranBelumBayar}
                  valueStyle={{ color: "#e11d48" }}
                  prefix={<ClockCircleOutlined />}
                />
              </div>
            </Col>
            <Col xs={24} sm={6}>
              <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3">
                <Statistic
                  title="Progress"
                  value={
                    data.totalAngsuran > 0
                      ? Math.round((data.angsuranSudahBayar / data.totalAngsuran) * 100)
                      : 0
                  }
                  suffix="%"
                  valueStyle={{ color: "#0284c7" }}
                  prefix={<CalendarOutlined />}
                />
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          className="app-card-muted !rounded-2xl !shadow-none"
          title={
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <BarChartOutlined /> Jadwal Lengkap Angsuran
            </div>
          }
        >
          <Table
            className="app-master-table"
            columns={angsuranColumns}
            dataSource={getSortedAngsuran(data.angsuranList)}
            rowKey="id"
            size="middle"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} angsuran`,
            }}
            scroll={{ x: 720 }}
          />
        </Card>
      </div>
    </Modal>
  );
};
