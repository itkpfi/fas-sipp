import {
  AccountBookOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  BorderOuterOutlined,
  BranchesOutlined,
  CalculatorOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DiffOutlined,
  DollarCircleOutlined,
  FileProtectOutlined,
  FolderOpenOutlined,
  KeyOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  PieChartOutlined,
  ReadOutlined,
  RobotOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  SlidersOutlined,
  SnippetsOutlined,
  TeamOutlined,
  TransactionOutlined,
} from "@ant-design/icons";

export interface IMenu {
  label: string | React.ReactNode;
  key: string;
  icon: string | React.ReactNode;
  needaccess: boolean;
}
export interface IMenuType extends IMenu {
  children?: IMenu[];
}

export const listMenuUI: IMenuType[] = [
  {
    label: "Dashboard",
    key: "/dashboard",
    icon: <DashboardOutlined />,
    needaccess: false,
  },
  {
    label: "Dashboard Bisnis",
    key: "/dashboardbis",
    icon: <DashboardOutlined />,
    needaccess: true,
  },
  {
    label: "Simulasi Pembiayaan",
    key: "/simulasi",
    icon: <CalculatorOutlined />,
    needaccess: true,
  },
  {
    label: "Monitoring Pembiayaan",
    key: "/monitoring",
    icon: <ReadOutlined />,
    needaccess: true,
  },
  {
    label: "Pending Data",
    key: "/pendingdata",
    icon: <ReadOutlined />,
    needaccess: true,
  },
  {
    label: "Proses Pembiayaan",
    key: "/proses",
    icon: <FileProtectOutlined />,
    needaccess: true,
    children: [
      {
        label: "Verifikasi Pembiayaan",
        key: "/proses/verif",
        icon: <FileProtectOutlined />,
        needaccess: true,
      },
      {
        label: "Verifikasi SLIK",
        key: "/proses/slik",
        icon: <FileProtectOutlined />,
        needaccess: true,
      },
      {
        label: "Approval Pembiayaan",
        key: "/proses/approv",
        icon: <FileProtectOutlined />,
        needaccess: true,
      },
    ],
  },
  {
    label: "Dropping Pembiayaan",
    key: "/pencairan",
    icon: <TransactionOutlined />,
    needaccess: true,
    children: [
      {
        label: "Cetak SI",
        key: "/pencairan/print",
        icon: <DiffOutlined />,
        needaccess: true,
      },
      {
        label: "Permohonan Dropping",
        key: "/pencairan/dropping",
        icon: <DollarCircleOutlined />,
        needaccess: true,
      },
    ],
  },
  {
    label: "Sending Document",
    key: "/ttpb",
    icon: <FolderOpenOutlined />,
    needaccess: true,
    children: [
      {
        label: "Cetak SD",
        key: "/ttpb/print",
        icon: <DiffOutlined />,
        needaccess: true,
      },
      {
        label: "Permohonan SD",
        key: "/ttpb/dropping",
        icon: <FolderOpenOutlined />,
        needaccess: true,
      },
    ],
  },
  {
    label: "Sending Jaminan",
    key: "/ttpj",
    icon: <SecurityScanOutlined />,
    needaccess: true,
    children: [
      {
        label: "Cetak TPPJ",
        key: "/ttpj/print",
        icon: <DiffOutlined />,
        needaccess: true,
      },
      {
        label: "Permohonan TPPJ",
        key: "/ttpj/dropping",
        icon: <SecurityScanOutlined />,
        needaccess: true,
      },
    ],
  },
  {
    label: "Daftar Nominatif",
    key: "/nominatif",
    icon: <FileProtectOutlined />,
    needaccess: true,
  },
  {
    label: "Tagihan",
    key: "/tagihan",
    icon: <MoneyCollectOutlined />,
    needaccess: true,
  },
  {
    label: "Data Debitur",
    key: "/debitur",
    icon: <BookOutlined />,
    needaccess: true,
  },
  {
    label: "Pelunasan Debitur",
    key: "/pelunasan",
    icon: <MoneyCollectOutlined />,
    needaccess: true,
  },
  {
    label: "Laporan Keuangan",
    key: "/lapkeu",
    icon: <PieChartOutlined />,
    needaccess: true,
    children: [
      {
        label: "Chart Of Account",
        key: "/lapkeu/coa",
        icon: <SnippetsOutlined />,
        needaccess: true,
      },
      {
        label: "Jurnal Entry",
        key: "/lapkeu/jurnal",
        icon: <AccountBookOutlined />,
        needaccess: true,
      },
      {
        label: "Neraca",
        key: "/lapkeu/neraca",
        icon: <BarChartOutlined />,
        needaccess: true,
      },
      {
        label: "Neraca Rugilaba",
        key: "/lapkeu/neraca-rugilaba",
        icon: <PercentageOutlined />,
        needaccess: true,
      },
      {
        label: "Rugilaba",
        key: "/lapkeu/rugilaba",
        icon: <SlidersOutlined />,
        needaccess: true,
      },
    ],
  },
  {
    label: "Database",
    key: "/database",
    icon: <DatabaseOutlined />,
    needaccess: true,
  },
  {
    label: "Profile Setting",
    key: "/profile",
    icon: <SettingOutlined />,
    needaccess: false,
  },
  {
    label: "Master Data",
    key: "/master",
    icon: <RobotOutlined />,
    needaccess: true,
    children: [
      {
        label: "Manajemen Role",
        key: "/master/roles",
        icon: <KeyOutlined />,
        needaccess: true,
      },
      {
        label: "Manajemen User",
        key: "/master/users",
        icon: <TeamOutlined />,
        needaccess: true,
      },
      {
        label: "Manajemen Unit",
        key: "/master/area",
        icon: <BranchesOutlined />,
        needaccess: true,
      },
      {
        label: "Manajemen Mitra",
        key: "/master/mitra",
        icon: <BankOutlined />,
        needaccess: true,
      },
      {
        label: "Jenis Pembiayaan",
        key: "/master/jenis",
        icon: <BorderOuterOutlined />,
        needaccess: true,
      },
    ],
  },
];

export const listMenuServer: { key: string; needaccess: boolean }[] = [
  {
    key: "/dashboard",
    needaccess: false,
  },
  {
    key: "/dashboardbis",
    needaccess: true,
  },
  {
    key: "/simulasi",
    needaccess: true,
  },
  {
    key: "/monitoring",
    needaccess: true,
  },
  {
    key: "/pendingdata",
    needaccess: true,
  },
  {
    key: "/proses/verif",
    needaccess: true,
  },
  {
    key: "/proses/slik",
    needaccess: true,
  },
  {
    key: "/proses/approv",
    needaccess: true,
  },
  {
    key: "/pencairan/print",
    needaccess: true,
  },
  {
    key: "/pencairan/dropping",
    needaccess: true,
  },
  {
    key: "/tppb/print",
    needaccess: true,
  },
  {
    key: "/tppb/dropping",
    needaccess: true,
  },
  {
    key: "/tppj/print",
    needaccess: true,
  },
  {
    key: "/tppj/dropping",
    needaccess: true,
  },
  {
    key: "/nominatif",
    needaccess: true,
  },
  {
    key: "/tagihan",
    needaccess: true,
  },
  {
    key: "/debitur",
    needaccess: true,
  },
  {
    key: "/pelunasan",
    needaccess: true,
  },
  {
    key: "/lapkeu/coa",
    needaccess: true,
  },
  {
    key: "/lapkeu/jurnal",
    needaccess: true,
  },
  {
    key: "/lapkeu/neraca",
    needaccess: true,
  },
  {
    key: "/lapkeu/neraca-rugilaba",
    needaccess: true,
  },
  {
    key: "/lapkeu/rugilaba",
    needaccess: true,
  },
  {
    key: "/database",
    needaccess: true,
  },
  {
    key: "/master/users",
    needaccess: true,
  },
  {
    key: "/profile",
    needaccess: false,
  },
  {
    key: "/master/roles",
    needaccess: true,
  },
  {
    key: "/master/mitra",
    needaccess: true,
  },
  {
    key: "/master/user",
    needaccess: true,
  },
  {
    key: "/master/area",
    needaccess: true,
  },
  {
    key: "/master/jenis",
    needaccess: true,
  },
];

export const MenuPermission = (
  items: IMenuType[],
  allowedKeys: string[],
): any[] => {
  return items
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const filteredChildren = MenuPermission(item.children, allowedKeys);
        const { needaccess, ...c } = item;

        if (filteredChildren.length > 0) {
          return {
            ...c,
            children: filteredChildren,
          };
        }
      }
      const { needaccess, ...rt } = item;
      const isAllowed = !item.needaccess
        ? true
        : allowedKeys.includes(item.key);
      if (isAllowed) {
        return rt;
      }

      return null;
    })
    .filter(Boolean) as any[];
};
