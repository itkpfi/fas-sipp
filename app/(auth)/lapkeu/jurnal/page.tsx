"use client";

import { FormInput } from "@/components";
import { TypeAccount } from "@/components/utils/CompUtils";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IJournalDetail,
  IJournalEntry,
  IPageProps,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  AccountBookOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { CategoryOfAccount, JournalEntry, User } from "@prisma/client";
import {
  Table,
  DatePicker,
  Input,
  Button,
  Select,
  Card,
  Modal,
  TableProps,
  App,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";
const { RangePicker } = DatePicker;

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IJournalEntry>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    backdate: "",
    coaId: "",
  });
  const [action, setAction] = useState<IActionTable<IJournalEntry>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [anggotas, setanggotas] = useState<User[]>([]);
  const [akuns, setAkuns] = useState<CategoryOfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/lapkeu/jurnal");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);
    if (pageProps.coaId) params.append("coaId", pageProps.coaId);

    const res = await fetch(`/api/journal?${params.toString()}`);
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
    pageProps.backdate,
    pageProps.coaId,
  ]);

  useEffect(() => {
    (async () => {
      await fetch("/api/user?limit=1000")
        .then((res) => res.json())
        .then((res) => setanggotas(res.data));
      await fetch("/api/coa?limit=1000")
        .then((res) => res.json())
        .then((res) => setAkuns(res.data));
    })();
  }, []);

  const columns: TableProps<IJournalEntry>["columns"] = [
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
      title: "Tanggal Transaksi",
      dataIndex: "date",
      key: "date",
      render(value, record, index) {
        return <div>{moment(record.date).format("DD/MM/YYYY")}</div>;
      },
    },
    {
      title: "Jumlah Transaksi",
      dataIndex: "count",
      key: "count",
      render(value, record, index) {
        return <div>{record.JournalDetail.length}</div>;
      },
    },
    {
      title: "Debet / Kredit",
      dataIndex: "dc",
      key: "dc",
      render(value, record, index) {
        return (
          <div className="text-right">
            {IDRFormat(
              record.JournalDetail.reduce((acc, curr) => acc + curr.debit, 0),
            )}{" "}
            /{" "}
            {IDRFormat(
              record.JournalDetail.reduce((acc, curr) => acc + curr.credit, 0),
            )}
          </div>
        );
      },
    },
    {
      title: "Aksi",
      dataIndex: "action",
      key: "action",
      render(value, record, index) {
        return (
          <div className="flex gap-1 justify-center items-center">
            {hasAccess("update") && (
              <Button
                icon={<EditOutlined />}
                type="primary"
                size="small"
                onClick={() =>
                  setAction({ ...action, upsert: true, selected: record })
                }
              ></Button>
            )}
            {hasAccess("delete") && (
              <Button
                icon={<DeleteOutlined />}
                type="primary"
                danger
                size="small"
                onClick={() =>
                  setAction({ ...action, delete: true, selected: record })
                }
              ></Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <AccountBookOutlined /> JournalEntry
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
              onClick={() => setAction({ ...action, upsert: true })}
            >
              Add New
            </Button>
          )}
          <RangePicker
            className="app-master-picker"
            size="middle"
            onChange={(date, dateStr) =>
              setPageProps({ ...pageProps, backdate: dateStr })
            }
          />
          <Select
            className="app-master-select min-w-[12rem]"
            placeholder="pilih akun..."
            size="middle"
            options={akuns.map((a) => ({
              label: `(${a.id}) ${a.name}`,
              value: a.id,
            }))}
            onChange={(e) => setPageProps({ ...pageProps, coaId: e })}
            allowClear
          />
        </div>
        <div className="app-master-toolbar-search">
          <Input
            size="middle"
            className="app-master-search"
            placeholder="Cari jurnal..."
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
            return <ListJournalDetail records={record} />;
          },
        }}
      />
      <UpsertData
        open={action.upsert}
        setOpen={(val: boolean) => setAction({ ...action, upsert: val })}
        getData={getData}
        record={action.selected}
        key={action.selected ? "upsert" + action.selected.id : "create"}
        anggotas={anggotas}
        akuns={akuns}
        hook={modal}
      />
      {action.selected && (
        <DeleteData
          open={action.delete}
          setOpen={(val: boolean) => setAction({ ...action, delete: val })}
          getData={getData}
          record={action.selected}
          key={action.selected ? "delete" + action.selected.id : "del"}
          hook={modal}
        />
      )}
    </Card>
  );
}

const UpsertData = ({
  open,
  setOpen,
  getData,
  record,
  anggotas,
  akuns,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  getData: Function;
  record?: IJournalEntry;
  anggotas: User[];
  akuns: CategoryOfAccount[];
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IJournalEntry>(record || defaultData);

  const handleSubmit = async () => {
    setLoading(true);
    data.JournalDetail = data.JournalDetail.filter(
      (d) => !(d.credit === 0 && d.debit === 0),
    );
    await fetch("/api/journal", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: "Journal berhasil ditambahkan/diperbarui",
          });
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR", content: res.msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ title: "ERROR", content: "Internal server error" });
      });
    setLoading(false);
  };
  return (
    <div>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title="Buat Journal Entry"
        width={1200}
        loading={loading}
        style={{ top: 20 }}
        onOk={handleSubmit}
      >
        <div className="flex gap-4 flex-wrap mt-4">
          <FormInput
            data={{
              label: "Tanggal Transaksi",
              type: "date",
              class: "flex-1",
              required: true,
              value: moment(data.date).format("YYYY-MM-DD"),
              onChange: (e: string) => setData({ ...data, date: new Date(e) }),
            }}
          />
          <div className="w-full border border-dashed p-2">
            <p className="text-center font-bold text-lg border-b">
              Daftar Transaksi
            </p>
            <div className="flex gap-4 my-2 font-bold">
              <div className="w-56">KETERANGAN</div>
              <div className="w-56">DEBIT</div>
              <div className="w-56">KREDIT</div>
              <div className="w-56">ID AKUN</div>
              <div className="w-56">ID ANGGOTA</div>
            </div>
            {data.JournalDetail.map((d, i) => (
              <div className="flex gap-4 my-2 flex-wrap" key={i}>
                <div className="w-52">
                  <Input.TextArea
                    value={d.desciption || ""}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      const newValue = e.target.value;

                      setData((prev) => ({
                        ...prev,
                        JournalDetail: prev.JournalDetail.map((item, index) =>
                          index === i
                            ? { ...item, desciption: newValue }
                            : item,
                        ),
                      }));
                    }}
                  />
                </div>
                <div className="w-52">
                  <Input
                    value={IDRFormat(d.debit)}
                    onChange={(e) => {
                      const newValue = e.target.value;

                      setData((prev) => ({
                        ...prev,
                        JournalDetail: prev.JournalDetail.map((item, index) =>
                          index === i
                            ? { ...item, debit: IDRToNumber(newValue || "0") }
                            : item,
                        ),
                      }));
                    }}
                    style={{ textAlign: "right" }}
                  />
                </div>
                <div className="w-52">
                  <Input
                    value={IDRFormat(d.credit)}
                    onChange={(e) => {
                      const newValue = e.target.value;

                      setData((prev) => ({
                        ...prev,
                        JournalDetail: prev.JournalDetail.map((item, index) =>
                          index === i
                            ? { ...item, credit: IDRToNumber(newValue || "0") }
                            : item,
                        ),
                      }));
                    }}
                    style={{ textAlign: "right" }}
                  />
                </div>
                <div className="w-52">
                  <Select
                    style={{ width: "100%" }}
                    placeholder="ID Akun"
                    optionFilterProp="label"
                    showSearch
                    allowClear
                    options={akuns.map((a) => ({
                      label: `(${TypeAccount(a)}-${a.id}) ${a.name}`,
                      value: a.id,
                    }))}
                    value={d.categoryOfAccountId}
                    onChange={(e) => {
                      setData((prev) => ({
                        ...prev,
                        JournalDetail: prev.JournalDetail.map((item, index) =>
                          index === i
                            ? { ...item, categoryOfAccountId: e }
                            : item,
                        ),
                      }));
                    }}
                  />
                </div>
                <div className="w-52">
                  <Select
                    style={{ width: "100%" }}
                    placeholder="ID Anggota"
                    optionFilterProp="label"
                    showSearch
                    allowClear
                    options={anggotas.map((a) => ({
                      label: `${a.fullname} (${a.nip})`,
                      value: a.id,
                    }))}
                    value={d.userId}
                    onChange={(e) => {
                      setData((prev) => ({
                        ...prev,
                        JournalDetail: prev.JournalDetail.map((item, index) =>
                          index === i ? { ...item, userId: e } : item,
                        ),
                      }));
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-24 my-2 border-t border-dashed font-bold">
              <div className="w-56"></div>
              <div className="w-56">
                <div>TOTAL DEBIT</div>
                <div className="text-right">
                  {IDRFormat(
                    data.JournalDetail.reduce(
                      (acc, curr) => acc + curr.debit,
                      0,
                    ),
                  )}
                </div>
              </div>
              <div className="w-56">
                <div>TOTAL KREDIT</div>
                <div className="text-right">
                  {IDRFormat(
                    data.JournalDetail.reduce(
                      (acc, curr) => acc + curr.credit,
                      0,
                    ),
                  )}
                </div>
              </div>
              <div className="w-56">
                {(() => {
                  const debit = data.JournalDetail.reduce(
                    (acc, curr) => acc + curr.debit,
                    0,
                  );
                  const credit = data.JournalDetail.reduce(
                    (acc, curr) => acc + curr.credit,
                    0,
                  );
                  return (
                    <>
                      {debit !== credit && (
                        <span className="text-red-600">
                          Selisih {IDRFormat(debit - credit)}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="w-56"></div>
            </div>
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              block
              onClick={() =>
                setData({
                  ...data,
                  JournalDetail: [...data.JournalDetail, defaultJournal],
                })
              }
            >
              Tambah Transaksi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ListJournalDetail = ({ records }: { records: IJournalEntry }) => {
  const columns: TableProps<IJournalDetail>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render(value, record, index) {
        return (
          <div>
            <div>{index + 1}</div>
            <div className="opacity-70 text-xs italic">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: "Keterangan",
      dataIndex: "desciption",
      key: "desciption",
      className: "text-xs italic",
    },
    {
      title: "ID Akun & Anggota",
      dataIndex: "akun",
      key: "akun",
      render(value, record, index) {
        return (
          <div className="italic text-xs">
            <div>
              ({TypeAccount(record.CategoryOfAccount)}-
              {record.CategoryOfAccount.id}) {record.CategoryOfAccount.name}
            </div>
            <div className="opacity-80">
              {record.User && `${record.User.fullname} (${record.User.nip})`}
            </div>
          </div>
        );
      },
    },
    {
      title: "Debit",
      dataIndex: "db",
      key: "db",
      render(value, record, index) {
        return <div className="text-right">{IDRFormat(record.debit)}</div>;
      },
    },
    {
      title: "Kredit",
      dataIndex: "cr",
      key: "cr",
      render(value, record, index) {
        return <div className="text-right">{IDRFormat(record.credit)}</div>;
      },
    },
  ];

  return (
    <div className="ms-15">
      <Table
        className="app-master-table"
        columns={columns}
        dataSource={records.JournalDetail}
        rowKey={"id"}
        pagination={false}
        size="middle"
      />
    </div>
  );
};

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: IJournalEntry;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/journal?id=" + record.id, { method: "DELETE" })
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
          content: `Internal Server Error!!. Hapus data COA ${record.id}) gagal`,
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Konfirmasi Hapus"
      loading={loading}
      onOk={handleDelete}
    >
      <p className="my-3">
        Konfirmasi penghapusan Transaksi ini *{record.id}*?
      </p>
    </Modal>
  );
};

const defaultJournal: IJournalDetail = {
  id: "1",
  debit: 0,
  credit: 0,
  desciption: "",
  categoryOfAccountId: "",
  journalEntryId: "1",
  userId: null,
  JournalEntry: {} as JournalEntry,
  CategoryOfAccount: {} as CategoryOfAccount,
  User: null,
};

const defaultData: IJournalEntry = {
  id: "1",
  date: new Date(),
  JournalDetail: [defaultJournal],
};
