import {
  Angsuran,
  Area,
  Berkas,
  Cabang,
  CategoryOfAccount,
  Dapem,
  Debitur,
  Dropping,
  Jaminan,
  JenisPembiayaan,
  JournalDetail,
  JournalEntry,
  Pelunasan,
  ProdukPembiayaan,
  Role,
  Sumdan,
  User,
} from "@prisma/client";

export interface IUser extends User {
  sumdan: string | null;
  cabang: string;
  area: string;
  Role: Role;
}

export interface IPermission {
  path: string;
  access: string[];
}

export interface IActionTable<T> {
  upsert: boolean;
  delete: boolean;
  proses: boolean;
  selected: T | undefined;
}

export interface IPageProps<T> {
  page: number;
  limit: number;
  search: string;
  total: number;
  data: T[];
  [key: string]: any;
}

export interface IViewFiles {
  open: boolean;
  data: { name: string; url: string }[];
}

export interface IDesc {
  name: string;
  date: Date;
  desc: string;
}
export interface ICashDesc {
  amount: number;
  date: Date;
  desc: string;
  file: string;
}
// Models
export interface ISumdan extends Sumdan {
  ProdukPembiayaan: ProdukPembiayaan[];
}

export interface IArea extends Area {
  Cabang: Cabang[];
}
export interface IProdukPembiayaan extends ProdukPembiayaan {
  Sumdan: Sumdan;
}
export interface ISumdanDapem extends Sumdan {
  ProdukPembiayaan: IProdukPembiayaan[];
}
export interface ICabang extends Cabang {
  Area: Area;
}
export interface IUserDapem extends User {
  Cabang: ICabang;
}
export interface IDapem extends Dapem {
  insurance_type: any;
  Debitur: Debitur;
  ProdukPembiayaan: IProdukPembiayaan;
  CreatedBy: IUserDapem;
  AO: IUserDapem;
  Dropping: Dropping | null;
  Berkas: Berkas | null;
  Jaminan: Jaminan | null;
  JenisPembiayaan: JenisPembiayaan;
  Angsuran: Angsuran[];
  Pelunasan: Pelunasan;
}

export interface IDropping extends Dropping {
  Sumdan: Sumdan;
  Dapem: IDapem[];
}
export interface IDocument extends Berkas {
  Sumdan: Sumdan;
  Dapem: IDapem[];
}

export interface ISumdanDropping extends Sumdan {
  Dapem: IDapem[];
}

export interface IDebitur extends Debitur {
  Dapem: IDapem[];
}

export interface IPelunasan extends Pelunasan {
  Dapem: IDapem;
}

export interface IAngsuran extends Angsuran {
  Dapem: IDapem;
}

export interface IJournalDetail extends JournalDetail {
  JournalEntry: JournalEntry;
  User: User | null;
  CategoryOfAccount: CategoryOfAccount;
}

export interface IJournalEntry extends JournalEntry {
  JournalDetail: IJournalDetail[];
}

export interface ICategoryOfAccount extends CategoryOfAccount {
  Children: ICategoryOfAccount[];
  Parent: ICategoryOfAccount | null;
  JournalDetail: IJournalDetail[];
}
// End Models

export interface IExportData {
  data: { [key: string]: any }[];
  sheetname: string;
}

export interface UserType extends User {
  Cabang: Cabang;
  Sumdan: Sumdan;
  Role: Role;
}
