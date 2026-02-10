import React, { useState } from "react";
import "antd/dist/reset.css";
import LeftPanel from "./components/LeftPanel";
import PdfCenterPanel from "./components/PdfCenterPanel";

export default function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    return (
        <div
            style={{
                height: "100vh",
                display: "flex",
                gap: 12,
                padding: 12,
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: 360,
                    overflow: "auto",
                }}
            >
                <LeftPanel
                    onFileSelected={(file) => {
                        setSelectedFile(file);
                    }}
                    onUploaded={() => {
                        setUploadedFile(selectedFile);
                    }}
                    onReset={() => {
                        setSelectedFile(null);
                        setUploadedFile(null);
                    }}
                />
            </div>

            <div style={{ flex: 1, overflow: "hidden" }}>
                <PdfCenterPanel file={uploadedFile} />
            </div>

            <div
                style={{
                    width: 380,
                    minHeight: "100%",
                    borderRadius: 12,
                    border: "1px solid #eee",
                    overflow: "auto",
                }}
            >
                {/* 右侧先空着 */}
            </div>
        </div>
    );
}