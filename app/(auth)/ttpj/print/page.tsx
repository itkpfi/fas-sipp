"use client";

import { FormInput } from "@/components";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import {
  IDapem,
  IDocument,
  IPageProps,
  ISumdanDropping,
} from "@/libs/IInterfaces";
import {
  PrinterOutlined,
  RobotOutlined,
  SecurityScanOutlined,
} from "@ant-design/icons";
import { Sumdan } from "@prisma/client";
import { App, Button, Card, Modal, Table, TableProps, Tag } from "antd";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<ISumdanDropping>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const [selecteds, setSelecteds] = useState<IDapem[]>([]);
  const [dropping, setdropping] = useState<IDocument>(defaultData);
  const [open, setOpen] = useState(false);
  const { modal } = App.useApp();

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    const res = await fetch(`/api/ttpj/print?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/ttpj/print", {
      method: "POST",
      body: JSON.stringify(dropping),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          modal.success({ title: "BERHASIL", content: res.msg });
          await getData();
          setOpen(false);
          setSelecteds([]);
          setdropping(defaultData);
        } else {
          modal.error({ title: "ERROR!", content: res.msg });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({ title: "ERROR!", content: "Internal Server Error!" });
      });
    setLoading(false);
  };

  const generateNoSI = async () => {
    setLoading(true);
    const sumdan = selecteds[selecteds.length - 1].ProdukPembiayaan.Sumdan;
    await fetch("/api/ttpj/print?id=" + sumdan.id, {
      method: "PATCH",
    })
      .then((res) => res.json())
      .then((res) => {
        setdropping({
          ...dropping,
          id: res.data,
          sumdanId: sumdan.id,
          Sumdan: sumdan,
          Dapem: selecteds,
        });
      });
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit]);

  return (
    <div>
      <Card
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <SecurityScanOutlined /> Cetak TTPJ
          </div>
        }
        className="app-master-card"
      >
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
          <Button
            size="middle"
            icon={<PrinterOutlined />}
            type="primary"
            className="app-master-action"
            onClick={() => setOpen(true)}
            disabled={selecteds.length === 0}
          >
            Cetak TTPJ
          </Button>
        </div>
        <Table
          className="app-master-table"
          columns={columnSumdan}
          dataSource={pageProps.data}
          size="middle"
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
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <TableDapem data={record.Dapem} setSelecteds={setSelecteds} />
            ),
            rowExpandable: (record) => record.Dapem.length !== 0,
          }}
        />
      </Card>
      {selecteds.length !== 0 && (
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          title={`CETAK TTPJ ${
            selecteds[selecteds.length - 1].ProdukPembiayaan.Sumdan.name
          }`}
          loading={loading}
          okButtonProps={{ loading: loading, onClick: () => handleSubmit() }}
        >
          <div className="flex flex-col gap-2">
            <FormInput
              data={{
                label: "Tanggal TTPJ",
                required: true,
                type: "date",
                value: moment(dropping.created_at).format("YYYY-MM-DD"),
                onChange: (e: string) =>
                  setdropping({
                    ...dropping,
                    created_at: !isNaN(new Date(e).getTime())
                      ? moment(e).toDate()
                      : new Date(),
                  }),
              }}
            />
            <FormInput
              data={{
                label: "Nomor TTPJ",
                required: true,
                type: "text",
                value: dropping.id,
                onChange: (e: string) =>
                  setdropping({
                    ...dropping,
                    id: e,
                  }),
                suffix: (
                  <Button
                    type="primary"
                    size="small"
                    icon={<RobotOutlined />}
                    onClick={() => generateNoSI()}
                  ></Button>
                ),
              }}
            />
            <FormInput
              data={{
                label: "Jumlah Debitur",
                required: true,
                type: "text",
                disabled: true,
                value: selecteds.length,
              }}
            />
            <FormInput
              data={{
                label: "Jumlah Plafond",
                required: true,
                type: "text",
                disabled: true,
                value: IDRFormat(
                  selecteds.reduce((acc, curr) => acc + curr.plafond, 0),
                ),
              }}
            />
          </div>
          <div className="my-4">
            <p className="font-bold">List Account : </p>
            <div className="italic text-xs">
              {selecteds.map((d) => (
                <span key={d.id}>{d.Debitur.fullname}</span>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const TableDapem = ({
  data,
  setSelecteds,
}: {
  data: IDapem[];
  setSelecteds: Function;
}) => {
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
  return (
    <Table
      className="app-master-table"
      pagination={false}
      size="middle"
      rowKey={"id"}
      columns={columnDapem}
      dataSource={data}
      rowSelection={rowSelection}
    />
  );
};

const columnSumdan: TableProps<ISumdanDropping>["columns"] = [
  {
    title: "Mitra",
    key: "sumdan",
    dataIndex: "name",
  },
  {
    title: "End User",
    key: "enduser",
    dataIndex: "enduser",
    className: "text-center",
    render(value, record, index) {
      return <>{record.Dapem.length}</>;
    },
  },
  {
    title: "Total Plafond",
    key: "plafond",
    dataIndex: "plafond",
    render(value, record, index) {
      const total = record.Dapem.reduce((acc, curr) => acc + curr.plafond, 0);
      return <>{IDRFormat(total)}</>;
    },
  },
];

const columnDapem: TableProps<IDapem>["columns"] = [
  {
    title: "ID",
    key: "id",
    dataIndex: "id",
  },
  {
    title: "Pemohon",
    key: "pemohon",
    dataIndex: "pemohon",
    render(value, record, index) {
      return (
        <div>
          <p>{record.Debitur.fullname}</p>
          <p className="opacity-80 text-xs">@{record.nopen}</p>
        </div>
      );
    },
  },
  {
    title: "Plafond",
    key: "plafond",
    dataIndex: "plafond",
    render(value, record, index) {
      return (
        <div>
          <p>{IDRFormat(record.plafond)}</p>
          <p>{record.tenor} Bulan</p>
        </div>
      );
    },
  },
  {
    title: "TBO",
    key: "tbo",
    dataIndex: "tbo",
    render(value, record, index) {
      const created = moment(record.date_contract).add(record.tbo, "month");
      const isTbo = moment().isAfter(created, "date");
      return (
        <div className="flex gap-1">
          <Tag color={isTbo ? "red" : "blue"} variant="solid">
            {isTbo ? "LEWAT TBO" : "MASA TBO"}
          </Tag>
          <div className="text-xs opacity-80">
            <div>Akad {moment(record.date_contract).format("DD/MM/YYYY")}</div>
            <div>TBO Month ({record.tbo} Bln)</div>
            <div>Tgl TBO {created.format("DD/MM/YYYY")}</div>
          </div>
        </div>
      );
    },
  },
];

const defaultData: IDocument = {
  id: "",
  file_sub: null,
  file_proof: null,
  process_at: null,
  status: "DELIVERY",
  created_at: new Date(),
  sumdanId: "",
  Sumdan: {} as Sumdan,
  Dapem: [],
};
