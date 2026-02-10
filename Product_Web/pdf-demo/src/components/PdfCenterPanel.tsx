import React, { useEffect, useRef, useState } from "react";
import { Card, Typography, Spin } from "antd";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
const { Text } = Typography;

type Props = {
    file: File | null;
};

export default function PdfCenterPanel(props: Props) {
    const { file } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function renderAllPages(pdf: PDFDocumentProxy) {
            const container = containerRef.current;
            if (!container) return;

            container.innerHTML = "";

            const dpr = window.devicePixelRatio || 1;

            const wrapperPadding = 12;

            const availableWidth = Math.max(320, container.clientWidth - wrapperPadding * 2);

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
                if (cancelled) return;

                const page = await pdf.getPage(pageNum);

                const viewport1 = page.getViewport({ scale: 1 });

                const fitScale = availableWidth / viewport1.width;

                const viewport = page.getViewport({ scale: fitScale });

                const pageWrapper = document.createElement("div");
                pageWrapper.style.padding = `${wrapperPadding}px`;
                pageWrapper.style.display = "flex";
                pageWrapper.style.justifyContent = "center";

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;

                canvas.width = Math.floor(viewport.width * dpr);
                canvas.height = Math.floor(viewport.height * dpr);

                canvas.style.background = "white";
                canvas.style.borderRadius = "10px";
                canvas.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";

                pageWrapper.appendChild(canvas);
                container.appendChild(pageWrapper);

                if (!ctx) continue;

                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                await page.render({
                    canvas: canvas,
                    canvasContext: ctx,
                    viewport: viewport,
                }).promise;
            }
        }

        async function run() {
            setErrorMsg(null);

            const container = containerRef.current;
            if (container) {
                container.innerHTML = "";
            }

            if (!file) {
                return;
            }

            setLoading(true);

            try {
                const buf = await file.arrayBuffer();
                const pdf = await getDocument({ data: buf }).promise;
                if (cancelled) return;

                await renderAllPages(pdf);
            } catch (err) {
                if (cancelled) return;
                setErrorMsg("PDF 渲染失败，请确认文件是否损坏或不是标准 PDF。");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [file]);

    return (
        <Card
            style={{
                height: "100%",
                flex: 1,
                borderRadius: 12,
                overflow: "hidden",
            }}
            styles={{
                body: {
                    padding: 0,
                    height: "100%",
                },
            }}
        >
            <div
                style={{
                    height: "100%",
                    background: file ? "#111827" : "#1f2937",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.85)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: "rgba(255,255,255,0.85)" }}>
                        PDF 预览
                    </Text>
                    {file && (
                        <Text
                            style={{
                                color: "rgba(255,255,255,0.65)",
                                maxWidth: 360,
                            }}
                            ellipsis
                        >
                            {file.name}
                        </Text>
                    )}
                </div>

                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: file ? 0 : 24,
                    }}
                >
                    {!file && (
                        <div
                            style={{
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "rgba(255,255,255,0.7)",
                                fontSize: 16,
                            }}
                        >
                            PDF 未上传
                        </div>
                    )}

                    {file && (
                        <div style={{ position: "relative" }}>
                            {loading && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "rgba(0,0,0,0.35)",
                                        zIndex: 2,
                                    }}
                                >
                                    <Spin tip="正在渲染 PDF..." size="large" />
                                </div>
                            )}

                            {errorMsg && (
                                <div
                                    style={{
                                        padding: 16,
                                        color: "rgba(255,255,255,0.85)",
                                    }}
                                >
                                    {errorMsg}
                                </div>
                            )}

                            <div ref={containerRef} />
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}