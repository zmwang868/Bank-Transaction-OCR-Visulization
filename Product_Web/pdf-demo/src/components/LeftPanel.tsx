import React, { useMemo, useState } from "react";
import {
    Button,
    Card,
    Typography,
    Upload,
    message,
    Space,
    Tag,
    Divider,
    Alert,
} from "antd";
import type { UploadProps } from "antd";

const { Title, Text } = Typography;

type UploadState =
    | { status: "idle" }
    | { status: "selected"; file: File }
    | { status: "uploading"; file: File }
    | { status: "uploaded"; file: File; fileId: string }
    | { status: "extracting"; file: File; fileId: string }
    | { status: "done"; file: File; fileId: string; jobId: string };

function genId(prefix: string): string {
    const rand = Math.random().toString(16).slice(2);
    const time = Date.now().toString(16);
    return `${prefix}_${time}_${rand}`;
}

async function uploadPdfMock(file: File): Promise<{ fileId: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return {
        fileId: genId("file"),
    };
}

async function extractPdfMock(fileId: string): Promise<{ jobId: string }> {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
        jobId: genId("job"),
    };
}

type Props = {
    onFileSelected?: (file: File | null) => void;
    onUploaded?: () => void;
    onReset?: () => void;
};

export default function LeftPanel(props: Props) {
    const { onFileSelected, onUploaded, onReset } = props;

    const [state, setState] = useState<UploadState>({ status: "idle" });

    const file = useMemo(() => {
        if (state.status === "idle") {
            return null;
        }
        return state.file;
    }, [state]);

    const fileName = file?.name ?? "未选择";

    const fileId =
        state.status === "uploaded" ||
            state.status === "extracting" ||
            state.status === "done"
            ? state.fileId
            : null;

    const jobId = state.status === "done" ? state.jobId : null;

    const isUploading = state.status === "uploading";
    const isExtracting = state.status === "extracting";

    const canUpload =
        state.status === "idle" ||
        state.status === "selected";

    const canExtract = state.status === "uploaded";

    const uploadProps: UploadProps = {
        accept: "application/pdf",
        multiple: false,
        showUploadList: false,
        beforeUpload: (file) => {
            const isPdf =
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf");

            if (!isPdf) {
                message.error("只支持 PDF 文件");
                return Upload.LIST_IGNORE;
            }

            setState({
                status: "selected",
                file: file as File,
            });
            onFileSelected?.(file as File);
            return false;
        },
    };

    async function handleUpload(): Promise<void> {
        if (!file) {
            message.warning("请先选择 PDF 文件");
            return;
        }

        try {
            setState({
                status: "uploading",
                file,
            });

            const res = await uploadPdfMock(file);

            message.success("文件上传成功");

            setState({
                status: "uploaded",
                file,
                fileId: res.fileId,
            });
            onUploaded?.();
        } catch (error) {
            message.error("上传失败，请重试");

            setState({
                status: "selected",
                file,
            });
        }
    }

    async function handleExtract(): Promise<void> {
        if (state.status !== "uploaded") {
            message.warning("请先上传文件");
            return;
        }

        const { file, fileId } = state;

        try {
            setState({
                status: "extracting",
                file,
                fileId,
            });

            const res = await extractPdfMock(fileId);

            message.success("提取任务已启动");

            setState({
                status: "done",
                file,
                fileId,
                jobId: res.jobId,
            });
        } catch (error) {
            message.error("提取失败，请重试");

            setState({
                status: "uploaded",
                file,
                fileId,
            });
        }
    }

    function resetAll(): void {
        setState({ status: "idle" });
        onFileSelected?.(null);
        onReset?.();
    }

    return (
        <div style={{ width: 360 }}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Title level={4} style={{ margin: 0 }}>
                    步骤流程
                </Title>

                <Card size="small" title="步骤 1：选择 PDF 文件">
                    <Space direction="vertical" style={{ width: "100%" }} size={8}>
                        <Upload {...uploadProps}>
                            <div
                                style={{
                                    border: "1px dashed #91caff",
                                    borderRadius: 10,
                                    padding: 14,
                                    background: "#f0f7ff",
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <Text strong>点击此处选择 PDF 文件</Text>
                                <div style={{ marginTop: 6 }}>
                                    <Text type="secondary">已选择：</Text>{" "}
                                    <Tag color={file ? "blue" : "default"}>
                                        {fileName}
                                    </Tag>
                                </div>
                            </div>
                        </Upload>

                        <Space>
                            <Button
                                onClick={resetAll}
                                disabled={state.status === "idle"}
                            >
                                清空
                            </Button>

                            <Tag
                                color={
                                    state.status === "idle"
                                        ? "default"
                                        : state.status === "selected"
                                            ? "blue"
                                            : "green"
                                }
                            >
                                {state.status === "idle" && "未选择"}
                                {state.status === "selected" && "已选择"}
                                {(state.status === "uploaded" ||
                                    state.status === "extracting" ||
                                    state.status === "done") &&
                                    "已上传"}
                                {state.status === "uploading" && "上传中"}
                            </Tag>
                        </Space>
                    </Space>
                </Card>

                <Card size="small" title="步骤 2：上传文件">
                    <Space direction="vertical" style={{ width: "100%" }} size={10}>
                        <Text type="secondary">
                            选择文件后，点击上传。
                        </Text>

                        <Button
                            type="primary"
                            block
                            disabled={!file || !canUpload || isUploading || isExtracting}
                            loading={isUploading}
                            onClick={handleUpload}
                        >
                            上传 PDF
                        </Button>

                        {fileId && (
                            <Alert
                                showIcon
                                type="success"
                                message="文件上传成功"
                                description={
                                    <div>
                                        <Text type="secondary">File ID：</Text>
                                        <Text code>{fileId}</Text>
                                    </div>
                                }
                            />
                        )}
                    </Space>
                </Card>

                <Card size="small" title="步骤 3：提取内容">
                    <Space direction="vertical" style={{ width: "100%" }} size={10}>
                        <Text type="secondary">
                            文件已上传后，点击开始处理。
                        </Text>

                        <Button
                            type="primary"
                            block
                            style={{ background: "#16a34a" }}
                            disabled={!canExtract || isUploading || isExtracting}
                            loading={isExtracting}
                            onClick={handleExtract}
                        >
                            提取内容
                        </Button>

                        <Divider style={{ margin: "8px 0" }} />

                        {state.status === "extracting" && (
                            <Alert
                                showIcon
                                type="info"
                                message="正在提取中"
                                description="当前为 mock，后续可接 OCR / 任务队列"
                            />
                        )}

                        {jobId && (
                            <Alert
                                showIcon
                                type="success"
                                message="提取完成（mock）"
                                description={
                                    <div>
                                        <Text type="secondary">Job ID：</Text>
                                        <Text code>{jobId}</Text>
                                    </div>
                                }
                            />
                        )}
                    </Space>
                </Card>
            </Space>
        </div>
    );
}