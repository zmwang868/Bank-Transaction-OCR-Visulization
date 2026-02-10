import React, { useState } from "react";
import "antd/dist/reset.css";
import LeftPanel from "./components/LeftPanel";
import PdfCenterPanel from "./components/PdfCenterPanel";

export default function App() {
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    return (
        <div style={{ display: "flex", gap: 12, padding: 12 }}>
            <div style={{ width: 360 }}>
                <LeftPanel onFileSelected={setPdfFile} />
            </div>

            <PdfCenterPanel file={pdfFile} />

            <div
                style={{
                    width: 380,
                    minHeight: 700,
                    borderRadius: 12,
                    border: "1px solid #eee",
                }}
            >
                {/* 右侧先空着 */}
            </div>
        </div>
    );
}