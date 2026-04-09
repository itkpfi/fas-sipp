"use client";

import { CloudUploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Input, Select, Upload, UploadProps } from "antd";
import { useState } from "react";

export interface IFormInput {
  label: string;
  value?: any;
  onChange?: Function;
  prefix?: any;
  suffix?: any;
  mode?: "vertical" | "horizontal";
  type?: "text" | "number" | "select" | "date" | "textarea" | "password" | "upload";
  options?: Array<{
    label: string;
    value: any;
    children?: Array<{ label: string; value: any }>;
  }>;
  disabled?: boolean;
  required?: boolean;
  labelIcon?: any;
  class?: any;
  accept?: string;
}

export const FormInput = ({ data }: { data: IFormInput }) => {
  return (
    <div
      className={`flex rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm ${
        data.mode === "vertical" ? "flex-col gap-2" : "items-start gap-3"
      } ${data.class}`}
    >
      <p className="w-52 pt-2 text-sm font-semibold text-slate-700">
        {data.labelIcon && <span className="mr-1">{data.labelIcon}</span>}
        {data.label}
        {data.required && <span style={{ color: "red" }}>*</span>}
      </p>
      <div className="w-full">
        {data.type === "text" && (
          <Input
            size="large"
            value={data.value}
            onChange={(e) => data.onChange && data.onChange(e.target.value)}
            prefix={data.prefix}
            suffix={data.suffix}
            disabled={data.disabled}
            required={data.required}
            style={{ color: "black" }}
          />
        )}
        {data.type === "date" && (
          <Input
            size="large"
            type="date"
            value={data.value}
            onChange={(e) => data.onChange && data.onChange(e.target.value)}
            prefix={data.prefix}
            suffix={data.suffix}
            disabled={data.disabled}
            required={data.required}
            style={{ color: "black" }}
          />
        )}
        {data.type === "number" && (
          <Input
            size="large"
            type="number"
            value={data.value}
            onChange={(e) => data.onChange && data.onChange(e.target.value)}
            prefix={data.prefix}
            suffix={data.suffix}
            disabled={data.disabled}
            required={data.required}
            style={{ color: "black" }}
          />
        )}
        {data.type === "textarea" && (
          <Input.TextArea
            size="large"
            value={data.value}
            onChange={(e) => data.onChange && data.onChange(e.target.value)}
            disabled={data.disabled}
            required={data.required}
            style={{ color: "black" }}
          />
        )}
        {data.type === "select" && (
          <Select
            size="large"
            options={data.options}
            value={data.value}
            onChange={(e) => data.onChange && data.onChange(e)}
            prefix={data.prefix}
            suffix={data.suffix}
            disabled={data.disabled}
            allowClear
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="label"
          />
        )}
        {data.type === "password" && (
          <Input.Password
            size="large"
            value={data.value}
            onChange={(e) => data.onChange && data.onChange(e.target.value)}
            prefix={data.prefix}
            suffix={data.suffix}
            disabled={data.disabled}
            required={data.required}
            style={{ color: "black" }}
          />
        )}
        {data.type === "upload" && (
          <UploadComponents
            accept={data.accept || ""}
            file={data.value}
            setFile={(e: string) => data.onChange && data.onChange(e)}
            disable={data.disabled}
          />
        )}
      </div>
    </div>
  );
};

const UploadComponents = ({
  file,
  setFile,
  accept,
  disable,
}: {
  file: string | undefined;
  setFile: Function;
  accept: string;
  disable?: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/upload`, {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (resData.secure_url) {
        setFile(resData.secure_url);
      } else {
        setError(resData.error.message);
      }
    } catch (err) {
      console.log(err);
      setError("Internal Server Error");
    }
  };

  const handleDeleteFiles = async () => {
    setLoading(true);
    await fetch("/api/upload", {
      method: "DELETE",
      body: JSON.stringify({ publicId: file }),
    })
      .then(() => {
        setFile(undefined);
      })
      .catch((err) => {
        console.log(err);
        setError("Gagal hapus file!.");
      });
    setLoading(false);
  };

  const props: UploadProps = {
    beforeUpload: async (file) => {
      setLoading(true);
      await handleUpload(file);
      setLoading(false);
      return false;
    },
    showUploadList: false,
    accept: accept,
  };

  return (
    <div>
      {file ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-sm text-slate-600">{file.substring(0, 30) + "..."}</p>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteFiles()}
            loading={loading}
            disabled={disable}
          />
        </div>
      ) : (
        <div>
          <Upload {...props}>
            <Button size="middle" icon={<CloudUploadOutlined />} loading={loading} disabled={disable}>
              Upload Berkas
            </Button>
          </Upload>
          {error && <p className="mt-2 italic text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
};
