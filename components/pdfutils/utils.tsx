"use client";
export const NumberToWordsID = (n: number): string => {
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];
  const toWords = (x: number): string => {
    x = Math.floor(x);
    if (x < 12) return satuan[x];
    if (x < 20) return toWords(x - 10) + " Belas";
    if (x < 100)
      return (
        toWords(Math.floor(x / 10)) +
        " Puluh" +
        (x % 10 ? " " + toWords(x % 10) : "")
      );
    if (x < 200) return "Seratus" + (x - 100 ? " " + toWords(x - 100) : "");
    if (x < 1000)
      return (
        toWords(Math.floor(x / 100)) +
        " Ratus" +
        (x % 100 ? " " + toWords(x % 100) : "")
      );
    if (x < 2000) return "Seribu" + (x - 1000 ? " " + toWords(x - 1000) : "");
    if (x < 1000000)
      return (
        toWords(Math.floor(x / 1000)) +
        " Ribu" +
        (x % 1000 ? " " + toWords(x % 1000) : "")
      );
    if (x < 1000000000)
      return (
        toWords(Math.floor(x / 1000000)) +
        " Juta" +
        (x % 1000000 ? " " + toWords(x % 1000000) : "")
      );
    if (x < 1000000000000)
      return (
        toWords(Math.floor(x / 1000000000)) +
        " Miliar" +
        (x % 1000000000 ? " " + toWords(x % 1000000000) : "")
      );
    return x.toString();
  };
  if (n === 0) return "Nol";
  return toWords(n);
};

export const Header = (
  title?: string,
  subtitle?: string,
  subtitlemore?: string,
  leftlogo?: string | null,
  rightlogo?: string | null,
) => `
  <div class="page-header flex items-center ${rightlogo || leftlogo ? "justify-between" : "justify-center"} mb-6 border-b pb-4">
    ${leftlogo ? `<img src="${leftlogo}" alt="Logo" class="h-16 mr-4" />` : ""}
    <div class="text-center">
      <h2 class="text-center text-xl font-semibold mb-2 ">${
        title || "JUDUL HALAMAN"
      }</h2>
      <p class="text-center ">${subtitle ? subtitle : ""}</p>
      <p class="text-center ">${subtitlemore ? subtitlemore : ""}</p>
    </div>
    ${rightlogo ? `<img src="${rightlogo}" alt="Logo" class="h-16 mr-4" />` : '<div class="h-16 mr-4"></div>'}
  </div>`;

export const PrintTableStyles = `
  .print-table-wrap {
    margin-top: 2rem;
    border: 1px solid #cbd5e1;
    border-radius: 18px;
    overflow: hidden;
    background: #ffffff;
  }

  .print-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 12px;
    margin: 0;
  }

  .print-table thead th {
    background: #f8fafc;
    color: #475569;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 10px 8px;
    border-bottom: 1px solid #cbd5e1;
  }

  .print-table tbody td {
    padding: 9px 8px;
    vertical-align: top;
    border-bottom: 1px solid #e2e8f0;
  }

  .print-table tfoot td {
    padding: 10px 8px;
    font-weight: 700;
    background: #f8fafc;
    border-top: 1px solid #cbd5e1;
  }

  .print-table th + th,
  .print-table td + td {
    border-left: 1px solid #e2e8f0;
  }

  .print-table tbody tr:last-child td {
    border-bottom: none;
  }

  .print-table .text-muted {
    margin-top: 2px;
    font-size: 10px;
    color: #64748b;
  }
`;

export const ListStyle = (
  list: string[],
  type: "number" | "bullet" | "lower" | "number-alpha" | "lower-alpha",
) => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

  switch (type) {
    case "number":
      // Menggunakan padding-left pada li untuk memberi jarak dari marker
      return `<ol style="list-style-type: decimal; padding-left: 30px;">${list
        .map((item) => `<li style="padding-left: 8px;">${item}</li>`)
        .join("")}</ol>`;

    case "bullet":
      return `<ul style="list-style-type: disc; padding-left: 30px;">${list
        .map((item) => `<li style="padding-left: 8px;">${item}</li>`)
        .join("")}</ul>`;

    case "lower":
      return `<ol style="list-style-type: lower-alpha; padding-left: 30px;">${list
        .map((item) => `<li style="padding-left: 8px;">${item}</li>`)
        .join("")}</ol>`;

    case "number-alpha":
      return list
        .map(
          (item, index) => `
        <div class="flex" style="gap: 12px; margin-bottom: 4px;">
          <div style="min-width: 25px;">(${index + 1})</div>
          <div class="flex-1">${item}</div>
        </div>`,
        )
        .join("");

    case "lower-alpha":
      return list
        .map(
          (item, index) => `
        <div class="flex" style="gap: 12px; margin-bottom: 4px;">
          <div style="min-width: 25px;">(${alphabet[index]})</div>
          <div class="flex-1">${item}</div>
        </div>`,
        )
        .join("");
  }
};

export const ListNonStyle = (
  list: {
    key: string;
    value: any;
    classStyle?: any;
    valuStyle?: any;
    currency?: boolean;
  }[],
) => {
  return `
    ${list
      .map(
        (d) => `
        <div class="flex gap-2 ${d.classStyle ? d.classStyle : ""}">
          <p class="w-44">${d.key}</p>
          <p class="w-4">:</p>
          ${
            d.currency
              ? `
              <div class="w-28 flex justify-between gap-2">
                <p class="w-4">Rp. </p>
                <p class="flex-1 text-right ${d.valuStyle}">${d.value}</p>
              </div>
            `
              : `<div class="flex-1 ${d.valuStyle}">${d.value}</div>`
          }
        </div>
      `,
      )
      .join("")}
    `;
};

export const alplhabet = "abcdefghijklmnopqrstuvwxyz";

export const FormList = (
  data: { key: string; value: string; option?: string[] }[],
) =>
  `<div class="flex-1">
    ${data
      .map(
        (d) => `
      <div class="flex gap-2">
        <p class="w-32 font-bold">${d.key}</p>
        <p class="w-3">:</p>
        <div class="flex-1 border-b border-dashed ${d.option ? "flex justify-between gap-2" : ""}">${
          d.option
            ? `
            ${d.option
              .map(
                (op) => `<div class="flex-1 flex gap-1 items-center">
              <div class="border h-5 w-5 flex justify-center items-center">${d.value.toLowerCase() === op.toLowerCase() ? "x" : ""}</div>
              <p>${op}</p>
            </div>`,
              )
              .join("")}
          `
            : d.value
        }</div>
      </div>
    `,
      )
      .join("")}
  </div>`;
